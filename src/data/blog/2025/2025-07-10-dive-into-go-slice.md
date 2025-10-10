---
title: 探究 Slice
desc: 粗浅探究 Slice 在 Go 中的行为模式（基于 Go 1.24）
slug: dive-into-go-slice
pubdate: 2025-07-10
categories:
  - Tech 技术
tags:
  - go
---

> 以下内容基于 Go 1.24

## Slice 数据结构

```go
type slice struct {
    array unsafe.Pointer
    len   int
    cap   int
}
```

## Slice 操作

由于切片 slice 是对底层数组操作，应及时将所需数据 copy 到较小的 slice，以便释放超大号底层数组内存。

```go
oldSlice := largeSlice[:10]
newSlice := make([]byte, len(oldSlice))
copy(newSlice, oldSlice)
```

Go 1.21 在标准库中新增了 `slices` 包，其中 `Clip` 函数可以将切片的 **capacity** 调整为当前的 **length**，换句话说，`s = slices.Clip(s)` 等同于 `s = s[:len(s):len(s)]`，目的是去掉切片尾部“不用”的多余内存，使底层数组缩小。

```go
large := make([]int, 1<<10)
clipped := slices.Clip(large[:10])
```

> [!TIP]
>
> 数组 or 切片转字符串：
>
> ```go
> strings.Replace(strings.Trim(fmt.Sprint(array_or_slice), "[]"), " ", ",", -1)
> ```

## Slice 扩容策略

首先找到对应的源码，`runtime/slice.go` 中的 `growslice` 函数进行了扩容操作，它根据 `nextslicecap` 算出的结果，去进行实际的内存计算（`et.Size_` 参与的部分）、向上取整到内存规格（`roundupsize`）、分配内存（`mallocgc`）和拷贝数据（`memmove`）。

### `nextslicecap`

此函数也在 `runtime/slice.go` 中：

```go
// nextslicecap computes the next appropriate slice length.
func nextslicecap(newLen, oldCap int) int {
 newcap := oldCap
 doublecap := newcap + newcap
 if newLen > doublecap {
  return newLen
 }

 const threshold = 256
 if oldCap < threshold {
  return doublecap
 }
 for {
  // Transition from growing 2x for small slices
  // to growing 1.25x for large slices. This formula
  // gives a smooth-ish transition between the two.
  newcap += (newcap + 3*threshold) >> 2

  // We need to check `newcap >= newLen` and whether `newcap` overflowed.
  // newLen is guaranteed to be larger than zero, hence
  // when newcap overflows then `uint(newcap) > uint(newLen)`.
  // This allows to check for both with the same comparison.
  if uint(newcap) >= uint(newLen) {
   break
  }
 }

 // Set newcap to the requested cap when
 // the newcap calculation overflowed.
 if newcap <= 0 {
  return newLen
 }
 return newcap
}
```

简单来讲分两类：

- 当 oldCap < 256 → newCap = oldCap * 2
- 当 oldCap ≥ 256 → newCap = oldCap + (oldCap + 3*256)/4 即 1.25×oldCap + 192

接下来看实际情况，假如有以下代码片段：

```go
s := []int{1, 2}
s = append(s, 3, 4, 5)
fmt.Printf("%d %d", len(s), cap(s))
```

按照理想情况，创建切片时 len/cap 分别是 2/2，第一次扩容后为 4/4，继续扩容到 5/8。然而实际输出却是 **5/6**！

### `roundupsize`

之所以会与预期不符是因为在算出扩容结果后还要进行一步内存对齐，`roundupsize` 函数在 `runtime/msize.go` 中：

```go
// Returns size of the memory block that mallocgc will allocate if you ask for the size,
// minus any inline space for metadata.
func roundupsize(size uintptr, noscan bool) (reqSize uintptr) {
 reqSize = size
 if reqSize <= maxSmallSize-mallocHeaderSize {
  // Small object.
  if !noscan && reqSize > minSizeForMallocHeader { // !noscan && !heapBitsInSpan(reqSize)
   reqSize += mallocHeaderSize
  }
  // (reqSize - size) is either mallocHeaderSize or 0. We need to subtract mallocHeaderSize
  // from the result if we have one, since mallocgc will add it back in.
  if reqSize <= smallSizeMax-8 {
   return uintptr(class_to_size[size_to_class8[divRoundUp(reqSize, smallSizeDiv)]]) - (reqSize - size)
  }
  return uintptr(class_to_size[size_to_class128[divRoundUp(reqSize-smallSizeMax, largeSizeDiv)]]) - (reqSize - size)
 }
 // Large object. Align reqSize up to the next page. Check for overflow.
 reqSize += pageSize - 1
 if reqSize < size {
  return size
 }
 return reqSize &^ (pageSize - 1)
}
```

可以看出也是分两种情况：

1. Small Object

   如果申请的内存大小 `size` 小于一个阈值（`maxSmallSize`，通常是 32KB），Go 会认为它是一个“小对象”。

   代码 `uintptr(class_to_size[size_to_class8[...]])` 的核心作用是**查找规格表**。Go 运行时内部有几张预先计算好的表（详情见 `runtime/sizeclasses.go`）：

   - `size_to_classX`: 这个表可以根据你申请的字节数，快速计算出它属于哪个“规格等级”。
   - `class_to_size`: 这个表则根据“规格等级”，返回该等级对应的标准内存块大小。

