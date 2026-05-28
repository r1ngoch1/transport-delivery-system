import { useI18n } from "../i18n/i18n";

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
  const { t } = useI18n();
  const hasRoute = Boolean(from.trim() && to.trim());

  return (
    <section className="route-map-panel panel" aria-label={t("Route preview")}>
      <div className="route-map-copy">
        <p className="eyebrow">{t("Route preview")}</p>
        <h2 className="section-title">{hasRoute ? t("Route from {from} to {to}", { from, to }) : t("Select route")}</h2>
        {!hasRoute && (
          <p className="page-subtitle">{t("Choose a route to preview distance and capacity.")}</p>
        )}
      </div>
      <div
        className="route-map-canvas"
        role="img"
        aria-label={hasRoute ? t("Route from {from} to {to}", { from, to }) : t("Route preview placeholder")}
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
          {durationMinutes !== undefined && <span>{formatDuration(durationMinutes, t)}</span>}
          {capacityLabel && <span>{capacityLabel}</span>}
        </div>
      )}
    </section>
  );
}

function formatDuration(minutes: number, t: (key: string, params?: Record<string, string | number>) => string) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {
    return t("{minutes}m", { minutes: remainingMinutes });
  }
  if (remainingMinutes === 0) {
    return t("{hours}h", { hours });
  }
  return t("{hours}h {minutes}m", { hours, minutes: remainingMinutes });
}
