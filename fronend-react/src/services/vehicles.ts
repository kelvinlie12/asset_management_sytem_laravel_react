import api from "./api";
import type { Room } from "./rooms";
import type { Team } from "./teams";
import type { User } from "./users";

export interface Vehicle {
  id: number;
  asset_code: string;
  photo: string | null;
  photo_url: string | null;
  brand: string;
  model: string;
  plate_number: string | null;
  engine_number: string | null;
  chassis_number: string | null;
  purchase_date: string | null;
  purchase_price: string | null;
  tax_due_date: string | null;
  description: string | null;
  condition: string;
  usage_status: string;
  team: Team | null;
  room: Room | null;
  assigned_user: User | null;
  created_at?: string;
  updated_at?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const VEHICLE_CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good" },
  { value: "DAMAGED", label: "Damaged" },
];

export const VEHICLE_USAGE_OPTIONS = [
  { value: "IN_USE", label: "In Use" },
  { value: "IN_STORAGE", label: "In Storage" },
];

export interface VehicleFilters {
  search?: string;
  condition?: string;
  usage_status?: string;
  team_id?: string;
  room_id?: string;
  tax_status?: string;
  page?: number;
  per_page?: number;
}

export function fetchVehicles(filters: VehicleFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.condition) params.condition = filters.condition;
  if (filters.usage_status) params.usage_status = filters.usage_status;
  if (filters.team_id) params.team_id = filters.team_id;
  if (filters.room_id) params.room_id = filters.room_id;
  if (filters.tax_status) params.tax_status = filters.tax_status;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;
  return api.get<Paginated<Vehicle>>("/vehicles", { params });
}

export function fetchVehicle(id: number) {
  return api.get<{ vehicle: Vehicle }>(`/vehicles/${id}`);
}

export function createVehicle(payload: Record<string, unknown>) {
  return api.post<{ message: string; vehicle: Vehicle }>("/vehicles", payload);
}

export function updateVehicle(id: number, payload: Record<string, unknown>) {
  return api.put<{ message: string; vehicle: Vehicle }>(
    `/vehicles/${id}`,
    payload,
  );
}

export function deleteVehicle(id: number) {
  return api.delete<{ message: string }>(`/vehicles/${id}`);
}

export type VehicleTaxStatus = "safe" | "due_soon" | "overdue";

export const TAX_DUE_SOON_DAYS = 30;

export function computeVehicleTaxStatus(
  taxDueDate: string | null,
  today = new Date(),
): VehicleTaxStatus | null {
  if (!taxDueDate) return null;
  const due = new Date(taxDueDate + "T00:00:00");
  const now = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  if (due < now) return "overdue";
  const soon = new Date(now);
  soon.setDate(now.getDate() + TAX_DUE_SOON_DAYS);
  if (due <= soon) return "due_soon";
  return "safe";
}

export const VEHICLE_TAX_OPTIONS = [
  { value: "safe", label: "Aman" },
  { value: "due_soon", label: "Segera jatuh tempo" },
  { value: "overdue", label: "Terlambat" },
];

export const VEHICLE_TAX_META: Record<
  VehicleTaxStatus,
  { label: string; color: "success" | "warning" | "error" }
> = {
  safe: { label: "Aman", color: "success" },
  due_soon: { label: "Segera jatuh tempo", color: "warning" },
  overdue: { label: "Terlambat", color: "error" },
};
