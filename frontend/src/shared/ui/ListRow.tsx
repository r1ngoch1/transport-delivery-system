import type { ReactNode } from "react";

interface ListRowProps {
  aside?: ReactNode;
  children?: ReactNode;
  meta?: ReactNode;
  onClick?: () => void;
  title: ReactNode;
}

export function ListRow({ aside, children, meta, onClick, title }: ListRowProps) {
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
      <button className="list-row" type="button" onClick={onClick}>
        {body}
      </button>
    );
  }

  return (
    <article aria-label={typeof title === "string" ? title : undefined} className="list-row">
      {body}
    </article>
  );
}
