import api from "./api";
import type { Asset } from "./assets";
import type { User } from "./users";

export interface AssetDamage {
  id: number;
  asset_id: number;
  user_id: number | null;
  responsible_id: number | null;
  damage_date: string | null;
  description: string;
  photo_path: string | null;
  photo_url: string | null;
  notes: string | null;
  asset: Asset | null;
  user: User | null;
  responsible: User | null;
  performed_by: User | null;
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

export interface DamageFilters {
  search?: string;
  asset_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export function fetchDamages(filters: DamageFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.asset_id) params.asset_id = filters.asset_id;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;
  return api.get<Paginated<AssetDamage>>("/damages", { params });
}

export function fetchDamage(id: number) {
  return api.get<{ damage: AssetDamage }>(`/damages/${id}`);
}

export function createDamage(
  payload: Record<string, unknown> & { photo?: File | null },
) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.append(key, value as Blob | string);
    }
  });
  return api.post<{ message: string; damage: AssetDamage }>("/damages", form);
}

export function updateDamage(
  id: number,
  payload: Record<string, unknown> & { photo?: File | null },
) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.append(key, value as Blob | string);
    }
  });
  form.append("_method", "PUT");
  return api.post<{ message: string; damage: AssetDamage }>(
    `/damages/${id}`,
    form,
  );
}

export function deleteDamage(id: number) {
  return api.delete(`/damages/${id}`);
}
