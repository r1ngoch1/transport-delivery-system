import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NavLink, useLocation } from "react-router-dom";
import {
  cancelAdminCargoOrder,
  createCity,
  createRoute,
  getAdminData,
  updateTrip,
  type AdminBooking,
  type AdminCargoOrder,
  type AdminCity,
  type AdminData,
  type AdminPayment,
  type AdminRoute,
  type AdminTrip,
  type AdminUser
} from "../features/admin/adminApi";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { Button } from "../shared/ui/Button";
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { MetricTile } from "../shared/ui/MetricTile";
import { PageHeader } from "../shared/ui/PageHeader";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

const adminSections = [
  { id: "dashboard", label: "Dashboard", path: "/admin" },
  { id: "users", label: "Users", path: "/admin/users" },
  { id: "routes", label: "Routes", path: "/admin/routes" },
  { id: "trips", label: "Trips", path: "/admin/trips" },
  { id: "bookings", label: "Bookings", path: "/admin/bookings" },
  { id: "payments", label: "Payments", path: "/admin/payments" },
  { id: "cargo", label: "Cargo", path: "/admin/cargo" },
  { id: "audit", label: "Audit", path: "/admin/audit" }
];

type AdminSectionId = (typeof adminSections)[number]["id"];

export function AdminPage() {
  const location = useLocation();
  const sectionId = getSectionId(location.pathname);
  const adminDataQuery = useQuery({
    queryKey: ["admin-data"],
    queryFn: getAdminData
  });

  return (
    <main className="page admin-page">
      <aside className="panel admin-sidebar">
        <p className="eyebrow">Admin</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          {adminSections.map((section) => (
            <NavLink
              key={section.id}
              to={section.path}
              end={section.id === "dashboard"}
              className={({ isActive }) => (isActive ? "admin-nav-link active" : "admin-nav-link")}
            >
              {section.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/" className="inline-link">
          Passenger flow
        </NavLink>
      </aside>

      <section className="admin-content">
        {adminDataQuery.isLoading && (
          <ScreenState className="page-subtitle" inline kind="loading" message="Loading admin data" />
        )}
        {adminDataQuery.isError && (
          <ApiErrorMessage error={adminDataQuery.error} fallback="Could not load admin data" />
        )}
        {adminDataQuery.data && <AdminSection sectionId={sectionId} data={adminDataQuery.data} />}
      </section>
    </main>
  );
}

function AdminSection({ data, sectionId }: { data: AdminData; sectionId: AdminSectionId }) {
  if (sectionId === "users") {
    return <UsersSection users={data.users} />;
  }
  if (sectionId === "routes") {
    return <RoutesSection cities={data.cities} routes={data.routes} />;
  }
  if (sectionId === "trips") {
    return <TripsSection trips={data.trips} routes={data.routes} />;
  }
  if (sectionId === "bookings") {
    return <BookingsSection bookings={data.bookings} payments={data.payments} />;
  }
  if (sectionId === "payments") {
    return <PaymentsSection payments={data.payments} />;
  }
  if (sectionId === "cargo") {
    return <CargoSection cargoOrders={data.cargoOrders} />;
  }
  if (sectionId === "audit") {
    return <AuditSection />;
  }
  return <DashboardSection data={data} />;
}

function DashboardSection({ data }: { data: AdminData }) {
  const cards = [
    { label: "Users", value: data.users.length, unit: "record", path: "/admin/users" },
    { label: "Cities", value: data.cities.length, unit: "city", path: "/admin/routes" },
    { label: "Routes", value: data.routes.length, unit: "route", path: "/admin/routes" },
    { label: "Trips", value: data.trips.length, unit: "trip", path: "/admin/trips" },
    { label: "Bookings", value: data.bookings.length, unit: "booking", path: "/admin/bookings" },
    { label: "Payments", value: data.payments.length, unit: "payment", path: "/admin/payments" },
    { label: "Cargo", value: data.cargoOrders.length, unit: "cargo order", path: "/admin/cargo" }
  ];

  return (
    <DataPanel>
      <PageHeader
        eyebrow="Overview"
        title="Admin dashboard"
        subtitle="Operational workspace backed by the Admin Service facade."
      />
      <div className="admin-summary-grid">
        {cards.map((card) => (
          <MetricTile key={card.label} href={card.path} label={card.label} value={formatCount(card.value, card.unit)} />
        ))}
      </div>
      <div className="catalog-state">Audit log is written by Admin Service runtime logs.</div>
    </DataPanel>
  );
}

function UsersSection({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState("");
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        [user.fullName, user.email, user.phone, user.roles.join(" ")].join(" ").toLowerCase().includes(search.toLowerCase())
      ),
    [search, users]
  );
  const [selectedId, setSelectedId] = useState("");
  const selectedUser = users.find((user) => user.id === selectedId) ?? filteredUsers[0] ?? users[0];

  return (
    <DataPanel>
      <SectionHeader eyebrow="Identity" title="Users" subtitle="Search users, inspect profile fields, and review roles." />
      <label className="admin-filter">
        Search users
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Email, name, role" />
      </label>
      <div className="admin-two-column">
        <div className="admin-list">
          {filteredUsers.map((user) => (
            <ListRow key={user.id} title={user.fullName} meta={user.email} onClick={() => setSelectedId(user.id)} />
          ))}
        </div>
        {selectedId && selectedUser && (
          <div className="admin-detail">
            <p className="eyebrow">Profile</p>
            <strong>{selectedUser.fullName}</strong>
            <span>{selectedUser.email}</span>
            <span>{selectedUser.phone}</span>
            <span>Roles: {selectedUser.roles.join(", ")}</span>
            <StatusChip status={selectedUser.enabled ? "CONFIRMED" : "CANCELLED"} label={selectedUser.enabled ? "ENABLED" : "DISABLED"} />
            <Button type="button" disabled variant="secondary">
              Lock user unavailable
            </Button>
          </div>
        )}
      </div>
    </DataPanel>
  );
}

function RoutesSection({ cities, routes }: { cities: AdminCity[]; routes: AdminRoute[] }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [cityForm, setCityForm] = useState({ name: "", region: "", country: "", active: true });
  const [routeForm, setRouteForm] = useState({
    fromCityId: cities[0]?.id ?? "",
    toCityId: cities[1]?.id ?? cities[0]?.id ?? "",
    distanceKm: "",
    estimatedDurationMinutes: "",
    active: true
  });
  const cityMutation = useMutation({
    mutationFn: createCity,
    onSuccess() {
      setNotice("City saved");
      setCityForm({ name: "", region: "", country: "", active: true });
      void queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    }
  });
  const routeMutation = useMutation({
    mutationFn: createRoute,
    onSuccess() {
      setNotice("Route saved");
      void queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    }
  });

  return (
    <DataPanel>
      <SectionHeader eyebrow="Network" title="Cities and routes" subtitle="Create route catalog records and review active paths." />
      {notice && <div className="notice">{notice}</div>}
      {cityMutation.isError && <ApiErrorMessage error={cityMutation.error} fallback="Could not save city" />}
      {routeMutation.isError && <ApiErrorMessage error={routeMutation.error} fallback="Could not save route" />}
      <div className="admin-form-grid">
        <form
          className="admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            cityMutation.mutate(cityForm);
          }}
        >
          <p className="eyebrow">City</p>
          <label>
            City name
            <input value={cityForm.name} onChange={(event) => setCityForm({ ...cityForm, name: event.target.value })} required />
          </label>
          <label>
            Region
            <input value={cityForm.region} onChange={(event) => setCityForm({ ...cityForm, region: event.target.value })} required />
          </label>
          <label>
            Country
            <input value={cityForm.country} onChange={(event) => setCityForm({ ...cityForm, country: event.target.value })} required />
          </label>
          <Button type="submit">Create city</Button>
          <Button type="button" disabled variant="secondary">Delete city unavailable</Button>
        </form>
        <form
          className="admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            routeMutation.mutate({
              ...routeForm,
              distanceKm: Number(routeForm.distanceKm),
              estimatedDurationMinutes: Number(routeForm.estimatedDurationMinutes)
            });
          }}
        >
          <p className="eyebrow">Route</p>
          <label>
            From city
            <select value={routeForm.fromCityId} onChange={(event) => setRouteForm({ ...routeForm, fromCityId: event.target.value })}>
              {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </label>
          <label>
            To city
            <select value={routeForm.toCityId} onChange={(event) => setRouteForm({ ...routeForm, toCityId: event.target.value })}>
              {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </label>
          <label>
            Distance km
            <input value={routeForm.distanceKm} onChange={(event) => setRouteForm({ ...routeForm, distanceKm: event.target.value })} />
          </label>
          <label>
            Duration minutes
            <input value={routeForm.estimatedDurationMinutes} onChange={(event) => setRouteForm({ ...routeForm, estimatedDurationMinutes: event.target.value })} />
          </label>
          <Button type="submit">Create route</Button>
        </form>
      </div>
      <DataGrid title="Cities" rows={cities.map((city) => [city.name, city.region, city.country, city.active ? "Active" : "Inactive"])} />
      <DataGrid title="Routes" rows={routes.map((route) => [route.id, `${route.distanceKm} km`, `${route.estimatedDurationMinutes} min`, route.active ? "Active" : "Inactive"])} />
    </DataPanel>
  );
}

