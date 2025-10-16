interface StatusMetaOptions {
  badgeBaseClass?: string;
  pinnedClass?: string;
  deprecatedClass?: string;
  defaultClass?: string;
}

interface StatusMeta {
  status?: string;
  isPinned: boolean;
  isDeprecated: boolean;
  badgeClass?: string;
}

const DEFAULT_BADGE_BASE = "text-xs font-semibold border border-dashed px-1 rounded";
const DEFAULT_PINNED = "text-lime-500 border-lime-500/40 bg-lime-500/10";
const DEFAULT_DEPRECATED = "text-red-500 border-red-500/60 bg-red-500/10";
const DEFAULT_NEUTRAL = "text-muted border-muted/60 bg-muted/10";

export function getStatusMeta(status?: string, options: StatusMetaOptions = {}): StatusMeta {
  const isPinned = status === "pinned";
  const isDeprecated = status === "deprecated";

  const badgeBase = options.badgeBaseClass ?? DEFAULT_BADGE_BASE;
  const pinnedClass = options.pinnedClass ?? DEFAULT_PINNED;
  const deprecatedClass = options.deprecatedClass ?? DEFAULT_DEPRECATED;
  const neutralClass = options.defaultClass ?? DEFAULT_NEUTRAL;

  let badgeClass: string | undefined;
  if (status) {
    if (isPinned) {
      badgeClass = `${badgeBase} ${pinnedClass}`;
    } else if (isDeprecated) {
      badgeClass = `${badgeBase} ${deprecatedClass}`;
    } else {
      badgeClass = `${badgeBase} ${neutralClass}`;
    }
  }

  return {
    status,
    isPinned,
    isDeprecated,
    badgeClass,
  };
}

export function getStatusWeight(status?: string): number {
  if (status === "pinned") {
    return 1;
  }
  return 0;
}