2. Large Object

   如果申请的内存大于 32KB，Go 会认为它是一个“大对象”。处理方式反而更简单：

   页对齐 （Page Alignment）：代码 `return reqSize &^ (pageSize - 1)` 的作用是将申请的内存大小向上取整到系统内存页 （`pageSize`，通常是 4KB 或 8KB）的整数倍。

   对于大块内存，以操作系统的内存页为单位进行管理，可以更高效地与虚拟内存系统交互，减少管理开销。

回到前面的问题，我们将需要的内存 `reqSize`（5*8）以及一些常数带入 `class_to_size[size_to_class8[divRoundUp(reqSize, smallSizeDiv)]]`，得到 `class_to_size[size_to_class8[divRoundUp(40, 8)]]` --> `class_to_size[size_to_class8[5]]` --> 48。由于切片内的元素类型是 int（8B），所以 cap = 48/8 = 6。

附上**规格表**主要内容：

```go
const (
 minHeapAlign    = 8
 _MaxSmallSize   = 32768
 smallSizeDiv    = 8
 smallSizeMax    = 1024
 largeSizeDiv    = 128
 _NumSizeClasses = 68
 _PageShift      = 13
 maxObjsPerSpan  = 1024
)

var class_to_size = [_NumSizeClasses]uint16{0, 8, 16, 24, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 288, 320, 352, 384, 416, 448, 480, 512, 576, 640, 704, 768, 896, 1024, 1152, 1280, 1408, 1536, 1792, 2048, 2304, 2688, 3072, 3200, 3456, 4096, 4864, 5376, 6144, 6528, 6784, 6912, 8192, 9472, 9728, 10240, 10880, 12288, 13568, 14336, 16384, 18432, 19072, 20480, 21760, 24576, 27264, 28672, 32768}
var class_to_allocnpages = [_NumSizeClasses]uint8{0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 3, 2, 3, 1, 3, 2, 3, 4, 5, 6, 1, 7, 6, 5, 4, 3, 5, 7, 2, 9, 7, 5, 8, 3, 10, 7, 4}
var class_to_divmagic = [_NumSizeClasses]uint32{0, ^uint32(0)/8 + 1, ^uint32(0)/16 + 1, ^uint32(0)/24 + 1, ^uint32(0)/32 + 1, ^uint32(0)/48 + 1, ^uint32(0)/64 + 1, ^uint32(0)/80 + 1, ^uint32(0)/96 + 1, ^uint32(0)/112 + 1, ^uint32(0)/128 + 1, ^uint32(0)/144 + 1, ^uint32(0)/160 + 1, ^uint32(0)/176 + 1, ^uint32(0)/192 + 1, ^uint32(0)/208 + 1, ^uint32(0)/224 + 1, ^uint32(0)/240 + 1, ^uint32(0)/256 + 1, ^uint32(0)/288 + 1, ^uint32(0)/320 + 1, ^uint32(0)/352 + 1, ^uint32(0)/384 + 1, ^uint32(0)/416 + 1, ^uint32(0)/448 + 1, ^uint32(0)/480 + 1, ^uint32(0)/512 + 1, ^uint32(0)/576 + 1, ^uint32(0)/640 + 1, ^uint32(0)/704 + 1, ^uint32(0)/768 + 1, ^uint32(0)/896 + 1, ^uint32(0)/1024 + 1, ^uint32(0)/1152 + 1, ^uint32(0)/1280 + 1, ^uint32(0)/1408 + 1, ^uint32(0)/1536 + 1, ^uint32(0)/1792 + 1, ^uint32(0)/2048 + 1, ^uint32(0)/2304 + 1, ^uint32(0)/2688 + 1, ^uint32(0)/3072 + 1, ^uint32(0)/3200 + 1, ^uint32(0)/3456 + 1, ^uint32(0)/4096 + 1, ^uint32(0)/4864 + 1, ^uint32(0)/5376 + 1, ^uint32(0)/6144 + 1, ^uint32(0)/6528 + 1, ^uint32(0)/6784 + 1, ^uint32(0)/6912 + 1, ^uint32(0)/8192 + 1, ^uint32(0)/9472 + 1, ^uint32(0)/9728 + 1, ^uint32(0)/10240 + 1, ^uint32(0)/10880 + 1, ^uint32(0)/12288 + 1, ^uint32(0)/13568 + 1, ^uint32(0)/14336 + 1, ^uint32(0)/16384 + 1, ^uint32(0)/18432 + 1, ^uint32(0)/19072 + 1, ^uint32(0)/20480 + 1, ^uint32(0)/21760 + 1, ^uint32(0)/24576 + 1, ^uint32(0)/27264 + 1, ^uint32(0)/28672 + 1, ^uint32(0)/32768 + 1}
var size_to_class8 = [smallSizeMax/smallSizeDiv + 1]uint8{0, 1, 2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 29, 29, 29, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32}
var size_to_class128 = [(_MaxSmallSize-smallSizeMax)/largeSizeDiv + 1]uint8{32, 33, 34, 35, 36, 37, 37, 38, 38, 39, 39, 40, 40, 40, 41, 41, 41, 42, 43, 43, 44, 44, 44, 44, 44, 45, 45, 45, 45, 45, 45, 46, 46, 46, 46, 47, 47, 47, 47, 47, 47, 48, 48, 48, 49, 49, 50, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 53, 53, 54, 54, 54, 54, 55, 55, 55, 55, 55, 56, 56, 56, 56, 56, 56, 56, 56, 56, 56, 56, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 58, 58, 58, 58, 58, 58, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 61, 61, 61, 61, 61, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67}
```

## 参考

- <https://go.dev/src/runtime/slice.go>
- <https://go.dev/src/runtime/msize.go>
- <https://go.dev/src/runtime/sizeclasses.go>
- <https://www.jianshu.com/p/030aba2bff41>
