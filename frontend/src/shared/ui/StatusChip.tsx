import type { BookingStatus, PaymentStatus, TripStatus } from "../../api/types";

type Status = BookingStatus | PaymentStatus | TripStatus;

const successStatuses: Status[] = ["CONFIRMED", "SUCCESS", "COMPLETED"];
const dangerStatuses: Status[] = ["CANCELLED", "FAILED"];
const warningStatuses: Status[] = ["PENDING", "REFUNDED"];

export function StatusChip({ status, label = status }: { status: Status; label?: string }) {
  const tone = getTone(status);
  return <span className={`status-chip status-${tone}`}>{label}</span>;
}

function getTone(status: Status): "success" | "danger" | "warning" | "neutral" {
  if (successStatuses.includes(status)) {
    return "success";
  }
  if (dangerStatuses.includes(status)) {
    return "danger";
  }
  if (warningStatuses.includes(status)) {
    return "warning";
  }
  return "neutral";
}
