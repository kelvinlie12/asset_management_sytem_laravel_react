import api from "./api";
import type { Asset } from "./assets";
import type { Room } from "./rooms";
import type { Team } from "./teams";
import type { User } from "./users";

export interface AssetTransfer {
  id: number;
  transfer_date: string | null;
  reason: string | null;
  asset: Asset | null;
  from_team: Team | null;
  to_team: Team | null;
  from_room: Room | null;
  to_room: Room | null;
  from_user: User | null;
  to_user: User | null;
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

export interface TransferFilters {
  search?: string;
  asset_id?: string;
  page?: number;
  per_page?: number;
}

export function fetchTransfers(filters: TransferFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.asset_id) params.asset_id = filters.asset_id;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;
  return api.get<Paginated<AssetTransfer>>("/transfers", { params });
}

export function fetchTransfer(id: number) {
  return api.get<{ transfer: AssetTransfer }>(`/transfers/${id}`);
}

export function createTransfer(payload: Record<string, unknown>) {
  return api.post<{ message: string; transfer: AssetTransfer }>(
    "/transfers",
    payload,
  );
}