import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { authStore } from "../features/auth/authStore";
import { createBooking, type Booking } from "../features/bookings/bookingApi";
import { createCargoOrder, type CargoOrder } from "../features/cargo/cargoApi";
import { getCityName, getRouteCatalog } from "../features/routes/routeApi";
import { searchTrips, type Trip } from "../features/trips/tripApi";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { Button } from "../shared/ui/Button";
import { PageHeader } from "../shared/ui/PageHeader";
import { RouteMapPreview } from "../shared/ui/RouteMapPreview";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function SearchPage() {
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
  const capacityLabel =
    mode === "cargo"
      ? `${formatNumber(firstTrip?.availableCargoVolume ?? firstTrip?.totalCargoVolume ?? 0)} m3 cargo available`
      : firstTrip
        ? `${firstTrip.availableSeats ?? firstTrip.totalSeats} seats available`
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
    const nextRouteLabel = `${from || "Any city"} -> ${to || "Any city"}`;
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

    setCreatedBooking(null);
    bookingMutation.mutate(trip);
  }

  function handleCreateCargoOrder(trip: Trip) {
    if (!authStore.isAuthenticated()) {
      navigate("/login");
      return;
    }

    const validationError = validateCargoForm(cargoForm, trip);
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
        <p className="eyebrow">{mode === "cargo" ? "Search cargo space" : "Search trip"}</p>
        <div className="segmented-control" aria-label="Search mode">
          <button
            className={mode === "passenger" ? "segment active" : "segment"}
            type="button"
            onClick={() => setMode("passenger")}
          >
            Passenger
          </button>
          <button
            className={mode === "cargo" ? "segment active" : "segment"}
            type="button"
            onClick={() => setMode("cargo")}
          >
            Cargo
          </button>
        </div>
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
        {mode === "cargo" && (
          <CargoFormFields cargoForm={cargoForm} setCargoForm={setCargoForm} />
        )}
        <Button type="submit">{mode === "cargo" ? "Search cargo space" : "Search"}</Button>
        <RouteCatalogSummary
          isLoading={routeCatalogQuery.isLoading}
          error={routeCatalogQuery.error}
          cities={routeCatalogQuery.data?.cities ?? []}
          routes={routeCatalogQuery.data?.routes ?? []}
        />
      </form>
      <section className="results-panel">
        <PageHeader
          eyebrow={mode === "cargo" ? "Cargo route" : "Passenger route"}
          title="Find a trip"
          subtitle={
            <>
              Showing {searchedRoute}
              {date ? ` on ${date}` : ""}.{" "}
              {mode === "cargo"
                ? "Search routes, compare cargo capacity, and create cargo orders through the gateway."
                : "Search routes, compare seats, and book through the gateway."}
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
              <strong>Booking created</strong>
              <span>Seat {createdBooking.seatNumber}</span>
            </div>
            <StatusChip status={createdBooking.status} />
            <Link className="inline-link" to="/bookings">
              View bookings
            </Link>
          </div>
        )}
        {createdCargoOrder && (
          <div className="notice booking-created">
            <div>
              <strong>Cargo order created</strong>
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
        {tripSearch.isPending && <ScreenState kind="loading" message="Searching trips" />}
        {tripSearch.isError && <ApiErrorMessage error={tripSearch.error} fallback="Could not search trips" />}
        {tripSearch.isSuccess && tripSearch.data.length === 0 && (
          <ScreenState kind="empty" message="No trips found for this route and date" />
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
                  {mode === "cargo" ? (
                    <span>{formatNumber(trip.availableCargoVolume ?? trip.totalCargoVolume ?? 0)} m3 cargo available</span>
                  ) : (
                    <span>{trip.availableSeats ?? trip.totalSeats} seats available</span>
                  )}
                </div>
                <strong>
                  {mode === "cargo"
                    ? cargoPriceEstimateLabel(cargoForm)
                    : `${trip.price} RUB`}
                </strong>
                <Button
                  type="button"
                  disabled={bookingMutation.isPending || cargoMutation.isPending}
                  onClick={() => (mode === "cargo" ? handleCreateCargoOrder(trip) : handleBook(trip))}
                >
                  {mode === "cargo" ? (cargoMutation.isPending ? "Shipping" : "Ship cargo") : (bookingMutation.isPending ? "Booking" : "Book")}
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
  return (
    <div className="cargo-form-grid">
      <label>
        Description
        <input
          value={cargoForm.description}
          onChange={(event) => setCargoForm({ ...cargoForm, description: event.target.value })}
        />
      </label>
      <label>
        Pickup address
        <input
          value={cargoForm.pickupAddress}
          onChange={(event) => setCargoForm({ ...cargoForm, pickupAddress: event.target.value })}
        />
      </label>
      <label>
        Dropoff address
        <input
          value={cargoForm.dropoffAddress}
          onChange={(event) => setCargoForm({ ...cargoForm, dropoffAddress: event.target.value })}
        />
      </label>
      <label>
        Declared value
        <input
          min="0"
          step="0.01"
          type="number"
          value={cargoForm.declaredValue}
          onChange={(event) => setCargoForm({ ...cargoForm, declaredValue: event.target.value })}
        />
      </label>
      <label>
        Sender name
        <input
          value={cargoForm.senderName}
          onChange={(event) => setCargoForm({ ...cargoForm, senderName: event.target.value })}
        />
      </label>
      <label>
        Sender phone
        <input
          value={cargoForm.senderPhone}
          onChange={(event) => setCargoForm({ ...cargoForm, senderPhone: event.target.value })}
        />
      </label>
      <label>
        Recipient name
        <input
          value={cargoForm.recipientName}
          onChange={(event) => setCargoForm({ ...cargoForm, recipientName: event.target.value })}
        />
      </label>
      <label>
        Recipient phone
        <input
          value={cargoForm.recipientPhone}
          onChange={(event) => setCargoForm({ ...cargoForm, recipientPhone: event.target.value })}
        />
      </label>
      <label>
        Weight kg
        <input
          min="0"
          step="0.01"
          type="number"
          value={cargoForm.weightKg}
          onChange={(event) => setCargoForm({ ...cargoForm, weightKg: event.target.value })}
        />
      </label>
      <label>
        Length cm
        <input
          min="0"
          step="0.01"
          type="number"
          value={cargoForm.lengthCm}
          onChange={(event) => setCargoForm({ ...cargoForm, lengthCm: event.target.value })}
        />
      </label>
      <label>
        Width cm
        <input
          min="0"
          step="0.01"
          type="number"
          value={cargoForm.widthCm}
          onChange={(event) => setCargoForm({ ...cargoForm, widthCm: event.target.value })}
        />
      </label>
      <label>
        Height cm
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
  trip: Trip
) {
  const weightKg = Number(cargoForm.weightKg);
  const lengthCm = Number(cargoForm.lengthCm);
  const widthCm = Number(cargoForm.widthCm);
  const heightCm = Number(cargoForm.heightCm);
  if (!cargoForm.description.trim()) {
    return "Cargo description is required";
  }
  if (![weightKg, lengthCm, widthCm, heightCm].every((value) => Number.isFinite(value) && value > 0)) {
    return "Cargo dimensions and weight must be positive";
  }
  const volumeM3 = calculateCargoVolumeM3(lengthCm, widthCm, heightCm);
  if (volumeM3 > (trip.availableCargoVolume ?? trip.totalCargoVolume ?? 0)) {
    return "Cargo volume exceeds available trip capacity";
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

function cargoPriceEstimateLabel(cargoForm: {
  heightCm: string;
  lengthCm: string;
  weightKg: string;
  widthCm: string;
}) {
  const weightKg = Number(cargoForm.weightKg);
  const lengthCm = Number(cargoForm.lengthCm);
  const widthCm = Number(cargoForm.widthCm);
  const heightCm = Number(cargoForm.heightCm);
  if (![weightKg, lengthCm, widthCm, heightCm].every((value) => Number.isFinite(value) && value > 0)) {
    return "Enter cargo details";
  }
  const volumeM3 = calculateCargoVolumeM3(lengthCm, widthCm, heightCm);
  const price = 500 + weightKg * 20 + volumeM3 * 300;
  return `Estimated cargo price ${price.toFixed(2)} RUB`;
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
  if (isLoading) {
    return <ScreenState kind="loading" message="Loading cities and routes" />;
  }

  if (error) {
    return <ApiErrorMessage error={error} fallback="Could not load route catalog" />;
  }

  return (
    <div className="catalog-summary">
      <div>
        <p className="eyebrow">Cities</p>
        {cities.length === 0 ? (
          <ScreenState className="muted-text" inline kind="empty" message="No cities available" />
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
          <ScreenState className="muted-text" inline kind="empty" message="No routes available" />
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
