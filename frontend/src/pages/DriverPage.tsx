import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCurrentDriverAvailabilitySlot,
  createCurrentDriverProfile,
  deleteCurrentDriverAvailabilitySlot,
  getCurrentDriverAvailability,
  getCurrentDriverProfile,
  updateCurrentDriverAvailabilitySlot,
  updateCurrentDriverProfile,
  type CreateCurrentDriverProfileRequest,
  type DriverAvailabilitySlot,
  type DriverAvailabilitySlotRequest,
  type DriverAvailabilityStatus,
  type DriverProfile
} from "../features/driver/driverApi";
import { getCityName, getRouteCatalog } from "../features/routes/routeApi";
import { createTrip, listTrips, type CreateTripRequest, type Trip } from "../features/trips/tripApi";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { Button } from "../shared/ui/Button";
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { useI18n } from "../shared/i18n/i18n";
import { PageHeader } from "../shared/ui/PageHeader";
import { RouteMapPreview } from "../shared/ui/RouteMapPreview";
import { ScreenState } from "../shared/ui/ScreenState";

const availabilityOptions: DriverAvailabilityStatus[] = [
  "AVAILABLE",
  "UNAVAILABLE",
  "ON_TRIP",
  "SUSPENDED"
];

type DriverCity = { id: string; name?: string };
type DriverRoute = {
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  fromCityId?: string;
  id: string;
  toCityId?: string;
};

