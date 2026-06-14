import { useQuery } from "@tanstack/react-query";
import { listMyBookings, type Booking } from "../features/bookings/bookingApi";
import { findBookingPayments } from "../features/payments/paymentApi";
import { useI18n } from "../shared/i18n/i18n";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { PageHeader } from "../shared/ui/PageHeader";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function MyBookingsPage() {
  const { t } = useI18n();
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings"],
    queryFn: listMyBookings
  });

  return (
    <main className="page">
      <DataPanel>
        <PageHeader eyebrow={t("Reservations")} title={t("My bookings")} subtitle={t("Track trip reservations and payment status.")} />
        {bookingsQuery.isLoading && (
          <ScreenState className="catalog-state booking-state" kind="loading" message={t("Loading bookings")} />
        )}
        {bookingsQuery.isError && (
          <ApiErrorMessage
            className="form-error booking-state"
            error={bookingsQuery.error}
            fallback={t("Could not load bookings")}
          />
        )}
        {bookingsQuery.isSuccess && bookingsQuery.data.length === 0 && (
          <ScreenState className="catalog-state booking-state" kind="empty" message={t("No bookings yet")} />
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
  const { t } = useI18n();
  return (
    <ListRow
      title={t("Booking {id}", { id: booking.id })}
      meta={t("Trip {tripId}", { tripId: booking.tripId })}
      aside={
        <>
          <StatusChip status={booking.status} />
          <BookingPaymentStatus bookingId={booking.id} />
        </>
      }
    >
      <>
        <span>{t("Seat {seat}", { seat: booking.seatNumber })}</span>
        <span>{booking.price} RUB</span>
      </>
    </ListRow>
  );
}

function BookingPaymentStatus({ bookingId }: { bookingId: string }) {
  const { t } = useI18n();
  const paymentsQuery = useQuery({
    queryKey: ["booking-payments", bookingId],
    queryFn: () => findBookingPayments(bookingId)
  });

  if (paymentsQuery.isLoading) {
    return <ScreenState className="muted-text" inline kind="loading" message={t("Loading payment")} />;
  }

  if (paymentsQuery.isError) {
    return (
      <ApiErrorMessage
        className="form-error compact-error"
        error={paymentsQuery.error}
        fallback={t("Could not load payment status")}
      />
    );
  }

  const latestPayment = (paymentsQuery.data ?? []).at(-1);
  if (!latestPayment) {
    return <ScreenState className="muted-text" inline kind="empty" message={t("No payment yet")} />;
  }

  return <StatusChip status={latestPayment.status} label={t("Payment {status}", { status: latestPayment.status })} />;
}
