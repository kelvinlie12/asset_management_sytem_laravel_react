import api from "./api";

export interface Room {
  id: number;
  name: string;
  location: string | null;
  description: string | null;
  status: string;
  assets_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  users_count?: number;
  rooms?: Room[] | null;
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

export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export interface TeamFilters {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export function fetchTeams(filters: TeamFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;
  return api.get<Paginated<Team>>("/teams", { params });
}

export function fetchTeam(id: number) {
  return api.get<{ team: Team }>(`/teams/${id}`);
}

export function createTeam(payload: Record<string, unknown>) {
  return api.post<{ message: string; team: Team }>("/teams", payload);
}

export function updateTeam(id: number, payload: Record<string, unknown>) {
  return api.put<{ message: string; team: Team }>(`/teams/${id}`, payload);
}

export function deleteTeam(id: number) {
  return api.delete<{ message: string }>(`/teams/${id}`);
}

export function assignTeamRooms(id: number, roomIds: number[]) {
  return api.put<{ message: string; team: Team }>(`/teams/${id}/rooms`, {
    room_ids: roomIds,
  });
}