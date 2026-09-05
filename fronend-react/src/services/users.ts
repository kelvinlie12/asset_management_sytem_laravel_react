import api from "./api";

export interface Team {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  role_label: string;
  status: string;
  team: Team | null;
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

export const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "viewer", label: "Viewer" },
];

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  team_id?: string;
  page?: number;
  per_page?: number;
}

export function fetchUsers(filters: UserFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.role) params.role = filters.role;
  if (filters.status) params.status = filters.status;
  if (filters.team_id) params.team_id = filters.team_id;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;
  return api.get<Paginated<User>>("/users", { params });
}

export function fetchUser(id: number) {
  return api.get<{ user: User }>(`/users/${id}`);
}

export function createUser(payload: Record<string, unknown>) {
  return api.post<{ user: User }>("/users", payload);
}

export function updateUser(id: number, payload: Record<string, unknown>) {
  return api.put<{ user: User }>(`/users/${id}`, payload);
}

export function deleteUser(id: number) {
  return api.delete<{ message: string }>(`/users/${id}`);
}

export function assignRole(id: number, role: string) {
  return api.put<{ user: User }>(`/users/${id}/assign-role`, { role });
}

export function assignTeam(id: number, teamId: string) {
  return api.put<{ user: User }>(`/users/${id}/assign-team`, { team_id: teamId });
}

export function resetPassword(id: number, password: string) {
  return api.post<{ message: string }>(`/users/${id}/reset-password`, {
    password,
    password_confirmation: password,
  });
}

export function deactivateUser(id: number) {
  return api.post<{ user: User }>(`/users/${id}/deactivate`);
}

export function activateUser(id: number) {
  return api.post<{ user: User }>(`/users/${id}/activate`);
}

export function fetchTeams() {
  return api.get<{ data: Team[] }>("/teams");
}
