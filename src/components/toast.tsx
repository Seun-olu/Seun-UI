import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cx, focusRing } from "../lib/utils";

export type ToastTone = "info" | "success" | "error";
export interface ToastOptions { title: string; description?: string; tone?: ToastTone; duration?: number }
interface ToastItem extends Required<Omit<ToastOptions, "description">> { id: number; description?: string }

interface ToastApi { toast: (o: ToastOptions) => number; dismiss: (id: number) => void }
const Ctx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used inside <ToastProvider>");
  return c;
}

const tones: Record<ToastTone, string> = {
  info: "su:border-border",
  success: "su:border-success",
  error: "su:border-danger",
};

/**
 * Toasts are announced through two live regions that exist from first render
 * (polite for info/success, assertive for errors), which screen readers pick up
 * reliably. The visible stack is a labelled region with dismiss buttons.
 * Timers pause while the pointer or focus is inside the stack (WCAG 2.2.1).
 */
export function ToastProvider({ children, max = 3 }: { children: ReactNode; max?: number }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [announce, setAnnounce] = useState({ polite: "", assertive: "" });
  const [paused, setPaused] = useState(false);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((t) => t.id !== id)), []);
  const toast = useCallback((o: ToastOptions) => {
    const id = nextId.current++;
    const item: ToastItem = { id, title: o.title, description: o.description, tone: o.tone ?? "info", duration: o.duration ?? (o.tone === "error" ? 8000 : 5000) };
    setItems((xs) => [...xs, item].slice(-max));
    const text = [o.title, o.description].filter(Boolean).join(". ");
    setAnnounce((a) => (item.tone === "error" ? { ...a, assertive: text } : { ...a, polite: text }));
    return id;
  }, [max]);

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="su:sr-only" aria-live="polite" aria-atomic="true">{announce.polite}</div>
      <div className="su:sr-only" aria-live="assertive" aria-atomic="true">{announce.assertive}</div>
      {items.length > 0 && (
        <section aria-label="Notifications"
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false); }}
          className="su:fixed su:right-4 su:bottom-4 su:z-50 su:w-[min(24rem,calc(100vw-2rem))]">
          <ol className="su:m-0 su:flex su:list-none su:flex-col su:gap-2 su:p-0">
            {items.map((t) => <Toast key={t.id} item={t} paused={paused} onDismiss={() => dismiss(t.id)} />)}
          </ol>
        </section>
      )}
    </Ctx.Provider>
  );
}

function Toast({ item, paused, onDismiss }: { item: ToastItem; paused: boolean; onDismiss: () => void }) {
  const left = useRef(item.duration);
  useEffect(() => {
    if (paused || item.duration === Infinity) return;
    const started = Date.now();
    const t = setTimeout(onDismiss, left.current);
    return () => { clearTimeout(t); left.current -= Date.now() - started; };
  }, [paused, item.duration, onDismiss]);
  return (
    <li className={cx("su-animate-in su:flex su:items-start su:gap-3 su:rounded-control su:border-l-4 su:border su:bg-surface-raised su:p-3 su:text-fg su:shadow-lg", tones[item.tone])}>
      <div className="su:flex-1">
        <p className="su:m-0 su:text-sm su:font-semibold">{item.title}</p>
        {item.description && <p className="su:m-0 su:mt-0.5 su:text-sm su:text-fg-muted">{item.description}</p>}
      </div>
      <button type="button" onClick={onDismiss} aria-label={`Dismiss: ${item.title}`}
        className={cx("su:rounded-md su:border-0 su:bg-transparent su:p-1 su:text-fg-muted su:hover:bg-surface-muted", focusRing)}>
        <svg aria-hidden viewBox="0 0 16 16" className="su:size-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l8 8M12 4l-8 8" /></svg>
      </button>
    </li>
  );
}