function TripsSection({ trips, routes }: { trips: AdminTrip[]; routes: AdminRoute[] }) {
  const queryClient = useQueryClient();
  const firstTrip = trips[0];
  const [selectedTripId, setSelectedTripId] = useState(firstTrip?.id ?? "");
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) ?? firstTrip;
  const [status, setStatus] = useState(selectedTrip?.status ?? "SCHEDULED");
  const [notice, setNotice] = useState("");
  const updateMutation = useMutation({
    mutationFn: () => updateTrip(selectedTrip?.id ?? "", { status }),
    onSuccess() {
      setNotice("Trip updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    }
  });

  return (
    <DataPanel>
      <SectionHeader eyebrow="Operations" title="Trips" subtitle="Review trips and update supported status/driver fields." />
      {notice && <div className="notice">{notice}</div>}
      {updateMutation.isError && <ApiErrorMessage error={updateMutation.error} fallback="Could not update trip" />}
      <div className="admin-form-grid">
        <form
          className="admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate();
          }}
        >
          <label>
            Trip
            <select value={selectedTrip?.id ?? ""} onChange={(event) => setSelectedTripId(event.target.value)}>
              {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.id}</option>)}
            </select>
          </label>
          <label>
            Trip status
            <select value={status} onChange={(event) => setStatus(event.target.value as AdminTrip["status"])}>
              {["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <Button type="submit" disabled={!selectedTrip}>Update trip</Button>
        </form>
        <div className="admin-detail">
          <p className="eyebrow">Selected trip</p>
          {selectedTrip ? (
            <>
              <strong>{selectedTrip.id}</strong>
              <span>Route {selectedTrip.routeId}</span>
              <span>{formatDateTime(selectedTrip.departureTime)} - {formatDateTime(selectedTrip.arrivalTime)}</span>
              <span>{selectedTrip.availableSeats}/{selectedTrip.totalSeats} seats</span>
              <span>{selectedTrip.price} RUB</span>
            </>
          ) : (
            <span>No trips available</span>
          )}
        </div>
      </div>
      <DataGrid title="Route assignments" rows={routes.map((route) => [route.id, route.fromCityId, route.toCityId])} />
    </DataPanel>
  );
}

