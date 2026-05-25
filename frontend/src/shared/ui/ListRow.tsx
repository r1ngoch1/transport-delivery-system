import { useId, type ReactNode } from "react";

interface ListRowProps {
  ariaLabel?: string;
  aside?: ReactNode;
  children?: ReactNode;
  meta?: ReactNode;
  onClick?: () => void;
  title: ReactNode;
}

export function ListRow({ ariaLabel, aside, children, meta, onClick, title }: ListRowProps) {
  const rowId = useId();
  const metaId = meta ? `${rowId}-meta` : undefined;
  const detailsId = children ? `${rowId}-details` : undefined;
  const describedBy = [metaId, detailsId].filter(Boolean).join(" ") || undefined;
  const body = (
    <>
      <div className="list-row-main">
        <strong>{title}</strong>
        {meta && <span id={metaId}>{meta}</span>}
        {children && (
          <span className="list-row-details" id={detailsId}>
            {children}
          </span>
        )}
      </div>
      {aside && <div className="list-row-aside">{aside}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        className="list-row"
        type="button"
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  return (
    <article
      aria-describedby={describedBy}
      aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
      className="list-row"
    >
      {body}
    </article>
  );
}
