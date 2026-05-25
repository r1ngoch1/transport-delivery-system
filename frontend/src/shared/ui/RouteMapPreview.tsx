interface RouteMapPreviewProps {
  capacityLabel?: string;
  distanceKm?: number;
  durationMinutes?: number;
  from: string;
  to: string;
}

export function RouteMapPreview({
  capacityLabel,
  distanceKm,
  durationMinutes,
  from,
  to
}: RouteMapPreviewProps) {
  const hasRoute = Boolean(from.trim() && to.trim());

  return (
    <section className="route-map-panel panel" aria-label="Route preview">
      <div className="route-map-copy">
        <p className="eyebrow">Route preview</p>
        <h2 className="section-title">{hasRoute ? `${from} to ${to}` : "Select route"}</h2>
        {!hasRoute && (
          <p className="page-subtitle">Choose a route to preview distance and capacity.</p>
        )}
      </div>
      <div
        className="route-map-canvas"
        role="img"
        aria-label={hasRoute ? `Route from ${from} to ${to}` : "Route preview placeholder"}
      >
        <span className="route-pin route-pin-start" />
        <span className="route-path" />
        <span className="route-pin route-pin-end" />
        {hasRoute && (
          <>
            <span className="route-city route-city-start">{from}</span>
            <span className="route-city route-city-end">{to}</span>
          </>
        )}
      </div>
      {hasRoute && (
        <div className="route-map-stats">
          {distanceKm !== undefined && <span>{distanceKm} km</span>}
          {durationMinutes !== undefined && <span>{formatDuration(durationMinutes)}</span>}
          {capacityLabel && <span>{capacityLabel}</span>}
        </div>
      )}
    </section>
  );
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}
