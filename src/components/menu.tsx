import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react-dom";
import {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
  type KeyboardEvent, type ReactNode, type RefObject,
} from "react";
import { cx, focusRing, mergeRefs } from "../lib/utils";
import { Button, type ButtonProps } from "./button";

interface MenuCtx {
  open: boolean;
  openMenu: (focus: "first" | "last") => void;
  close: (returnFocus?: boolean) => void;
  focusTarget: "first" | "last";
  triggerId: string;
  menuId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  setReference: (el: HTMLElement | null) => void;
}
const Ctx = createContext<MenuCtx | null>(null);
const useMenu = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("DropdownMenu parts must be inside <DropdownMenu>");
  return c;
};

/** Menu button pattern (WAI-ARIA APG): a button that opens a list of actions. */
export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<"first" | "last">("first");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [reference, setReference] = useState<HTMLElement | null>(null);
  const id = useId();
  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);
  const openMenu = useCallback((focus: "first" | "last") => { setFocusTarget(focus); setOpen(true); }, []);
  const value = useMemo<MenuCtx>(() => ({
    open, openMenu, close, focusTarget, triggerId: `${id}-trigger`, menuId: `${id}-menu`, triggerRef, setReference,
  }), [open, openMenu, close, focusTarget, id]);
  return <Ctx.Provider value={value}><MenuPosition reference={reference}>{children}</MenuPosition></Ctx.Provider>;
}

const PositionCtx = createContext<ReturnType<typeof useFloating> | null>(null);
function MenuPosition({ reference, children }: { reference: HTMLElement | null; children: ReactNode }) {
  const floating = useFloating({
    placement: "bottom-start", strategy: "fixed", middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate, elements: { reference },
  });
  return <PositionCtx.Provider value={floating}>{children}</PositionCtx.Provider>;
}

export function DropdownMenuTrigger({ children, ...props }: Omit<ButtonProps, "onClick" | "onKeyDown">) {
  const m = useMenu();
  return (
    <Button
      {...props}
      ref={mergeRefs(m.triggerRef, m.setReference)}
      id={m.triggerId}
      aria-haspopup="menu"
      aria-expanded={m.open}
      aria-controls={m.open ? m.menuId : undefined}
      onClick={() => (m.open ? m.close() : m.openMenu("first"))}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          m.openMenu(e.key === "ArrowDown" ? "first" : "last");
        }
      }}
    >
      {children}
      <svg aria-hidden viewBox="0 0 16 16" className="su:size-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
    </Button>
  );
}

const itemsOf = (menu: HTMLElement) =>
  [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].filter((el) => el.getAttribute("aria-disabled") !== "true");

export function DropdownMenuContent({ children, className }: { children: ReactNode; className?: string }) {
  const m = useMenu();
  const pos = useContext(PositionCtx)!;
  const ref = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });

  useEffect(() => {
    if (!m.open || !ref.current) return;
    const items = itemsOf(ref.current);
    (m.focusTarget === "first" ? items[0] : items.at(-1))?.focus();
  }, [m.open, m.focusTarget]);

  useEffect(() => {
    if (!m.open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !m.triggerRef.current?.contains(t)) m.close(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [m]);

  if (!m.open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = itemsOf(e.currentTarget);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const move = (n: number) => { e.preventDefault(); items[(n + items.length) % items.length]?.focus(); };
    switch (e.key) {
      case "ArrowDown": return move(i + 1);
      case "ArrowUp": return move(i - 1);
      case "Home": return move(0);
      case "End": return move(items.length - 1);
      case "Escape": e.preventDefault(); return m.close();
      case "Tab": return m.close(false);
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const now = Date.now();
          typed.current = { text: (now - typed.current.at < 500 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
          const order = [...items.slice(i + 1), ...items.slice(0, i + 1)];
          order.find((el) => el.textContent?.trim().toLowerCase().startsWith(typed.current.text))?.focus();
        }
    }
  };

  return (
    <div
      ref={mergeRefs(ref, pos.refs.setFloating)}
      id={m.menuId}
      role="menu"
      aria-labelledby={m.triggerId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={pos.floatingStyles}
      className={cx("su-animate-in su:z-50 su:min-w-44 su:rounded-control su:border su:border-border su:bg-surface-raised su:p-1 su:text-fg su:shadow-lg", className)}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onSelect, disabled, destructive }: {
  children: ReactNode; onSelect?: () => void; disabled?: boolean; destructive?: boolean;
}) {
  const m = useMenu();
  const activate = () => {
    if (disabled) return;
    m.close();
    onSelect?.();
  };
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      onClick={activate}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } }}
      className={cx(
        "su:flex su:cursor-default su:items-center su:gap-2 su:rounded-md su:px-2.5 su:py-1.5 su:text-sm su:select-none",
        "su:focus:bg-surface-muted su:aria-disabled:opacity-50", destructive && "su:text-danger", focusRing,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div role="separator" className="su:my-1 su:h-px su:bg-border" />;
}
