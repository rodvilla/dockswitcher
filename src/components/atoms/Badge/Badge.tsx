import type { ReactNode } from "react";

export interface BadgeProps {
  variant?: "success" | "info" | "warning";
  children: ReactNode;
}

const variantClasses = {
  success:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export function Badge({ variant = "info", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
