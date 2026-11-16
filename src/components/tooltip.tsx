import { autoUpdate, flip, offset, shift, useFloating, type Placement } from "@floating-ui/react-dom";
import { cloneElement, useEffect, useId, useState, type FocusEvent, type ReactElement, type ReactNode } from "react";
import { cx, mergeRefs } from "../lib/utils";

type TriggerProps = {
  "aria-describedby"?: string;
  onMouseEnter?: (e: unknown) => void; onMouseLeave?: (e: unknown) => void;
  onFocus?: (e: FocusEvent) => void; onBlur?: (e: FocusEvent) => void;
  ref?: React.Ref<HTMLElement>;
};

export interface TooltipProps {
  /** Short supplementary text. Never put essential information or interactive content in a tooltip. */
  content: ReactNode;
  children: ReactElement<TriggerProps>;
  placement?: Placement;
  delay?: number;
}

/**
 * Hover/focus tooltip (role="tooltip"). The trigger is always described by the
 * tooltip text, so screen readers get it on focus. Meets WCAG 1.4.13: Escape
 * dismisses it, and the pointer can move onto the tooltip without it closing.
 */
export function Tooltip({ content, children, placement = "top", delay = 300 }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const { floatingStyles } = useFloating({
    placement, strategy: "fixed", middleware: [offset(6), flip(), shift({ padding: 8 })], whileElementsMounted: autoUpdate,
    elements: { reference: anchor, floating: panel },
  });

  // Requests to open/close after a delay; a newer request replaces (cancels) the pending one.
  const [intent, setIntent] = useState({ open: false, wait: 0 });
  useEffect(() => {
    const t = setTimeout(() => setOpen(intent.open), intent.wait);
    return () => clearTimeout(t);
  }, [intent]);
  const show = (wait: number) => setIntent({ open: true, wait });
  const hide = (wait = 100) => setIntent({ open: false, wait });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIntent({ open: false, wait: 0 }); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const p = children.props;
  return (
    <>
      {cloneElement(children, {
        ref: mergeRefs(p.ref, setAnchor),
        "aria-describedby": [p["aria-describedby"], id].filter(Boolean).join(" "),
        onMouseEnter: (e) => { p.onMouseEnter?.(e); show(delay); },
        onMouseLeave: (e) => { p.onMouseLeave?.(e); hide(); },
        onFocus: (e) => { p.onFocus?.(e); show(0); },
        onBlur: (e) => { p.onBlur?.(e); hide(0); },
      })}
      <div
        ref={setPanel}
        id={id}
        role="tooltip"
        hidden={!open}
        style={floatingStyles}
        onMouseEnter={() => show(0)}
        onMouseLeave={() => hide()}
        className={cx("su-animate-in su:z-50 su:max-w-64 su:rounded-md su:bg-fg su:px-2 su:py-1 su:text-xs su:text-surface su:shadow")}
      >
        {content}
      </div>
    </>
  );
}
