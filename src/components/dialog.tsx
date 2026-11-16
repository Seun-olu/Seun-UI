import { cloneElement, useEffect, useId, useRef, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { cx, focusRing, useControllableState } from "../lib/utils";

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the dialog; it receives onClick and aria-haspopup, and gets focus back on close. */
  trigger?: ReactElement<{ onClick?: (e: MouseEvent) => void; "aria-haspopup"?: string }>;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Close on Escape and backdrop click. Default true. */
  dismissible?: boolean;
  closeLabel?: string;
  className?: string;
}

/**
 * Modal dialog on the native <dialog> element: showModal() makes the rest of the
 * page inert (focus and screen readers stay inside) and puts it in the top layer.
 * This component adds state syncing, labelling, backdrop dismissal and focus return.
 */
export function Dialog({
  open, defaultOpen = false, onOpenChange, trigger, title, description, children, footer, dismissible = true, closeLabel = "Close", className,
}: DialogProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const openRef = useRef(isOpen);
  const id = useId();

  useEffect(() => {
    openRef.current = isOpen;
    const d = ref.current;
    if (!d) return;
    if (isOpen && !d.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      d.showModal();
    } else if (!isOpen && d.open) {
      d.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault(); // keep React state the source of truth
      if (dismissible) setOpen(false);
    };
    const onClose = () => {
      if (openRef.current) setOpen(false); // closed by the browser (e.g. a form method="dialog")
      const el = returnTo.current;
      returnTo.current = null;
      if (el && el.isConnected) el.focus();
    };
    d.addEventListener("cancel", onCancel);
    d.addEventListener("close", onClose);
    return () => { d.removeEventListener("cancel", onCancel); d.removeEventListener("close", onClose); };
  }, [dismissible, setOpen]);

  return (
    <>
      {trigger && cloneElement(trigger, {
        "aria-haspopup": "dialog",
        onClick: (e: MouseEvent) => { trigger.props.onClick?.(e); setOpen(true); },
      })}
      <dialog
        ref={ref}
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        onClick={(e) => { if (dismissible && e.target === e.currentTarget) setOpen(false); }}
        className={cx(
          "su-dialog su-animate-in su:m-auto su:w-[min(32rem,calc(100vw-2rem))] su:rounded-xl su:border su:border-border su:bg-surface-raised su:p-0 su:text-fg su:shadow-xl",
          className,
        )}
      >
        {isOpen && (
          <div className="su:flex su:flex-col su:gap-4 su:p-6">
            <div className="su:flex su:items-start su:justify-between su:gap-4">
              <div className="su:flex su:flex-col su:gap-1">
                <h2 id={`${id}-title`} className="su:m-0 su:text-lg su:font-semibold">{title}</h2>
                {description && <p id={`${id}-desc`} className="su:m-0 su:text-sm su:text-fg-muted">{description}</p>}
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={closeLabel}
                className={cx("su:-m-1 su:rounded-md su:border-0 su:bg-transparent su:p-1 su:text-fg-muted su:hover:bg-surface-muted su:hover:text-fg", focusRing)}>
                <svg aria-hidden viewBox="0 0 16 16" className="su:size-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </div>
            {children && <div className="su:text-sm">{children}</div>}
            {footer && <div className="su:flex su:justify-end su:gap-2">{footer}</div>}
          </div>
        )}
      </dialog>
    </>
  );
}
