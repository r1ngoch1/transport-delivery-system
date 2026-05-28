import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelCargoOrder, listMyCargoOrders, type CargoOrder } from "../features/cargo/cargoApi";
import { findCargoPayments } from "../features/payments/paymentApi";
import { useI18n } from "../shared/i18n/i18n";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { Button } from "../shared/ui/Button";
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { PageHeader } from "../shared/ui/PageHeader";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function MyCargoOrdersPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const cargoOrdersQuery = useQuery({
    queryKey: ["my-cargo-orders"],
    queryFn: listMyCargoOrders
  });
  const selectedOrder = useMemo(
    () => cargoOrdersQuery.data?.find((order) => order.id === selectedId),
    [cargoOrdersQuery.data, selectedId]
  );
  const cancelMutation = useMutation({
    mutationFn: cancelCargoOrder,
    onSuccess(updatedOrder) {
      setNotice(t("Cargo order cancelled"));
      setSelectedId(updatedOrder.id);
      void queryClient.invalidateQueries({ queryKey: ["my-cargo-orders"] });
    }
  });

  return (
    <main className="page">
      <DataPanel>
        <PageHeader eyebrow={t("Cargo")} title={t("My cargo orders")} subtitle={t("Review cargo shipments, route details, and payment status.")} />
        {notice && <div className="notice">{notice}</div>}
        {cargoOrdersQuery.isLoading && (
          <ScreenState className="catalog-state booking-state" kind="loading" message={t("Loading cargo orders")} />
        )}
        {cargoOrdersQuery.isError && (
          <ApiErrorMessage
            className="form-error booking-state"
            error={cargoOrdersQuery.error}
            fallback={t("Could not load cargo orders")}
          />
        )}
        {cancelMutation.isError && (
          <ApiErrorMessage
            className="form-error booking-state"
            error={cancelMutation.error}
            fallback={t("Could not cancel cargo order")}
          />
        )}
        {cargoOrdersQuery.isSuccess && cargoOrdersQuery.data.length === 0 && (
          <ScreenState className="catalog-state booking-state" kind="empty" message={t("No cargo orders yet")} />
        )}
        {cargoOrdersQuery.isSuccess && cargoOrdersQuery.data.length > 0 && (
          <div className="admin-two-column">
            <div className="admin-list">
              {cargoOrdersQuery.data.map((order) => (
                <ListRow
                  key={order.id}
                  ariaLabel={`${order.description} ${order.id}`}
                  title={order.description}
                  meta={routeLabel(order, t)}
                  aside={<CargoPaymentStatus cargoOrderId={order.id} />}
                  onClick={() => setSelectedId(order.id)}
                >
                  <>
                    <span>{cargoSizeLabel(order)}</span>
                    <span>{order.price} {order.currency}</span>
                  </>
                </ListRow>
              ))}
            </div>
            {selectedOrder && (
              <CargoOrderDetails
                isCancelling={cancelMutation.isPending}
                onCancel={() => cancelMutation.mutate(selectedOrder.id)}
                order={selectedOrder}
              />
            )}
          </div>
        )}
      </DataPanel>
    </main>
  );
}

function CargoOrderDetails({
  isCancelling,
  onCancel,
  order
}: {
  isCancelling: boolean;
  onCancel: () => void;
  order: CargoOrder;
}) {
  const { t } = useI18n();
  return (
    <div className="admin-detail">
      <p className="eyebrow">{t("Cargo details")}</p>
      <strong>{order.description}</strong>
      <span>{routeLabel(order, t)}</span>
      <span>{addressLabel(order, t)}</span>
      <span>{senderRecipientLabel(order, t)}</span>
      <span>{cargoSizeLabel(order)}</span>
      <span>{t("Trip {tripId}", { tripId: order.tripId })}</span>
      <span>{order.price} {order.currency}</span>
      {order.declaredValue !== undefined && (
        <span>{t("Declared value {value} {currency}", { value: order.declaredValue, currency: order.currency })}</span>
      )}
      <StatusChip status={order.status} />
      <CargoPaymentStatus cargoOrderId={order.id} />
      {order.status !== "CANCELLED" && (
        <Button disabled={isCancelling} type="button" variant="secondary" onClick={onCancel}>
          {t("Cancel cargo order")}
        </Button>
      )}
    </div>
  );
}

function CargoPaymentStatus({ cargoOrderId }: { cargoOrderId: string }) {
  const { t } = useI18n();
  const paymentsQuery = useQuery({
    queryKey: ["cargo-payments", cargoOrderId],
    queryFn: () => findCargoPayments(cargoOrderId)
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

function routeLabel(order: CargoOrder, t: (key: string, params?: Record<string, string | number>) => string) {
  return `${order.pickupCity ?? t("Pickup")} -> ${order.dropoffCity ?? t("Dropoff")}`;
}

function addressLabel(order: CargoOrder, t: (key: string, params?: Record<string, string | number>) => string) {
  return `${order.pickupAddress ?? t("Pickup address pending")} -> ${order.dropoffAddress ?? t("Dropoff address pending")}`;
}

function senderRecipientLabel(order: CargoOrder, t: (key: string, params?: Record<string, string | number>) => string) {
  return `${order.senderName ?? t("Sender pending")} -> ${order.recipientName ?? t("Recipient pending")}`;
}

function cargoSizeLabel(order: CargoOrder) {
  return `${formatNumber(order.weightKg)} kg В· ${formatNumber(order.volumeM3)} m3`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
