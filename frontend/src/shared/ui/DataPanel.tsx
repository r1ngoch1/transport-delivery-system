import type { PropsWithChildren } from "react";

interface DataPanelProps extends PropsWithChildren {
  className?: string;
  eyebrow?: string;
  title?: string;
}

export function DataPanel({ children, className, eyebrow, title }: DataPanelProps) {
  const classes = ["panel", "data-panel", className].filter(Boolean).join(" ");
  return (
    <section className={classes}>
      {(eyebrow || title) && (
        <div className="data-panel-header">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h2 className="section-title">{title}</h2>}
        </div>
      )}
      {children}
    </section>
  );
}