function BookingsSection({ bookings, payments }: { bookings: AdminBooking[]; payments: AdminPayment[] }) {
  return (
    <DataPanel>
      <SectionHeader eyebrow="Reservations" title="Bookings" subtitle="Inspect passenger bookings and linked payment state." />
      <div className="admin-list">
        {bookings.map((booking) => {
          const payment = payments.find((candidate) => candidate.id === booking.paymentId);
          return (
            <ListRow
              key={booking.id}
              title={`Booking ${booking.id}`}
              meta={`User ${booking.userId} - Trip ${booking.tripId} - Seat ${booking.seatNumber}`}
              aside={<Button type="button" disabled variant="secondary">Cancel booking unavailable</Button>}
            >
              <span>Payment {payment?.status ?? "not found"}</span>
            </ListRow>
          );
        })}
      </div>
    </DataPanel>
  );
}

function PaymentsSection({ payments }: { payments: AdminPayment[] }) {
  return (
    <DataPanel>
      <SectionHeader eyebrow="Money" title="Payments" subtitle="Review payment targets, status, and idempotency metadata." />
      <div className="admin-list">
        {payments.map((payment) => (
          <ListRow key={payment.id} title={`Payment ${payment.status}`} meta={`${payment.targetType} ${payment.targetId}`}>
            <span>{payment.amount} {payment.currency}</span>
            <span>{payment.idempotencyKey ?? "Idempotency key not provided"}</span>
          </ListRow>
        ))}
      </div>
    </DataPanel>
  );
}

