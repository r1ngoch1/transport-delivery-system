import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelCargoOrder, listMyCargoOrders, type CargoOrder } from "../features/cargo/cargoApi";
import { findCargoPayments } from "../features/payments/paymentApi";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { Button } from "../shared/ui/Button";
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { PageHeader } from "../shared/ui/PageHeader";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function MyCargoOrdersPage() {
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
      setNotice("Cargo order cancelled");
      setSelectedId(updatedOrder.id);
      void queryClient.invalidateQueries({ queryKey: ["my-cargo-orders"] });
    }
  });

  return (
    <main className="page">
      <DataPanel>
        <PageHeader eyebrow="Cargo" title="My cargo orders" subtitle="Review cargo shipments, route details, and payment status." />
        {notice && <div className="notice">{notice}</div>}
        {cargoOrdersQuery.isLoading && (
          <ScreenState className="catalog-state booking-state" kind="loading" message="Loading cargo orders" />
        )}
        {cargoOrdersQuery.isError && (
          <ApiErrorMessage
            className="form-error booking-state"
            error={cargoOrdersQuery.error}
            fallback="Could not load cargo orders"
          />
        )}
        {cancelMutation.isError && (
          <ApiErrorMessage
            className="form-error booking-state"
            error={cancelMutation.error}
            fallback="Could not cancel cargo order"
          />
        )}
        {cargoOrdersQuery.isSuccess && cargoOrdersQuery.data.length === 0 && (
          <ScreenState className="catalog-state booking-state" kind="empty" message="No cargo orders yet" />
        )}
        {cargoOrdersQuery.isSuccess && cargoOrdersQuery.data.length > 0 && (
          <div className="admin-two-column">
            <div className="admin-list">
              {cargoOrdersQuery.data.map((order) => (
                <ListRow
                  key={order.id}
                  ariaLabel={`${order.description} ${order.id}`}
                  title={order.description}
                  meta={routeLabel(order)}
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
  return (
    <div className="admin-detail">
      <p className="eyebrow">Cargo details</p>
      <strong>{order.description}</strong>
      <span>{routeLabel(order)}</span>
      <span>{addressLabel(order)}</span>
      <span>{senderRecipientLabel(order)}</span>
      <span>{cargoSizeLabel(order)}</span>
      <span>Trip {order.tripId}</span>
      <span>{order.price} {order.currency}</span>
      {order.declaredValue !== undefined && <span>Declared value {order.declaredValue} {order.currency}</span>}
      <StatusChip status={order.status} />
      <CargoPaymentStatus cargoOrderId={order.id} />
      {order.status !== "CANCELLED" && (
        <Button disabled={isCancelling} type="button" variant="secondary" onClick={onCancel}>
          Cancel cargo order
        </Button>
      )}
    </div>
  );
}

function CargoPaymentStatus({ cargoOrderId }: { cargoOrderId: string }) {
  const paymentsQuery = useQuery({
    queryKey: ["cargo-payments", cargoOrderId],
    queryFn: () => findCargoPayments(cargoOrderId)
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

function routeLabel(order: CargoOrder) {
  return `${order.pickupCity ?? "Pickup"} -> ${order.dropoffCity ?? "Dropoff"}`;
}

function addressLabel(order: CargoOrder) {
  return `${order.pickupAddress ?? "Pickup address pending"} -> ${order.dropoffAddress ?? "Dropoff address pending"}`;
}

function senderRecipientLabel(order: CargoOrder) {
  return `${order.senderName ?? "Sender pending"} -> ${order.recipientName ?? "Recipient pending"}`;
}

function cargoSizeLabel(order: CargoOrder) {
  return `${formatNumber(order.weightKg)} kg В· ${formatNumber(order.volumeM3)} m3`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
