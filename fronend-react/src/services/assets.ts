import api from "./api";
import type { Category } from "./categories";
import type { Room } from "./rooms";
import type { Team } from "./teams";
import type { User } from "./users";
import type { Purchase } from "./purchases";
import type { AssetTransfer } from "./transfers";
import type { AssetDamage } from "./damages";

export interface Asset {
  id: number;
  asset_code: string;
  name: string;
  category: Category | null;
  photo: string | null;
  photo_url: string | null;
  purchase_price: string | null;
  purchase_date: string | null;
  purchase_receipt: string | null;
  purchase_receipt_url: string | null;
  description: string | null;
  condition: string;
  usage_status: string;
  team: Team | null;
  room: Room | null;
  assigned_user: User | null;
  purchases?: Purchase[] | null;
  transfers?: AssetTransfer[] | null;
  assignments?: unknown[] | null;
  damages?: AssetDamage[] | null;
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

export const CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good" },
  { value: "DAMAGED", label: "Damaged" },
];

export const USAGE_STATUS_OPTIONS = [
  { value: "IN_USE", label: "In Use" },
  { value: "IN_STORAGE", label: "In Storage" },
];

export interface AssetFilters {
  search?: string;
  condition?: string;
  usage_status?: string;
  category_id?: string;
  room_id?: string;
  team_id?: string;
  assigned_user_id?: string;
  page?: number;
  per_page?: number;
}

export function fetchAssets(filters: AssetFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.condition) params.condition = filters.condition;
  if (filters.usage_status) params.usage_status = filters.usage_status;
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.room_id) params.room_id = filters.room_id;
  if (filters.team_id) params.team_id = filters.team_id;
  if (filters.assigned_user_id) params.assigned_user_id = filters.assigned_user_id;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;
  return api.get<Paginated<Asset>>("/assets", { params });
}

export function fetchAsset(id: number) {
  return api.get<{ asset: Asset }>(`/assets/${id}`);
}

export interface AssetPayload {
  asset_code?: string;
  name?: string;
  category_id?: string | number | null;
  photo?: File | string | null;
  purchase_price?: string | number | null;
  purchase_date?: string | null;
  purchase_receipt?: File | string | null;
  description?: string | null;
  condition?: string;
  usage_status?: string;
  team_id?: string | number | null;
  room_id?: string | number | null;
  assigned_user_id?: string | number | null;
}

function toFormData(payload: AssetPayload): FormData {
  const form = new FormData();
  (Object.entries(payload) as [keyof AssetPayload, unknown][]).forEach(
    ([key, value]) => {
      if (value === undefined || value === null) return;
      form.append(key, value as Blob | string);
    },
  );
  return form;
}

export function createAsset(payload: AssetPayload) {
  return api.post<{ message: string; asset: Asset }>(
    "/assets",
    toFormData(payload),
  );
}

export function updateAsset(id: number, payload: AssetPayload) {
  const form = toFormData(payload);
  form.append("_method", "PUT");
  return api.post<{ message: string; asset: Asset }>(
    `/assets/${id}`,
    form,
  );
}

export function deleteAsset(id: number) {
  return api.delete<{ message: string }>(`/assets/${id}`);
}