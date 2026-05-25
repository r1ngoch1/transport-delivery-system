import { useQuery } from "@tanstack/react-query";
import { listMyBookings, type Booking } from "../features/bookings/bookingApi";
import { findBookingPayments } from "../features/payments/paymentApi";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function MyBookingsPage() {
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings"],
    queryFn: listMyBookings
  });

  return (
    <main className="page">
      <section className="panel content-panel">
        <h1 className="page-title">My bookings</h1>
        <p className="page-subtitle">Confirmed and pending passenger bookings from the gateway.</p>
        {bookingsQuery.isLoading && (
          <ScreenState className="catalog-state booking-state" kind="loading" message="Loading bookings" />
        )}
        {bookingsQuery.isError && (
          <ApiErrorMessage
            className="form-error booking-state"
            error={bookingsQuery.error}
            fallback="Could not load bookings"
          />
        )}
        {bookingsQuery.isSuccess && bookingsQuery.data.length === 0 && (
          <ScreenState className="catalog-state booking-state" kind="empty" message="No bookings yet" />
        )}
        {bookingsQuery.isSuccess && bookingsQuery.data.length > 0 && (
          <div className="booking-list">
            {bookingsQuery.data.map((booking) => (
              <BookingRow booking={booking} key={booking.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <article className="booking-row">
      <div className="booking-main">
        <strong>Booking {booking.id}</strong>
        <span>Trip {booking.tripId}</span>
      </div>
      <div className="booking-meta">
        <span>Seat {booking.seatNumber}</span>
        <span>{booking.price} RUB</span>
      </div>
      <StatusChip status={booking.status} />
      <BookingPaymentStatus bookingId={booking.id} />
    </article>
  );
}

function BookingPaymentStatus({ bookingId }: { bookingId: string }) {
  const paymentsQuery = useQuery({
    queryKey: ["booking-payments", bookingId],
    queryFn: () => findBookingPayments(bookingId)
  });

  if (paymentsQuery.isLoading) {
    return <ScreenState className="muted-text" inline kind="loading" message="Loading payment" />;
  }

  if (paymentsQuery.isError) {
    return (
      <ApiErrorMessage
        className="form-error compact-error"
        error={paymentsQuery.error}
        fallback="Could not load payment status"
      />
    );
  }

  const latestPayment = (paymentsQuery.data ?? []).at(-1);
  if (!latestPayment) {
    return <ScreenState className="muted-text" inline kind="empty" message="No payment yet" />;
  }

  return <StatusChip status={latestPayment.status} label={`Payment ${latestPayment.status}`} />;
}
