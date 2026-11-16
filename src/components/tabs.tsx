import { createContext, useContext, useId, useMemo, type KeyboardEvent, type ReactNode } from "react";
import { cx, focusRing, useControllableState } from "../lib/utils";

interface TabsCtx { value: string; setValue: (v: string) => void; baseId: string }
const Ctx = createContext<TabsCtx | null>(null);
const useTabs = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("Tab parts must be inside <Tabs>");
  return c;
};
const safe = (v: string) => v.replace(/[^a-zA-Z0-9_-]/g, "_");

export function Tabs({ value, defaultValue, onValueChange, children, className }: {
  value?: string; defaultValue: string; onValueChange?: (v: string) => void; children: ReactNode; className?: string;
}) {
  const [current, setValue] = useControllableState(value, defaultValue, onValueChange);
  const baseId = useId();
  const ctx = useMemo(() => ({ value: current, setValue, baseId }), [current, setValue, baseId]);
  return <Ctx.Provider value={ctx}><div className={className}>{children}</div></Ctx.Provider>;
}

/** Tabs pattern (APG) with automatic activation: arrows, Home and End move and select; only the selected tab is in the tab order. */
export function TabList({ children, "aria-label": label, className }: { children: ReactNode; "aria-label": string; className?: string }) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')];
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined || i < 0) return;
    e.preventDefault();
    const next = tabs[(to + tabs.length) % tabs.length];
    next?.focus();
    next?.click();
  };
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown}
      className={cx("su:flex su:gap-1 su:border-b su:border-border", className)}>
      {children}
    </div>
  );
}

export function Tab({ value, children, disabled }: { value: string; children: ReactNode; disabled?: boolean }) {
  const t = useTabs();
  const selected = t.value === value;
  return (
    <button type="button" role="tab" id={`${t.baseId}-tab-${safe(value)}`} aria-controls={`${t.baseId}-panel-${safe(value)}`}
      aria-selected={selected} tabIndex={selected ? 0 : -1} disabled={disabled} onClick={() => t.setValue(value)}
      className={cx(
        "su:-mb-px su:border-0 su:border-b-2 su:border-solid su:bg-transparent su:px-3 su:py-2 su:text-sm su:font-medium su:transition-colors su:disabled:opacity-50",
        selected ? "su:border-accent su:text-fg" : "su:border-transparent su:text-fg-muted su:hover:text-fg", focusRing,
      )}>
      {children}
    </button>
  );
}

export function TabPanel({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const t = useTabs();
  if (t.value !== value) return null;
  return (
    <div role="tabpanel" id={`${t.baseId}-panel-${safe(value)}`} aria-labelledby={`${t.baseId}-tab-${safe(value)}`} tabIndex={0}
      className={cx("su:py-4 su:text-fg", focusRing, className)}>
      {children}
    </div>
  );
}
