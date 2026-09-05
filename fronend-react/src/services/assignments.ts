import api from "./api";
import type { Asset } from "./assets";
import type { Room } from "./rooms";
import type { Team } from "./teams";
import type { User } from "./users";

export interface AssetAssignment {
  id: number;
  assigned_date: string | null;
  notes: string | null;
  asset: Asset | null;
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

export interface AssignmentFilters {
  search?: string;
  asset_id?: string;
  page?: number;
  per_page?: number;
}

export function fetchAssignments(filters: AssignmentFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.asset_id) params.asset_id = filters.asset_id;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;
  return api.get<Paginated<AssetAssignment>>("/assignments", { params });
}

export function fetchAssignment(id: number) {
  return api.get<{ assignment: AssetAssignment }>(`/assignments/${id}`);
}

export function createAssignment(payload: Record<string, unknown>) {
  return api.post<{ message: string; assignment: AssetAssignment }>(
    "/assignments",
    payload,
  );
}