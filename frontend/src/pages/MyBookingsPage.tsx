import { useQuery } from "@tanstack/react-query";
import { listMyBookings, type Booking } from "../features/bookings/bookingApi";
import { findBookingPayments } from "../features/payments/paymentApi";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { PageHeader } from "../shared/ui/PageHeader";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function MyBookingsPage() {
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings"],
    queryFn: listMyBookings
  });

  return (
    <main className="page">
      <DataPanel>
        <PageHeader eyebrow="Reservations" title="My bookings" subtitle="Track trip reservations and payment status." />
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
      </DataPanel>
    </main>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <ListRow
      title={`Booking ${booking.id}`}
      meta={`Trip ${booking.tripId}`}
      aside={
        <>
          <StatusChip status={booking.status} />
          <BookingPaymentStatus bookingId={booking.id} />
        </>
      }
    >
      <>
        <span>Seat {booking.seatNumber}</span>
        <span>{booking.price} RUB</span>
      </>
    </ListRow>
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