function CargoSection({ cargoOrders }: { cargoOrders: AdminCargoOrder[] }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AdminCargoOrder["status"] | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const filteredOrders = useMemo(
    () => cargoOrders.filter((order) => statusFilter === "ALL" || order.status === statusFilter),
    [cargoOrders, statusFilter]
  );
  const selectedOrder = cargoOrders.find((order) => order.id === selectedId);
  const cancelMutation = useMutation({
    mutationFn: cancelAdminCargoOrder,
    onSuccess(updatedOrder) {
      setNotice("Cargo order cancelled");
      setSelectedId(updatedOrder.id);
      void queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    }
  });

  return (
    <DataPanel>
      <SectionHeader eyebrow="Freight" title="Cargo orders" subtitle="Inspect cargo orders, trip assignment, dimensions, and payment status." />
      {notice && <div className="notice">{notice}</div>}
      {cancelMutation.isError && <ApiErrorMessage error={cancelMutation.error} fallback="Could not cancel cargo order" />}
      <label className="admin-filter">
        Cargo status
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AdminCargoOrder["status"] | "ALL")}>
          {["ALL", "PENDING_PAYMENT", "PAID", "CANCELLED"].map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <div className="admin-two-column">
        <div className="admin-list">
          {filteredOrders.map((order) => (
            <ListRow
              key={order.id}
              title={<>{order.description}<span className="sr-only"> {order.id}</span></>}
              meta={<span aria-hidden="true">{senderRecipientLabel(order)}</span>}
              onClick={() => setSelectedId(order.id)}
            >
              <span aria-hidden="true">Trip {order.tripId} · {order.status}</span>
              <span aria-hidden="true">{cargoSizeLabel(order)} · {order.price} {order.currency}</span>
            </ListRow>
          ))}
        </div>
        {selectedOrder && (
          <div className="admin-detail">
            <p className="eyebrow">Cargo details</p>
            <strong>{selectedOrder.description}</strong>
            <span>{senderRecipientLabel(selectedOrder)}</span>
            <span>{routeLabel(selectedOrder)}</span>
            <span>{addressLabel(selectedOrder)}</span>
            <span>Trip {selectedOrder.tripId}</span>
            <span>Payment {selectedOrder.paymentId ?? "not linked"}</span>
            <span>{cargoSizeLabel(selectedOrder)}</span>
            {selectedOrder.declaredValue !== undefined && (
              <span>Declared value {selectedOrder.declaredValue} {selectedOrder.currency}</span>
            )}
            <StatusChip status={selectedOrder.status} />
            {selectedOrder.status !== "CANCELLED" && (
              <Button
                disabled={cancelMutation.isPending}
                type="button"
                variant="secondary"
                onClick={() => cancelMutation.mutate(selectedOrder.id)}
              >
                Cancel cargo order
              </Button>
            )}
          </div>
        )}
      </div>
    </DataPanel>
  );
}

function AuditSection() {
  return (
    <DataPanel>
      <SectionHeader eyebrow="Audit" title="Audit log" subtitle="Audit records are currently emitted by the backend logger." />
      <div className="catalog-state">Use service logs filtered by admin_audit until an audit query endpoint exists.</div>
    </DataPanel>
  );
}

function DataGrid({ rows, title }: { rows: string[][]; title: string }) {
  return (
    <div className="admin-table-block">
      <p className="eyebrow">{title}</p>
      <div className="admin-table">
        {rows.map((row) => (
          <div key={row.join(":")} className="admin-table-row">
            {row.map((cell) => <span key={cell}>{cell}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, subtitle, title }: { eyebrow: string; subtitle: string; title: string }) {
  return <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />;
}

function getSectionId(pathname: string): AdminSectionId {
  const candidate = pathname.split("/")[2] ?? "dashboard";
  return adminSections.some((section) => section.id === candidate) ? (candidate as AdminSectionId) : "dashboard";
}

function formatCount(value: number, unit: string) {
  if (unit === "record") {
    return `${value} records`;
  }
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function routeLabel(order: AdminCargoOrder) {
  return `${order.pickupCity ?? "Pickup"} -> ${order.dropoffCity ?? "Dropoff"}`;
}

function addressLabel(order: AdminCargoOrder) {
  return `${order.pickupAddress ?? "Pickup address pending"} -> ${order.dropoffAddress ?? "Dropoff address pending"}`;
}

function senderRecipientLabel(order: AdminCargoOrder) {
  return `${order.senderName ?? "Sender pending"} -> ${order.recipientName ?? "Recipient pending"}`;
}

function cargoSizeLabel(order: AdminCargoOrder) {
  return `${formatNumber(order.weightKg)} kg · ${formatNumber(order.volumeM3)} m3`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
