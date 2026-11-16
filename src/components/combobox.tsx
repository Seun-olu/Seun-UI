import { autoUpdate, flip, offset, size, useFloating } from "@floating-ui/react-dom";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cx, focusRing, mergeRefs, useControllableState } from "../lib/utils";

export interface ComboboxOption { value: string; label: string; disabled?: boolean }

export interface ComboboxProps {
  label: ReactNode;
  options: ComboboxOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  description?: ReactNode;
  emptyMessage?: string;
  /** Custom matching; defaults to a case-insensitive "contains" on the label. */
  filter?: (option: ComboboxOption, query: string) => boolean;
  name?: string;
  disabled?: boolean;
}

const defaultFilter = (o: ComboboxOption, q: string) => o.label.toLowerCase().includes(q.trim().toLowerCase());

/**
 * Editable combobox with list autocomplete (WAI-ARIA 1.2). Focus stays in the
 * input; the highlighted option is exposed with aria-activedescendant.
 * Keys: ArrowDown/ArrowUp open and move, Enter picks, Escape closes then clears,
 * Alt+ArrowDown opens without moving. Leaving the field restores the chosen label.
 */
export function Combobox({
  label, options, value, defaultValue = null, onValueChange, placeholder, description, emptyMessage = "No results", filter = defaultFilter, name, disabled,
}: ComboboxProps) {
  const id = useId();
  const listId = `${id}-listbox`;
  const [selected, setSelected] = useControllableState<string | null>(value, defaultValue, onValueChange);
  const selectedLabel = options.find((o) => o.value === selected)?.label ?? "";
  const [query, setQuery] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start", strategy: "fixed", whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), size({ apply: ({ rects, elements }) => { elements.floating.style.width = `${rects.reference.width}px`; } })],
  });

  const results = useMemo(() => (typing ? options.filter((o) => filter(o, query)) : options), [typing, options, filter, query]);
  const enabled = results.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

  // Keep the visible text in sync when the value changes from outside.
  const [lastLabel, setLastLabel] = useState(selectedLabel);
  if (lastLabel !== selectedLabel) { setLastLabel(selectedLabel); setQuery(selectedLabel); }

  useEffect(() => {
    if (open && active >= 0) listRef.current?.querySelector(`#${CSS.escape(`${id}-opt-${active}`)}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, id]);

  const openList = (highlight: "first" | "last" | "selected" | "none") => {
    setOpen(true);
    const sel = results.findIndex((o) => o.value === selected);
    setActive(highlight === "first" ? enabled[0] ?? -1 : highlight === "last" ? enabled.at(-1) ?? -1 : highlight === "selected" ? sel : -1);
  };
  const close = () => { setOpen(false); setActive(-1); setTyping(false); };
  const choose = (o: ComboboxOption) => {
    if (o.disabled) return;
    setSelected(o.value);
    setQuery(o.label);
    close();
  };
  const step = (dir: 1 | -1) => {
    if (!enabled.length) return;
    const pos = enabled.indexOf(active);
    setActive(enabled[pos < 0 ? (dir === 1 ? 0 : enabled.length - 1) : (pos + dir + enabled.length) % enabled.length]!);
  };

  return (
    <div className="su:flex su:flex-col su:gap-1.5">
      <label id={`${id}-label`} htmlFor={id} className="su:text-sm su:font-medium su:text-fg">{label}</label>
      <input
        ref={mergeRefs(inputRef, refs.setReference)}
        id={id}
        role="combobox"
        type="text"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-describedby={description ? `${id}-desc` : undefined}
        placeholder={placeholder}
        disabled={disabled}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setTyping(true); setOpen(true); setActive(-1); if (e.target.value === "") setSelected(null); }}
        onClick={() => (open ? close() : openList("selected"))}
        onBlur={() => { close(); setQuery(selectedLabel); }}
        onKeyDown={(e) => {
          switch (e.key) {
            case "ArrowDown":
              e.preventDefault();
              if (!open) openList(e.altKey ? "none" : selected ? "selected" : "first"); else step(1);
              break;
            case "ArrowUp":
              e.preventDefault();
              if (!open) openList("last"); else step(-1);
              break;
            case "Enter":
              if (open && active >= 0 && results[active]) { e.preventDefault(); choose(results[active]); }
              break;
            case "Escape":
              if (open) { e.preventDefault(); close(); setQuery(selectedLabel); }
              else if (query) { e.preventDefault(); setQuery(""); setSelected(null); }
              break;
            case "Tab":
              close();
          }
        }}
        className={cx("su:h-10 su:w-full su:rounded-control su:border su:border-border su:bg-surface su:px-3 su:text-sm su:text-fg su:disabled:opacity-50", focusRing)}
      />
      {description && <p id={`${id}-desc`} className="su:text-xs su:text-fg-muted">{description}</p>}
      {name && <input type="hidden" name={name} value={selected ?? ""} />}
      <ul
        ref={mergeRefs(listRef, refs.setFloating)}
        id={listId}
        role="listbox"
        aria-labelledby={`${id}-label`}
        hidden={!open || results.length === 0}
        style={floatingStyles}
        className="su:z-50 su:m-0 su:max-h-64 su:list-none su:overflow-auto su:rounded-control su:border su:border-border su:bg-surface-raised su:p-1 su:text-fg su:shadow-lg"
      >
        {results.map((o, i) => (
          <li key={o.value} id={`${id}-opt-${i}`} role="option" aria-selected={o.value === selected} aria-disabled={o.disabled || undefined}
            onMouseDown={(e) => e.preventDefault()} onClick={() => choose(o)} onMouseMove={() => !o.disabled && setActive(i)}
            className={cx(
              "su:flex su:cursor-default su:items-center su:justify-between su:rounded-md su:px-2.5 su:py-1.5 su:text-sm",
              i === active && "su:bg-surface-muted", o.disabled && "su:opacity-50",
            )}>
            {o.label}
            {o.value === selected && <svg aria-hidden viewBox="0 0 16 16" className="su:size-3.5 su:text-accent" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3 3 7-7" /></svg>}
          </li>
        ))}
      </ul>
      {open && results.length === 0 && (
        <p role="status" className="su:m-0 su:text-sm su:text-fg-muted">{emptyMessage}</p>
      )}
    </div>
  );
}
