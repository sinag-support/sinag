import {
  Clock,
  Package,
  MapPin,
  AlertTriangle,
  RotateCcw,
  DollarSign,
} from "lucide-react";

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  discount: number;
  product: {
    id: string;
    title: string;
    images: string[];
  };
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "PACKED"
  | "READY_FOR_PICKUP"
  | "ASSIGNED_RIDER"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUND_REQUESTED"
  | "REFUNDED";

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  total: number;
  payable: number;
  shipping: number;
  tax: number;
  discount: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  } | null;
  payments: {
    id: string;
    method: string;
    status: string;
    amount: number;
    reference: string | null;
    createdAt: string;
  }[];
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

// Status helper functions
export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  PACKED: "Packed",
  READY_FOR_PICKUP: "Ready for Pickup",
  ASSIGNED_RIDER: "Assigned Rider",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURNED: "Returned",
  REFUND_REQUESTED: "Refund Requested",
  REFUNDED: "Refunded",
};

export const orderStatusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PREPARING: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  PACKED: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  READY_FOR_PICKUP: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  ASSIGNED_RIDER: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  OUT_FOR_DELIVERY: "bg-[#8EC801]/10 text-[#429801] border-[#8EC801]/20",
  DELIVERED: "bg-green-500/10 text-green-600 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
  RETURN_REQUESTED: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  RETURNED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  REFUND_REQUESTED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  REFUNDED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export const orderStatusIcons: Record<OrderStatus, any> = {
  PENDING: Clock,
  CONFIRMED: Package,
  PREPARING: Package,
  PACKED: Package,
  READY_FOR_PICKUP: MapPin,
  ASSIGNED_RIDER: MapPin,
  OUT_FOR_DELIVERY: MapPin,
  DELIVERED: Package,
  CANCELLED: Package,
  RETURN_REQUESTED: AlertTriangle,
  RETURNED: RotateCcw,
  REFUND_REQUESTED: DollarSign,
  REFUNDED: Package,
};

// Helper function to format status
export function formatOrderStatus(status: OrderStatus): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Helper to check if status is a return/refund status
export function isReturnStatus(status: OrderStatus): boolean {
  return [
    "RETURN_REQUESTED",
    "RETURNED",
    "REFUND_REQUESTED",
    "REFUNDED",
  ].includes(status);
}

// Helper to check if customer can request return
export function canRequestReturn(status: OrderStatus): boolean {
  return status === "DELIVERED";
}

// Helper to check if customer can request refund
export function canRequestRefund(
  status: OrderStatus,
  isPaid: boolean,
): boolean {
  return (status === "DELIVERED" || status === "RETURNED") && isPaid;
}

// Helper to check if rider can accept return
export function canAcceptReturn(status: OrderStatus): boolean {
  return status === "RETURN_REQUESTED";
}

// Helper to check if admin can process refund
export function canProcessRefund(
  status: OrderStatus,
  isPaid: boolean,
): boolean {
  return status === "REFUND_REQUESTED" || (status === "RETURNED" && !isPaid);
}
