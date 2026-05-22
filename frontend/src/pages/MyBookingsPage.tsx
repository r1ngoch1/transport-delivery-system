import { StatusChip } from "../shared/ui/StatusChip";

export function MyBookingsPage() {
  return (
    <main className="page">
      <section className="panel content-panel">
        <h1 className="page-title">My bookings</h1>
        <p className="page-subtitle">Confirmed and pending passenger bookings will appear here.</p>
        <div className="booking-row">
          <span>Yekaterinburg -&gt; Tyumen</span>
          <StatusChip status="CONFIRMED" />
        </div>
      </section>
    </main>
  );
}
