import {
  forwardRef, useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { cx, focusRing, mergeRefs, useControllableState } from "../lib/utils";

interface FieldProps {
  label: ReactNode;
  /** Helper text, linked with aria-describedby. */
  description?: ReactNode;
  /** Error text; also sets aria-invalid. */
  error?: ReactNode;
}

const control = cx(
  "su:w-full su:rounded-control su:border su:border-border su:bg-surface su:px-3 su:text-sm su:text-fg su:placeholder:text-fg-muted",
  "su:disabled:cursor-not-allowed su:disabled:opacity-50 su:aria-invalid:border-danger",
  focusRing,
);

/** Label + description + error wiring shared by every text-like control. */
function useField({ description, error }: Omit<FieldProps, "label">, idProp?: string) {
  const auto = useId();
  const id = idProp ?? auto;
  const descId = description ? `${id}-description` : undefined;
  const errId = error ? `${id}-error` : undefined;
  return { id, descId, errId, describedBy: [descId, errId].filter(Boolean).join(" ") || undefined };
}

function FieldFrame({ id, label, required, description, error, descId, errId, children }: FieldProps & {
  id: string; required?: boolean; descId?: string; errId?: string; children: ReactNode;
}) {
  return (
    <div className="su:flex su:flex-col su:gap-1.5">
      <label htmlFor={id} className="su:text-sm su:font-medium su:text-fg">
        {label}{required && <span aria-hidden className="su:ml-0.5 su:text-danger">*</span>}
      </label>
      {children}
      {description && <p id={descId} className="su:text-xs su:text-fg-muted">{description}</p>}
      {error && <p id={errId} className="su:text-xs su:font-medium su:text-danger">{error}</p>}
    </div>
  );
}

export type TextFieldProps = FieldProps & InputHTMLAttributes<HTMLInputElement>;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, description, error, id: idProp, className, required, ...rest }, ref,
) {
  const f = useField({ description, error }, idProp);
  return (
    <FieldFrame {...f} label={label} description={description} error={error} required={required}>
      <input ref={ref} id={f.id} required={required} aria-invalid={error ? true : undefined} aria-describedby={f.describedBy}
        className={cx(control, "su:h-10", className)} {...rest} />
    </FieldFrame>
  );
});

export type TextareaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, description, error, id: idProp, className, required, rows = 4, ...rest }, ref,
) {
  const f = useField({ description, error }, idProp);
  return (
    <FieldFrame {...f} label={label} description={description} error={error} required={required}>
      <textarea ref={ref} id={f.id} rows={rows} required={required} aria-invalid={error ? true : undefined} aria-describedby={f.describedBy}
        className={cx(control, "su:py-2", className)} {...rest} />
    </FieldFrame>
  );
});

export interface SelectOption { value: string; label: string; disabled?: boolean }
export type SelectProps = FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[]; placeholder?: string };

/** A styled native <select>: the platform picker is the most accessible option on every device. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, description, error, id: idProp, className, required, options, placeholder, ...rest }, ref,
) {
  const f = useField({ description, error }, idProp);
  return (
    <FieldFrame {...f} label={label} description={description} error={error} required={required}>
      <select ref={ref} id={f.id} required={required} aria-invalid={error ? true : undefined} aria-describedby={f.describedBy}
        className={cx(control, "su:h-10", className)} {...rest}>
        {placeholder !== undefined && <option value="" disabled={required}>{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
    </FieldFrame>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
  /** Mixed state, e.g. "some rows selected". Set via the DOM property, as HTML has no attribute for it. */
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, indeterminate = false, id: idProp, className, ...rest }, ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  const inner = useRef<HTMLInputElement>(null);
  useEffect(() => { if (inner.current) inner.current.indeterminate = indeterminate; }, [indeterminate]);
  return (
    <div className={cx("su:flex su:items-start su:gap-2", className)}>
      <input ref={mergeRefs(ref, inner)} id={id} type="checkbox" aria-describedby={description ? `${id}-description` : undefined}
        className={cx("su:mt-0.5 su:size-4 su:shrink-0 su:accent-accent su:disabled:opacity-50", focusRing)} {...rest} />
      <div className="su:flex su:flex-col">
        <label htmlFor={id} className="su:text-sm su:text-fg">{label}</label>
        {description && <p id={`${id}-description`} className="su:text-xs su:text-fg-muted">{description}</p>}
      </div>
    </div>
  );
});

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLButtonElement>, "onChange" | "value" | "defaultValue" | "type"> {
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Submitted as "on" when checked, like a checkbox. */
  name?: string;
}

/** An on/off toggle (role="switch"). Space and Enter toggle it, as for any button. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { label, checked, defaultChecked = false, onCheckedChange, name, disabled, id: idProp, className, ...rest }, ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  const [on, setOn] = useControllableState(checked, defaultChecked, onCheckedChange);
  return (
    <div className={cx("su:inline-flex su:items-center su:gap-2", className)}>
      <button ref={ref} id={id} type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => setOn(!on)}
        className={cx(
          "su:relative su:inline-flex su:h-6 su:w-11 su:border-0 su:p-0 su:shrink-0 su:items-center su:rounded-full su:transition-colors su:disabled:opacity-50",
          on ? "su:bg-accent" : "su:bg-border", focusRing,
        )} {...rest}>
        <span aria-hidden className={cx("su:inline-block su:size-5 su:rounded-full su:bg-surface su:shadow su:transition-transform", on ? "su:translate-x-5.5" : "su:translate-x-0.5")} />
      </button>
      <label htmlFor={id} className="su:text-sm su:text-fg">{label}</label>
      {name && on && <input type="hidden" name={name} value="on" />}
    </div>
  );
});

export interface RadioGroupProps {
  legend: ReactNode;
  name: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  orientation?: "vertical" | "horizontal";
}

/** Native radios in a fieldset: arrow-key movement and form submission come from the browser. */
export function RadioGroup({ legend, name, options, value, defaultValue = "", onValueChange, description, error, required, orientation = "vertical" }: RadioGroupProps) {
  const id = useId();
  const [current, setCurrent] = useControllableState(value, defaultValue, onValueChange);
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset aria-describedby={describedBy} aria-invalid={error ? true : undefined} className="su:m-0 su:min-w-0 su:border-0 su:p-0">
      <legend className="su:mb-2 su:p-0 su:text-sm su:font-medium su:text-fg">{legend}{required && <span aria-hidden className="su:ml-0.5 su:text-danger">*</span>}</legend>
      <div className={cx("su:flex su:gap-2", orientation === "vertical" ? "su:flex-col" : "su:flex-row su:flex-wrap su:gap-4")}>
        {options.map((o) => (
          <label key={o.value} className={cx("su:inline-flex su:items-center su:gap-2 su:text-sm su:text-fg", o.disabled && "su:opacity-50")}>
            <input type="radio" name={name} value={o.value} checked={current === o.value} disabled={o.disabled} required={required}
              onChange={() => setCurrent(o.value)} className={cx("su:size-4 su:accent-accent", focusRing)} />
            {o.label}
          </label>
        ))}
      </div>
      {description && <p id={`${id}-description`} className="su:mt-1.5 su:text-xs su:text-fg-muted">{description}</p>}
      {error && <p id={`${id}-error`} className="su:mt-1.5 su:text-xs su:font-medium su:text-danger">{error}</p>}
    </fieldset>
  );
}
