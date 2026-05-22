import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  const classes = ["button", `button-${variant}`, className].filter(Boolean).join(" ");
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
