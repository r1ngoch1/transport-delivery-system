import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface MetricTileProps {
  href?: string;
  label: string;
  value: ReactNode;
}

export function MetricTile({ href, label, value }: MetricTileProps) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
    </>
  );

  if (href) {
    return (
      <NavLink className="metric-tile" to={href}>
        {content}
      </NavLink>
    );
  }

  return <div className="metric-tile">{content}</div>;
}
