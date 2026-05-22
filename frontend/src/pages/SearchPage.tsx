import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authStore } from "../features/auth/authStore";
import { getCityName, getRouteCatalog } from "../features/routes/routeApi";
import { searchTrips, type Trip } from "../features/trips/tripApi";
import { Button } from "../shared/ui/Button";
import { StatusChip } from "../shared/ui/StatusChip";

export function SearchPage() {
  const navigate = useNavigate();
  const routeCatalogQuery = useQuery({
    queryKey: ["route-catalog"],
    queryFn: getRouteCatalog
  });
  const tripSearch = useMutation({
    mutationFn: ({ routeId, tripDate }: { routeId: string; tripDate?: string }) =>
      searchTrips(routeId, tripDate)
  });
  const [from, setFrom] = useState("Yekaterinburg");
  const [to, setTo] = useState("Tyumen");
  const [date, setDate] = useState("");
  const [searchedRoute, setSearchedRoute] = useState("Yekaterinburg -> Tyumen");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const cityLookup = useMemo(() => routeCatalogQuery.data?.cities ?? [], [routeCatalogQuery.data?.cities]);
  const routes = routeCatalogQuery.data?.routes ?? [];

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextRouteLabel = `${from || "Any city"} -> ${to || "Any city"}`;
    const matchedRoute = routes.find(
      (route) =>
        getCityName(cityLookup, route.fromCityId).toLowerCase() === from.trim().toLowerCase() &&
        getCityName(cityLookup, route.toCityId).toLowerCase() === to.trim().toLowerCase()
    );

    setSearchedRoute(nextRouteLabel);
    setBookingMessage(null);
    setSearchError(null);

    if (!matchedRoute) {
      setSearchError("No route found for selected cities");
      return;
    }

    tripSearch.mutate({ routeId: matchedRoute.id, tripDate: date || undefined });
  }

  function handleBook(trip: Trip) {
    if (!authStore.isAuthenticated()) {
      navigate("/login");
      return;
    }

    setBookingMessage(
      `Trip ${formatTripTime(trip.departureTime)} selected. Real booking API wiring is the next Passenger MVP task.`
    );
  }

  return (
    <main className="page search-layout">
      <form className="panel search-panel" onSubmit={handleSearch}>
        <p className="eyebrow">Search trip</p>
        <label>
          From
          <input
            placeholder="Yekaterinburg"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          To
          <input placeholder="Tyumen" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <Button type="submit">Search</Button>
        <RouteCatalogSummary
          isLoading={routeCatalogQuery.isLoading}
          error={routeCatalogQuery.error}
          cities={routeCatalogQuery.data?.cities ?? []}
          routes={routeCatalogQuery.data?.routes ?? []}
        />
      </form>
      <section className="results-panel">
        <div className="results-header">
          <div>
            <h1 className="page-title">Find a trip</h1>
            <p className="page-subtitle">
              Showing {searchedRoute}
              {date ? ` on ${date}` : ""}. Search routes, compare seats, and book through the gateway.
            </p>
          </div>
          <StatusChip status="SCHEDULED" />
        </div>
        {bookingMessage && <div className="notice">{bookingMessage}</div>}
        {searchError && <div className="form-error">{searchError}</div>}
        {tripSearch.isPending && <div className="catalog-state">Searching trips</div>}
        {tripSearch.isError && <div className="form-error">{tripSearch.error.message}</div>}
        {tripSearch.isSuccess && tripSearch.data.length === 0 && (
          <div className="catalog-state">No trips found for this route and date</div>
        )}
        {tripSearch.isSuccess && tripSearch.data.length > 0 && (
          <div className="trip-list">
            {tripSearch.data.map((trip) => (
              <article className="trip-card panel" key={trip.id}>
                <div>
                  <strong>{formatTripTime(trip.departureTime)}</strong>
                  <span>departure</span>
                </div>
                <div>
                  <strong>{searchedRoute}</strong>
                  <span>{trip.availableSeats ?? trip.totalSeats} seats available</span>
                </div>
                <strong>{trip.price} RUB</strong>
                <Button type="button" onClick={() => handleBook(trip)}>
                  Book
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function formatTripTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 5);
  }
  return date.toISOString().slice(11, 16);
}

function RouteCatalogSummary({
  isLoading,
  error,
  cities,
  routes
}: {
  isLoading: boolean;
  error: Error | null;
  cities: Array<{ id: string; name?: string; region?: string; country?: string }>;
  routes: Array<{
    id: string;
    fromCityId?: string;
    toCityId?: string;
    distanceKm?: number;
    estimatedDurationMinutes?: number;
  }>;
}) {
  if (isLoading) {
    return <div className="catalog-state">Loading cities and routes</div>;
  }

  if (error) {
    return <div className="form-error">{error.message}</div>;
  }

  return (
    <div className="catalog-summary">
      <div>
        <p className="eyebrow">Cities</p>
        {cities.length === 0 ? (
          <p className="muted-text">No cities available</p>
        ) : (
          <div className="chip-list">
            {cities.map((city) => (
              <span className="data-chip" key={city.id}>
                {city.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="eyebrow">Routes</p>
        {routes.length === 0 ? (
          <p className="muted-text">No routes available</p>
        ) : (
          <div className="route-list">
            {routes.map((route) => (
              <div className="route-row" key={route.id}>
                <strong>
                  {getCityName(cities, route.fromCityId)} -&gt; {getCityName(cities, route.toCityId)}
                </strong>
                {route.distanceKm !== undefined && <span>{route.distanceKm} km</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
