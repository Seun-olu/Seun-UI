import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/utils";

const badgeTones = {
  neutral: "su:bg-surface-muted su:text-fg su:ring-border",
  accent: "su:bg-accent/10 su:text-accent su:ring-accent/40",
  success: "su:bg-success/10 su:text-success su:ring-success/40",
  warning: "su:bg-warning/10 su:text-warning su:ring-warning/40",
  danger: "su:bg-danger/10 su:text-danger su:ring-danger/40",
};

/** Static status label. Colour is never the only signal: the text carries the meaning. */
export function Badge({ tone = "neutral", className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return <span className={cx("su:inline-flex su:items-center su:rounded-full su:px-2 su:py-0.5 su:text-xs su:font-medium su:ring-1 su:ring-inset", badgeTones[tone], className)} {...rest} />;
}

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("su:rounded-xl su:border su:border-border su:bg-surface-raised su:text-fg su:shadow-sm", className)} {...rest} />;
}
export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("su:flex su:flex-col su:gap-1 su:p-5 su:pb-0", className)} {...rest} />;
}
/** Renders an h3 by default; pick the level that fits the page outline with `as`. */
export function CardTitle({ as: Tag = "h3", className, children }: { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; className?: string; children: ReactNode }) {
  return <Tag className={cx("su:m-0 su:text-base su:font-semibold", className)}>{children}</Tag>;
}
export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("su:m-0 su:text-sm su:text-fg-muted", className)} {...rest} />;
}
export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("su:p-5 su:text-sm", className)} {...rest} />;
}
export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("su:flex su:items-center su:gap-2 su:border-t su:border-border su:px-5 su:py-3", className)} {...rest} />;
}