export function DriverPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const profileQuery = useQuery({
    queryKey: ["driver-profile"],
    queryFn: getCurrentDriverProfile
  });
  const routeCatalogQuery = useQuery({
    queryKey: ["route-catalog"],
    queryFn: getRouteCatalog
  });
  const tripsQuery = useQuery({
    queryKey: ["driver-trips", profileQuery.data?.id],
    queryFn: () => listTrips({ driverId: profileQuery.data?.id }),
    enabled: Boolean(profileQuery.data?.id)
  });
  const availabilityQuery = useQuery({
    queryKey: ["driver-availability", profileQuery.data?.id],
    queryFn: getCurrentDriverAvailability,
    enabled: Boolean(profileQuery.data?.id)
  });
  const updateMutation = useMutation({
    mutationFn: updateCurrentDriverProfile,
    onSuccess() {
      setNotice(t("Driver profile saved"));
      void queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
    }
  });
  const createAvailabilityMutation = useMutation({
    mutationFn: createCurrentDriverAvailabilitySlot,
    onSuccess() {
      setNotice(t("Availability slot created"));
      void queryClient.invalidateQueries({ queryKey: ["driver-availability"] });
    }
  });
  const updateAvailabilityMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: DriverAvailabilitySlotRequest }) =>
      updateCurrentDriverAvailabilitySlot(id, request),
    onSuccess() {
      setNotice(t("Availability slot saved"));
      void queryClient.invalidateQueries({ queryKey: ["driver-availability"] });
    }
  });
  const deleteAvailabilityMutation = useMutation({
    mutationFn: deleteCurrentDriverAvailabilitySlot,
    onSuccess() {
      setNotice(t("Availability slot deleted"));
      void queryClient.invalidateQueries({ queryKey: ["driver-availability"] });
    }
  });
  const createMutation = useMutation({
    mutationFn: createCurrentDriverProfile,
    onSuccess() {
      setNotice(t("Driver profile created"));
      void queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
    }
  });
  const createTripMutation = useMutation({
    mutationFn: createTrip,
    onSuccess() {
      setNotice(t("Trip created"));
      void queryClient.invalidateQueries({ queryKey: ["driver-trips", profileQuery.data?.id] });
    }
  });

  if (profileQuery.isLoading) {
    return (
      <main className="page">
        <ScreenState className="page-subtitle" inline kind="loading" message={t("Loading driver profile")} />
      </main>
    );
  }
  if (profileQuery.isError) {
    if (isMissingDriverProfileError(profileQuery.error)) {
      return (
        <DriverProfileOnboarding
          error={createMutation.error}
          isSaving={createMutation.isPending}
          onSubmit={(request) => createMutation.mutate(request)}
        />
      );
    }
    return (
      <main className="page">
        <ApiErrorMessage error={profileQuery.error} fallback={t("Could not load driver profile")} />
      </main>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return (
      <main className="page">
        <ScreenState className="page-subtitle" inline kind="empty" message={t("Driver profile not found")} />
      </main>
    );
  }
  return (
    <main className="page driver-page">
      <DataPanel className="driver-hero-panel">
        <PageHeader
          eyebrow={t("Driver")}
          title={t("Driver workspace")}
          subtitle={t("Manage your profile, availability, and current assignments.")}
        >
          <AvailabilityBadge status={profile.availabilityStatus} />
        </PageHeader>
        {notice && <div className="notice">{notice}</div>}
        {updateMutation.isError && (
          <ApiErrorMessage error={updateMutation.error} fallback={t("Could not save driver profile")} />
        )}
        <DriverProfileForm
          isSaving={updateMutation.isPending}
          onSubmit={(request) => updateMutation.mutate(request)}
          profile={profile}
        />
      </DataPanel>

      <DataPanel eyebrow={t("Trips")} title={t("Create trip")}>
        {createTripMutation.isError && (
          <ApiErrorMessage error={createTripMutation.error} fallback={t("Could not create trip")} />
        )}
        <DriverTripForm
          canCreateTrip={profile.availabilityStatus === "AVAILABLE"}
          cities={routeCatalogQuery.data?.cities ?? []}
          isSaving={createTripMutation.isPending}
          onSubmit={(request) => createTripMutation.mutate(request)}
          routes={routeCatalogQuery.data?.routes ?? []}
        />
      </DataPanel>

      <DataPanel eyebrow={t("Availability")} title={t("Availability")}>
        {availabilityQuery.isLoading && (
          <ScreenState className="page-subtitle" inline kind="loading" message={t("Loading availability")} />
        )}
        {availabilityQuery.isError && (
          <ApiErrorMessage error={availabilityQuery.error} fallback={t("Could not load availability")} />
        )}
        {(createAvailabilityMutation.isError ||
          updateAvailabilityMutation.isError ||
          deleteAvailabilityMutation.isError) && (
          <ApiErrorMessage
            error={
              createAvailabilityMutation.error ??
              updateAvailabilityMutation.error ??
              deleteAvailabilityMutation.error
            }
            fallback="Could not save availability"
          />
        )}
        {availabilityQuery.data && (
          <DriverAvailabilitySection
            isDeleting={deleteAvailabilityMutation.isPending}
            isSaving={createAvailabilityMutation.isPending || updateAvailabilityMutation.isPending}
            onCreate={(request) => createAvailabilityMutation.mutate(request)}
            onDelete={(id) => deleteAvailabilityMutation.mutate(id)}
            onUpdate={(id, request) => updateAvailabilityMutation.mutate({ id, request })}
            slots={availabilityQuery.data}
          />
        )}
      </DataPanel>

      <DataPanel eyebrow="Schedule" title="Upcoming assignments">
        {tripsQuery.isLoading && (
          <ScreenState className="page-subtitle" inline kind="loading" message="Loading assignments" />
        )}
        {tripsQuery.isError && (
          <ApiErrorMessage error={tripsQuery.error} fallback="Could not load assigned trips" />
        )}
        {tripsQuery.data && (
          <DriverTripList
            trips={tripsQuery.data}
            cities={routeCatalogQuery.data?.cities ?? []}
            routes={routeCatalogQuery.data?.routes ?? []}
          />
        )}
      </DataPanel>
    </main>
  );
}

