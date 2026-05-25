import type { ReactNode } from "react";

interface ListRowProps {
  ariaLabel?: string;
  aside?: ReactNode;
  children?: ReactNode;
  meta?: ReactNode;
  onClick?: () => void;
  title: ReactNode;
}

export function ListRow({ ariaLabel, aside, children, meta, onClick, title }: ListRowProps) {
  const body = (
    <>
      <div className="list-row-main">
        <strong>{title}</strong>
        {meta && <span>{meta}</span>}
        {children}
      </div>
      {aside && <div className="list-row-aside">{aside}</div>}
    </>
  );

  if (onClick) {
    return (
      <button aria-label={ariaLabel} className="list-row" type="button" onClick={onClick}>
        {body}
      </button>
    );
  }

  return (
    <article aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)} className="list-row">
      {body}
    </article>
  );
}
