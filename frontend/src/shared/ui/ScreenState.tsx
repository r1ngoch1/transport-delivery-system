interface ScreenStateProps {
  kind: "loading" | "empty";
  message: string;
  className?: string;
  inline?: boolean;
}

export function ScreenState({ kind, message, className, inline = false }: ScreenStateProps) {
  const Component = inline ? "span" : "div";

  return (
    <Component
      aria-live={kind === "loading" ? "polite" : undefined}
      className={className ?? "catalog-state"}
      role="status"
    >
      {message}
    </Component>
  );
}