function DriverTripForm({
  canCreateTrip,
  cities,
  isSaving,
  onSubmit,
  routes
}: {
  canCreateTrip: boolean;
  cities: DriverCity[];
  isSaving: boolean;
  onSubmit: (request: CreateTripRequest) => void;
  routes: DriverRoute[];
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    arrivalTime: "",
    departureTime: "",
    price: "",
    routeId: "",
    totalCargoVolume: "",
    totalSeats: ""
  });

  return (
    <form
      className="admin-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canCreateTrip) {
          return;
        }
        onSubmit({
          arrivalTime: new Date(form.arrivalTime).toISOString(),
          availableCargoVolume: Number(form.totalCargoVolume),
          availableSeats: Number(form.totalSeats),
          departureTime: new Date(form.departureTime).toISOString(),
          price: Number(form.price),
          routeId: form.routeId,
          status: "SCHEDULED",
          totalCargoVolume: Number(form.totalCargoVolume),
          totalSeats: Number(form.totalSeats)
        });
        setForm({
          arrivalTime: "",
          departureTime: "",
          price: "",
          routeId: "",
          totalCargoVolume: "",
          totalSeats: ""
        });
      }}
    >
      {!canCreateTrip && <div className="form-error">{t("Set availability to AVAILABLE before creating a trip")}</div>}
      <label>
        {t("Route")}
        <select
          required
          value={form.routeId}
          onChange={(event) => setForm({ ...form, routeId: event.target.value })}
        >
          <option value="">{t("Select route")}</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {getCityName(cities, route.fromCityId)} -&gt; {getCityName(cities, route.toCityId)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("Departure time")}
        <input
          required
          type="datetime-local"
          value={form.departureTime}
          onChange={(event) => setForm({ ...form, departureTime: event.target.value })}
        />
      </label>
      <label>
        {t("Arrival time")}
        <input
          required
          type="datetime-local"
          value={form.arrivalTime}
          onChange={(event) => setForm({ ...form, arrivalTime: event.target.value })}
        />
      </label>
      <label>
        {t("Total seats")}
        <input
          min="1"
          required
          type="number"
          value={form.totalSeats}
          onChange={(event) => setForm({ ...form, totalSeats: event.target.value })}
        />
      </label>
      <label>
        {t("Total cargo volume")}
        <input
          min="0"
          required
          step="0.1"
          type="number"
          value={form.totalCargoVolume}
          onChange={(event) => setForm({ ...form, totalCargoVolume: event.target.value })}
        />
      </label>
      <label>
        {t("Price")}
        <input
          min="0"
          required
          type="number"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
        />
      </label>
      <Button type="submit" disabled={isSaving || routes.length === 0 || !canCreateTrip}>
        {t("Create trip")}
      </Button>
    </form>
  );
}

function DriverProfileOnboarding({
  error,
  isSaving,
  onSubmit
}: {
  error: Error | null;
  isSaving: boolean;
  onSubmit: (request: CreateCurrentDriverProfileRequest) => void;
}) {
  const [form, setForm] = useState({
    fullName: "",
    licenseCategory: "",
    licenseExpiresAt: "",
    licenseNumber: "",
    phone: ""
  });

  return (
    <main className="page">
      <section className="panel content-panel driver-content">
        <div>
          <p className="eyebrow">Driver onboarding</p>
          <h1 className="page-title">Driver profile required</h1>
          <p className="page-subtitle">
            Create a driver profile before managing availability or assignments.
          </p>
        </div>
        {error && <ApiErrorMessage error={error} fallback="Could not create driver profile" />}
        <form
          className="admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <label>
            Full name
            <input
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              required
            />
          </label>
          <label>
            License number
            <input
              value={form.licenseNumber}
              onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })}
              required
            />
          </label>
          <label>
            License category
            <input
              value={form.licenseCategory}
              onChange={(event) => setForm({ ...form, licenseCategory: event.target.value })}
              required
            />
          </label>
          <label>
            License expiration date
            <input
              type="date"
              value={form.licenseExpiresAt}
              onChange={(event) => setForm({ ...form, licenseExpiresAt: event.target.value })}
              required
            />
          </label>
          <Button type="submit" disabled={isSaving}>
            Create driver profile
          </Button>
        </form>
      </section>
    </main>
  );
}

function DriverProfileForm({
  isSaving,
  onSubmit,
  profile
}: {
  isSaving: boolean;
  onSubmit: (request: {
    availabilityStatus: DriverAvailabilityStatus;
    licenseCategory: string;
    licenseExpiresAt: string;
    licenseNumber: string;
    phone: string;
  }) => void;
  profile: DriverProfile;
}) {
  const [form, setForm] = useState({
    availabilityStatus: profile.availabilityStatus,
    licenseCategory: profile.licenseCategory,
    licenseExpiresAt: profile.licenseExpiresAt,
    licenseNumber: profile.licenseNumber,
    phone: profile.phone
  });

  useEffect(() => {
    setForm({
      availabilityStatus: profile.availabilityStatus,
      licenseCategory: profile.licenseCategory,
      licenseExpiresAt: profile.licenseExpiresAt,
      licenseNumber: profile.licenseNumber,
      phone: profile.phone
    });
  }, [profile]);

  const licenseExpired = useMemo(
    () => new Date(profile.licenseExpiresAt) < new Date(),
    [profile.licenseExpiresAt]
  );

  return (
    <div className="driver-two-column">
      <div className="admin-detail">
        <p className="eyebrow">Profile</p>
        <strong>{profile.fullName}</strong>
        <span>{profile.phone}</span>
        <span>License {profile.licenseNumber}</span>
        <span>Category {profile.licenseCategory}</span>
        <span>Expires {profile.licenseExpiresAt}</span>
        {licenseExpired && <div className="form-error">Driver license expired</div>}
      </div>
      <form
        className="admin-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <label>
          Phone
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </label>
        <label>
          License number
          <input
            value={form.licenseNumber}
            onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })}
          />
        </label>
        <label>
          License category
          <input
            value={form.licenseCategory}
            onChange={(event) => setForm({ ...form, licenseCategory: event.target.value })}
          />
        </label>
        <label>
          License expiration date
          <input
            type="date"
            value={form.licenseExpiresAt}
            onChange={(event) => setForm({ ...form, licenseExpiresAt: event.target.value })}
          />
        </label>
        <label>
          Availability status
          <select
            value={form.availabilityStatus}
            onChange={(event) =>
              setForm({ ...form, availabilityStatus: event.target.value as DriverAvailabilityStatus })
            }
          >
            {availabilityOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <Button type="submit" disabled={isSaving}>
          Save driver profile
        </Button>
      </form>
    </div>
  );
}

