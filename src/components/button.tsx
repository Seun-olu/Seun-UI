import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx, focusRing } from "../lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  /** Shows a spinner and blocks clicks while keeping the button focusable and announced as busy. */
  loading?: boolean;
}

const variants = {
  primary: "su:border-0 su:bg-accent su:text-accent-fg su:hover:bg-accent-hover",
  secondary: "su:border su:border-solid su:border-border su:bg-surface su:text-fg su:hover:bg-surface-muted",
  ghost: "su:border-0 su:bg-transparent su:text-fg su:hover:bg-surface-muted",
  danger: "su:border-0 su:bg-danger su:text-danger-fg su:hover:opacity-90",
};
const sizes = { sm: "su:h-8 su:px-3 su:text-sm", md: "su:h-10 su:px-4 su:text-sm" };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, disabled, className, children, onClick, type = "button", ...rest },
  ref,
) {
  const inert = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (inert) { e.preventDefault(); return; }
        onClick?.(e);
      }}
      className={cx(
        "su:inline-flex su:items-center su:justify-center su:gap-2 su:rounded-control su:font-medium su:transition-colors su:select-none",
        "su:disabled:cursor-not-allowed su:disabled:opacity-50 su:aria-disabled:cursor-wait su:aria-disabled:opacity-70",
        focusRing, variants[variant], sizes[size], className,
      )}
      {...rest}
    >
      {loading && <span aria-hidden className="su:size-3.5 su:animate-spin su:rounded-full su:border-2 su:border-current su:border-t-transparent" />}
      {children}
    </button>
  );
});
