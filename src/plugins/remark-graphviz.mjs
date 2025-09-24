import { visit } from 'unist-util-visit';
import { instance } from '@viz-js/viz';

export default function remarkGraphviz() {
  return async (tree) => {
    const viz = await instance();
    const promises = [];

    visit(tree, 'code', (node) => {
      if (node.lang === 'graphviz' || node.lang === 'dot') {
        promises.push(
          (async () => {
            const svg = await viz.renderString(node.value, { format: 'svg' });
            node.type = 'html';
            node.value = makeResponsive(svg);
            delete node.lang;
            delete node.meta;
            delete node.children;
          })()
        );
      }
    });

    await Promise.all(promises);
  };
}

function makeResponsive(svg) {
  return svg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
    const widthMatch = attrs.match(/\swidth="([^"]*)"/i);
    const heightMatch = attrs.match(/\sheight="([^"]*)"/i);

    const widthValue = widthMatch?.[1];
    const heightValue = heightMatch?.[1];

    let newAttrs = attrs
      .replace(/\swidth="[^"]*"/gi, '')
      .replace(/\sheight="[^"]*"/gi, '');

    if (/\sclass="/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/\sclass="([^"]*)"/i, (_, classes) => ` class="${classes} graphviz-figure"`);
    } else {
      newAttrs += ' class="graphviz-figure"';
    }

    const desiredWidth = widthValue ? `min(100%, ${widthValue})` : '100%';
    const responsiveStyle = `width:${desiredWidth};height:auto;display:block;`;

    if (/\sstyle="/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/\sstyle="([^"]*)"/i, (_, styles) => ` style="${styles} ${responsiveStyle}"`);
    } else {
      newAttrs += ` style="${responsiveStyle}"`;
    }

    if (!/\spreserveAspectRatio=/i.test(newAttrs)) {
      newAttrs += ' preserveAspectRatio="xMidYMid meet"';
    }

    return `<svg${newAttrs}>`;
  });
}