function DriverAvailabilitySection({
  isDeleting,
  isSaving,
  onCreate,
  onDelete,
  onUpdate,
  slots
}: {
  isDeleting: boolean;
  isSaving: boolean;
  onCreate: (request: DriverAvailabilitySlotRequest) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, request: DriverAvailabilitySlotRequest) => void;
  slots: DriverAvailabilitySlot[];
}) {
  const [mode, setMode] = useState<"calendar" | "table">("table");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const [form, setForm] = useState({ endAt: "", note: "", startAt: "" });
  const editingSlot = slots.find((slot) => slot.id === editingSlotId);

  const resetForm = () => {
    setEditingSlotId(null);
    setValidationError("");
    setForm({ endAt: "", note: "", startAt: "" });
  };

  const submitLabel = editingSlot ? "Save availability slot" : "Create availability slot";

  return (
    <div className="driver-two-column">
      <form
        className="admin-form"
        onSubmit={(event) => {
          event.preventDefault();
          const request = toAvailabilitySlotRequest(form);
          if (hasAvailabilityOverlap(slots, request, editingSlot?.id)) {
            setValidationError("Availability overlaps existing slot");
            return;
          }
          if (editingSlot) {
            onUpdate(editingSlot.id, request);
          } else {
            onCreate(request);
          }
          resetForm();
        }}
      >
        <label>
          Slot start
          <input
            type="datetime-local"
            value={form.startAt}
            onChange={(event) => setForm({ ...form, startAt: event.target.value })}
            required
          />
        </label>
        <label>
          Slot end
          <input
            type="datetime-local"
            value={form.endAt}
            onChange={(event) => setForm({ ...form, endAt: event.target.value })}
            required
          />
        </label>
        <label>
          Slot note
          <input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </label>
        {validationError && <div className="form-error">{validationError}</div>}
        <div className="inline-actions">
          <Button type="submit" disabled={isSaving}>
            {submitLabel}
          </Button>
          {editingSlot && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>
      </form>

      <div className="admin-detail availability-panel">
        <div className="results-header compact">
          <strong>{slots.length} slots</strong>
          <div className="segmented-control" role="group" aria-label="Availability view">
            <button
              className={`segment ${mode === "table" ? "active" : ""}`}
              type="button"
              onClick={() => setMode("table")}
            >
              Table
            </button>
            <button
              className={`segment ${mode === "calendar" ? "active" : ""}`}
              type="button"
              onClick={() => setMode("calendar")}
            >
              Calendar
            </button>
          </div>
        </div>
        {slots.length === 0 ? (
          <div className="catalog-state">No availability slots yet.</div>
        ) : mode === "table" ? (
          <DriverAvailabilityTable
            isDeleting={isDeleting}
            onDelete={onDelete}
            onEdit={(slot) => {
              setEditingSlotId(slot.id);
              setForm({
                endAt: toDatetimeLocal(slot.endAt),
                note: slot.note ?? "",
                startAt: toDatetimeLocal(slot.startAt)
              });
            }}
            slots={slots}
          />
        ) : (
          <DriverAvailabilityCalendar slots={slots} />
        )}
      </div>
    </div>
  );
}

function DriverAvailabilityTable({
  isDeleting,
  onDelete,
  onEdit,
  slots
}: {
  isDeleting: boolean;
  onDelete: (id: string) => void;
  onEdit: (slot: DriverAvailabilitySlot) => void;
  slots: DriverAvailabilitySlot[];
}) {
  return (
    <div className="admin-list">
      {slots.map((slot) => {
        const title = slot.note || `${formatDateTime(slot.startAt)} availability`;
        return (
          <div key={slot.id} className="admin-list-row static availability-row">
            <strong>{title}</strong>
            <span>
              {formatDateTime(slot.startAt)} - {formatDateTime(slot.endAt)}
            </span>
            <div className="inline-actions">
              <Button type="button" variant="secondary" aria-label={`Edit availability slot ${title}`} onClick={() => onEdit(slot)}>
                Edit
              </Button>
              <Button
                type="button"
                variant="secondary"
                aria-label={`Delete availability slot ${title}`}
                disabled={isDeleting}
                onClick={() => onDelete(slot.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DriverAvailabilityCalendar({ slots }: { slots: DriverAvailabilitySlot[] }) {
  const groups = slots.reduce<Array<{ dateLabel: string; slots: DriverAvailabilitySlot[] }>>((acc, slot) => {
    const dateLabel = formatCalendarDate(slot.startAt);
    const group = acc.find((candidate) => candidate.dateLabel === dateLabel);
    if (group) {
      group.slots.push(slot);
    } else {
      acc.push({ dateLabel, slots: [slot] });
    }
    return acc;
  }, []);

  return (
    <div className="availability-calendar">
      {groups.map((group) => (
        <div key={group.dateLabel} className="availability-day">
          <strong>{group.dateLabel}</strong>
          {group.slots.map((slot) => (
            <span key={slot.id}>
              {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
              {slot.note ? `, ${slot.note}` : ""}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function DriverTripList({
  cities,
  routes,
  trips
}: {
  cities: DriverCity[];
  routes: DriverRoute[];
  trips: Trip[];
}) {
  if (trips.length === 0) {
    return <div className="catalog-state">No assigned trips yet.</div>;
  }
  return (
    <div className="admin-list driver-trip-list">
      {trips.map((trip) => {
        const route = routes.find((candidate) => candidate.id === trip.routeId);
        const from = getCityName(cities, route?.fromCityId);
        const to = getCityName(cities, route?.toCityId);
        const hasRoutePreview = Boolean(route && from !== "Unknown city" && to !== "Unknown city");
        return (
          <ListRow
            key={trip.id}
            title={`${from} -> ${to}`}
            meta={`${formatDateTime(trip.departureTime)} - ${formatDateTime(trip.arrivalTime)}`}
            aside={
              hasRoutePreview ? (
                <RouteMapPreview
                  from={getCityName(cities, route?.fromCityId)}
                  to={getCityName(cities, route?.toCityId)}
                  distanceKm={route?.distanceKm}
                  durationMinutes={route?.estimatedDurationMinutes}
                  capacityLabel={`${trip.availableSeats ?? trip.totalSeats} seats available`}
                />
              ) : undefined
            }
          >
            {trip.availableSeats}/{trip.totalSeats} seats, {trip.availableCargoVolume}/{trip.totalCargoVolume} m3 cargo
          </ListRow>
        );
      })}
    </div>
  );
}

function AvailabilityBadge({ status }: { status: DriverAvailabilityStatus }) {
  const tone = status === "AVAILABLE" ? "success" : status === "SUSPENDED" ? "danger" : "neutral";
  return <span className={`status-chip status-${tone}`}>{status}</span>;
}

function isMissingDriverProfileError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const candidate = error as { message?: unknown; payload?: { message?: unknown; status?: unknown }; status?: unknown };
  return (
    candidate.status === 404 ||
    candidate.payload?.status === 404 ||
    candidate.message === "Driver profile not found" ||
    candidate.payload?.message === "Driver profile not found"
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function formatCalendarDate(value: string) {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short"
  }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === "day")?.value ?? ""} ${
    parts.find((part) => part.type === "month")?.value ?? ""
  }`.trim();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toAvailabilitySlotRequest(form: { endAt: string; note: string; startAt: string }) {
  return {
    endAt: new Date(form.endAt).toISOString(),
    note: form.note.trim() || undefined,
    startAt: new Date(form.startAt).toISOString()
  };
}

function hasAvailabilityOverlap(
  slots: DriverAvailabilitySlot[],
  request: DriverAvailabilitySlotRequest,
  ignoredSlotId?: string
) {
  const start = new Date(request.startAt).getTime();
  const end = new Date(request.endAt).getTime();
  return slots.some((slot) => {
    if (slot.id === ignoredSlotId) {
      return false;
    }
    return start < new Date(slot.endAt).getTime() && end > new Date(slot.startAt).getTime();
  });
}
