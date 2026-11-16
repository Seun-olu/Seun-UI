import { useCallback, useState, type Ref } from "react";

/** Joins class names, skipping falsy values. */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

/** Shared focus ring for interactive controls. */
export const focusRing = "su:outline-none su:focus-visible:ring-2 su:focus-visible:ring-focus su:focus-visible:ring-offset-2 su:focus-visible:ring-offset-surface";

/**
 * Controlled/uncontrolled state in one hook: if `value` is provided the parent owns
 * it; otherwise the component keeps its own, starting at `defaultValue`.
 */
export function useControllableState<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const set = useCallback((next: T) => {
    if (!controlled) setInner(next);
    onChange?.(next);
  }, [controlled, onChange]);
  return [current, set] as const;
}

/** Assigns one node to several refs (callback or object). */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}
