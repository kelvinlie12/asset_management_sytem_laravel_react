import api from "./api";

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: Permission[] | null;
  created_at?: string;
  updated_at?: string;
}

export function fetchRoles(search?: string) {
  return api.get<{ data: Role[] }>("/roles", {
    params: search ? { search } : undefined,
  });
}

export function createRole(name: string) {
  return api.post<{ message: string; role: Role }>("/roles", { name });
}

export function updateRole(id: number, name: string) {
  return api.put<{ message: string; role: Role }>(`/roles/${id}`, { name });
}

export function deleteRole(id: number) {
  return api.delete<{ message: string }>(`/roles/${id}`);
}

export function assignRolePermissions(id: number, permissionIds: number[]) {
  return api.put<{ message: string; role: Role }>(`/roles/${id}/permissions`, {
    permission_ids: permissionIds,
  });
}

export function fetchPermissions(search?: string) {
  return api.get<{ data: Permission[] }>("/permissions", {
    params: search ? { search } : undefined,
  });
}

export function createPermission(name: string) {
  return api.post<{ message: string; permission: Permission }>("/permissions", {
    name,
  });
}

export function updatePermission(id: number, name: string) {
  return api.put<{ message: string; permission: Permission }>(
    `/permissions/${id}`,
    { name }
  );
}

export function deletePermission(id: number) {
  return api.delete<{ message: string }>(`/permissions/${id}`);
}
