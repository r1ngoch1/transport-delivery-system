import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { authStore } from "../features/auth/authStore";
import { createBooking, type Booking } from "../features/bookings/bookingApi";
import { createCargoOrder, type CargoOrder } from "../features/cargo/cargoApi";
import { getCityName, getRouteCatalog } from "../features/routes/routeApi";
import { searchTrips, type Trip } from "../features/trips/tripApi";
import { useI18n } from "../shared/i18n/i18n";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { Button } from "../shared/ui/Button";
import { PageHeader } from "../shared/ui/PageHeader";
import { RouteMapPreview } from "../shared/ui/RouteMapPreview";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function SearchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [mode, setMode] = useState<"passenger" | "cargo">("passenger");
  const [searchedRoute, setSearchedRoute] = useState("Yekaterinburg -> Tyumen");
  const [submittedRoute, setSubmittedRoute] = useState({ from: "", mode: "passenger", to: "" });
  const [searchError, setSearchError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [createdCargoOrder, setCreatedCargoOrder] = useState<CargoOrder | null>(null);
  const [cargoError, setCargoError] = useState("");
  const [cargoForm, setCargoForm] = useState({
    declaredValue: "",
    description: "",
    dropoffAddress: "",
    pickupAddress: "",
    recipientName: "",
    recipientPhone: "",
    senderName: "",
    senderPhone: "",
    heightCm: "",
    lengthCm: "",
    weightKg: "",
    widthCm: ""
  });
  const cityLookup = useMemo(() => routeCatalogQuery.data?.cities ?? [], [routeCatalogQuery.data?.cities]);
  const routes = routeCatalogQuery.data?.routes ?? [];
  const selectedRoute = routes.find(
    (route) =>
      getCityName(cityLookup, route.fromCityId).toLowerCase() === from.trim().toLowerCase() &&
      getCityName(cityLookup, route.toCityId).toLowerCase() === to.trim().toLowerCase()
  );
  const firstTrip = tripSearch.data?.[0];
  const routeMatchesSubmittedSearch =
    submittedRoute.from.toLowerCase() === from.trim().toLowerCase() &&
    submittedRoute.to.toLowerCase() === to.trim().toLowerCase() &&
    submittedRoute.mode === mode;
  const capacityLabel =
    routeMatchesSubmittedSearch && firstTrip
      ? mode === "cargo"
        ? t("{value} m3 cargo available", { value: formatNumber(firstTrip.availableCargoVolume ?? firstTrip.totalCargoVolume ?? 0) })
        : t("{value} seats available", { value: firstTrip.availableSeats ?? firstTrip.totalSeats })
      : undefined;
  const bookingMutation = useMutation({
    mutationFn: (trip: Trip) => createBooking(trip.id, "1"),
    onSuccess: (booking) => {
      setCreatedBooking(booking);
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    }
  });
  const cargoMutation = useMutation({
    mutationFn: (trip: Trip) =>
      createCargoOrder({
        declaredValue: optionalNumber(cargoForm.declaredValue),
        description: cargoForm.description,
        dropoffAddress: optionalText(cargoForm.dropoffAddress),
        dropoffCity: to,
        heightCm: Number(cargoForm.heightCm),
        lengthCm: Number(cargoForm.lengthCm),
        pickupAddress: optionalText(cargoForm.pickupAddress),
        pickupCity: from,
        recipientName: optionalText(cargoForm.recipientName),
        recipientPhone: optionalText(cargoForm.recipientPhone),
        senderName: optionalText(cargoForm.senderName),
        senderPhone: optionalText(cargoForm.senderPhone),
        tripId: trip.id,
        weightKg: Number(cargoForm.weightKg),
        widthCm: Number(cargoForm.widthCm)
      }),
    onSuccess: (cargoOrder) => {
      setCreatedCargoOrder(cargoOrder);
      setCargoError("");
    }
  });

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextRouteLabel = `${from || t("Any city")} -> ${to || t("Any city")}`;
    const matchedRoute = routes.find(
      (route) =>
        getCityName(cityLookup, route.fromCityId).toLowerCase() === from.trim().toLowerCase() &&
        getCityName(cityLookup, route.toCityId).toLowerCase() === to.trim().toLowerCase()
    );

    setSearchedRoute(nextRouteLabel);
    setCreatedBooking(null);
    setCreatedCargoOrder(null);
    setSearchError(null);
    setCargoError("");

    if (!matchedRoute) {
      setSearchError(t("No route found for selected cities"));
      return;
    }

    tripSearch.mutate({ routeId: matchedRoute.id, tripDate: date || undefined });
    setSubmittedRoute({ from: from.trim(), mode, to: to.trim() });
  }

  function handleBook(trip: Trip) {
    if (!authStore.isAuthenticated()) {
      navigate("/login");
      return;
    }

    setCreatedBooking(null);
    bookingMutation.mutate(trip);
  }

  function handleCreateCargoOrder(trip: Trip) {
    if (!authStore.isAuthenticated()) {
      navigate("/login");
      return;
    }

    const validationError = validateCargoForm(cargoForm, trip, t);
    if (validationError) {
      setCargoError(validationError);
      return;
    }

    setCreatedCargoOrder(null);
    setCargoError("");
    cargoMutation.mutate(trip);
  }

  return (
    <main className="page search-layout">
      <form className="panel search-panel" onSubmit={handleSearch}>
        <p className="eyebrow">{mode === "cargo" ? t("Search cargo space") : t("Search trip")}</p>
        <div className="segmented-control" aria-label={t("Search mode")}>
          <button
            className={mode === "passenger" ? "segment active" : "segment"}
            type="button"
            onClick={() => setMode("passenger")}
          >
            {t("Passenger")}
          </button>
          <button
            className={mode === "cargo" ? "segment active" : "segment"}
            type="button"
            onClick={() => setMode("cargo")}
          >
            {t("Cargo")}
          </button>
        </div>
        <label>
          {t("From")}
          <input
            placeholder="Yekaterinburg"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          {t("To")}
          <input placeholder="Tyumen" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <label>
          {t("Date")}
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        {mode === "cargo" && (
          <CargoFormFields cargoForm={cargoForm} setCargoForm={setCargoForm} />
        )}
        <Button type="submit">{mode === "cargo" ? t("Search cargo space") : t("Search")}</Button>
        <RouteCatalogSummary
          isLoading={routeCatalogQuery.isLoading}
          error={routeCatalogQuery.error}
          cities={routeCatalogQuery.data?.cities ?? []}
          routes={routeCatalogQuery.data?.routes ?? []}
        />
      </form>
      <section className="results-panel">
        <PageHeader
          eyebrow={mode === "cargo" ? t("Cargo route") : t("Passenger route")}
          title={t("Find a trip")}
          subtitle={
            <>
              {t("Showing")} {searchedRoute}
              {date ? ` ${t("on {date}", { date })}` : ""}.{" "}
              {mode === "cargo"
                ? t("Search routes, compare cargo capacity, and create cargo orders through the gateway.")
                : t("Search routes, compare seats, and book through the gateway.")}
            </>
          }
        >
          <StatusChip status="SCHEDULED" />
        </PageHeader>
        <RouteMapPreview
          from={from}
          to={to}
          distanceKm={selectedRoute?.distanceKm}
          durationMinutes={selectedRoute?.estimatedDurationMinutes}
          capacityLabel={capacityLabel}
        />
        {createdBooking && (
          <div className="notice booking-created">
            <div>
              <strong>{t("Booking created")}</strong>
              <span>{t("Seat {seat}", { seat: createdBooking.seatNumber })}</span>
            </div>
            <StatusChip status={createdBooking.status} />
            <Link className="inline-link" to="/bookings">
              {t("View bookings")}
            </Link>
          </div>
        )}
        {createdCargoOrder && (
          <div className="notice booking-created">
            <div>
              <strong>{t("Cargo order created")}</strong>
              <span>
                {createdCargoOrder.volumeM3} m3 · {createdCargoOrder.price} {createdCargoOrder.currency}
              </span>
            </div>
            <span className="status-chip status-success">{createdCargoOrder.status}</span>
          </div>
        )}
        {searchError && <div className="form-error">{searchError}</div>}
        {cargoError && <div className="form-error">{cargoError}</div>}
        {bookingMutation.isError && (
          <ApiErrorMessage error={bookingMutation.error} fallback="Could not create booking" />
        )}
        {cargoMutation.isError && (
          <ApiErrorMessage error={cargoMutation.error} fallback="Could not create cargo order" />
        )}
        {tripSearch.isPending && <ScreenState kind="loading" message={t("Searching trips")} />}
        {tripSearch.isError && <ApiErrorMessage error={tripSearch.error} fallback={t("Could not search trips")} />}
        {tripSearch.isSuccess && tripSearch.data.length === 0 && (
          <ScreenState kind="empty" message={t("No trips found for this route and date")} />
        )}
        {tripSearch.isSuccess && tripSearch.data.length > 0 && (
          <div className="trip-list">
            {tripSearch.data.map((trip) => (
              <article className="trip-card panel" key={trip.id}>
                <div>
                  <strong>{formatTripTime(trip.departureTime)}</strong>
                  <span>{t("departure")}</span>
                </div>
                <div>
                  <strong>{searchedRoute}</strong>
                  {mode === "cargo" ? (
                    <span>
                      {t("{value} m3 cargo available", {
                        value: formatNumber(trip.availableCargoVolume ?? trip.totalCargoVolume ?? 0)
                      })}
                    </span>
                  ) : (
                    <span>{t("{value} seats available", { value: trip.availableSeats ?? trip.totalSeats })}</span>
                  )}
                </div>
                <strong>
                  {mode === "cargo"
                    ? cargoPriceEstimateLabel(cargoForm, t)
                    : `${trip.price} RUB`}
                </strong>
                <Button
                  type="button"
                  disabled={bookingMutation.isPending || cargoMutation.isPending}
                  onClick={() => (mode === "cargo" ? handleCreateCargoOrder(trip) : handleBook(trip))}
                >
                  {mode === "cargo" ? (cargoMutation.isPending ? t("Shipping") : t("Ship cargo")) : (bookingMutation.isPending ? t("Booking") : t("Book"))}
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function CargoFormFields({
  cargoForm,
  setCargoForm
}: {
  cargoForm: {
    declaredValue: string;
    description: string;
    dropoffAddress: string;
    heightCm: string;
    lengthCm: string;
    pickupAddress: string;
    recipientName: string;
    recipientPhone: string;
    senderName: string;
    senderPhone: string;
    weightKg: string;
    widthCm: string;
  };
  setCargoForm: (value: {
    declaredValue: string;
    description: string;
    dropoffAddress: string;
    heightCm: string;
    lengthCm: string;
    pickupAddress: string;
    recipientName: string;
    recipientPhone: string;
    senderName: string;
    senderPhone: string;
    weightKg: string;
    widthCm: string;
  }) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="cargo-form-grid">
      <label>
        {t("Description")}
        <input
          value={cargoForm.description}
          onChange={(event) => setCargoForm({ ...cargoForm, description: event.target.value })}
        />
      </label>
      <label>
        {t("Pickup address")}
        <input
          value={cargoForm.pickupAddress}
          onChange={(event) => setCargoForm({ ...cargoForm, pickupAddress: event.target.value })}
        />
      </label>
      <label>
        {t("Dropoff address")}
        <input
          value={cargoForm.dropoffAddress}
          onChange={(event) => setCargoForm({ ...cargoForm, dropoffAddress: event.target.value })}
        />
      </label>
      <label>
        {t("Declared value")}
        <input
          min="0"
          step="0.01"
          type="number"
          value={cargoForm.declaredValue}
          onChange={(event) => setCargoForm({ ...cargoForm, declaredValue: event.target.value })}
        />
      </label>
      <label>
        {t("Sender name")}
        <input
          value={cargoForm.senderName}
          onChange={(event) => setCargoForm({ ...cargoForm, senderName: event.target.value })}
        />
      </label>
      <label>
        {t("Sender phone")}
        <input
          value={cargoForm.senderPhone}
          onChange={(event) => setCargoForm({ ...cargoForm, senderPhone: event.target.value })}
        />
      </label>
      <label>
        {t("Recipient name")}
        <input
          value={cargoForm.recipientName}
          onChange={(event) => setCargoForm({ ...cargoForm, recipientName: event.target.value })}
        />
      </label>
      <label>
        {t("Recipient phone")}
        <input
          value={cargoForm.recipientPhone}
          onChange={(event) => setCargoForm({ ...cargoForm, recipientPhone: event.target.value })}
        />
      </label>
      <label>
        {t("Weight kg")}
        <input
          min="0"
          step="0.01"
          type="number"
          value={cargoForm.weightKg}
          onChange={(event) => setCargoForm({ ...cargoForm, weightKg: event.target.value })}
        />
      </label>
      <label>
        {t("Length cm")}
        <input
          min="0"
          step="0.01"
          type="number"
          value={cargoForm.lengthCm}
          onChange={(event) => setCargoForm({ ...cargoForm, lengthCm: event.target.value })}
        />
      </label>
      <label>
        {t("Width cm")}
        <input
          min="0"
          step="0.01"
          type="number"
          value={cargoForm.widthCm}
          onChange={(event) => setCargoForm({ ...cargoForm, widthCm: event.target.value })}
        />
      </label>
      <label>
        {t("Height cm")}
        <input
          min="0"
          step="0.01"
          type="number"
          value={cargoForm.heightCm}
          onChange={(event) => setCargoForm({ ...cargoForm, heightCm: event.target.value })}
        />
      </label>
    </div>
  );
}

function validateCargoForm(
  cargoForm: {
    declaredValue?: string;
    description: string;
    heightCm: string;
    lengthCm: string;
    weightKg: string;
    widthCm: string;
  },
  trip: Trip,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  const weightKg = Number(cargoForm.weightKg);
  const lengthCm = Number(cargoForm.lengthCm);
  const widthCm = Number(cargoForm.widthCm);
  const heightCm = Number(cargoForm.heightCm);
  if (!cargoForm.description.trim()) {
    return t("Cargo description is required");
  }
  if (![weightKg, lengthCm, widthCm, heightCm].every((value) => Number.isFinite(value) && value > 0)) {
    return t("Cargo dimensions and weight must be positive");
  }
  const volumeM3 = calculateCargoVolumeM3(lengthCm, widthCm, heightCm);
  if (volumeM3 > (trip.availableCargoVolume ?? trip.totalCargoVolume ?? 0)) {
    return t("Cargo volume exceeds available trip capacity");
  }
  return "";
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

function calculateCargoVolumeM3(lengthCm: number, widthCm: number, heightCm: number) {
  return (lengthCm * widthCm * heightCm) / 1_000_000;
}

function cargoPriceEstimateLabel(
  cargoForm: {
  heightCm: string;
  lengthCm: string;
  weightKg: string;
  widthCm: string;
  },
  t: (key: string, params?: Record<string, string | number>) => string
) {
  const weightKg = Number(cargoForm.weightKg);
  const lengthCm = Number(cargoForm.lengthCm);
  const widthCm = Number(cargoForm.widthCm);
  const heightCm = Number(cargoForm.heightCm);
  if (![weightKg, lengthCm, widthCm, heightCm].every((value) => Number.isFinite(value) && value > 0)) {
    return t("Enter cargo details");
  }
  const volumeM3 = calculateCargoVolumeM3(lengthCm, widthCm, heightCm);
  const price = 500 + weightKg * 20 + volumeM3 * 300;
  return t("Estimated cargo price {price} RUB", { price: price.toFixed(2) });
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
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
  const { t } = useI18n();

  if (isLoading) {
    return <ScreenState kind="loading" message={t("Loading cities and routes")} />;
  }

  if (error) {
    return <ApiErrorMessage error={error} fallback={t("Could not load route catalog")} />;
  }

  return (
    <div className="catalog-summary">
      <div>
        <p className="eyebrow">{t("Cities")}</p>
        {cities.length === 0 ? (
          <ScreenState className="muted-text" inline kind="empty" message={t("No cities available")} />
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
        <p className="eyebrow">{t("Routes")}</p>
        {routes.length === 0 ? (
          <ScreenState className="muted-text" inline kind="empty" message={t("No routes available")} />
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
