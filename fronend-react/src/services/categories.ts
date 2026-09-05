import api from "./api";

export interface Category {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: string;
  assets_count?: number;
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

export interface CategoryFilters {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export function fetchCategories(filters: CategoryFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;
  return api.get<Paginated<Category>>("/categories", { params });
}

export function fetchCategory(id: number) {
  return api.get<{ category: Category }>(`/categories/${id}`);
}

export function createCategory(payload: Record<string, unknown>) {
  return api.post<{ message: string; category: Category }>("/categories", payload);
}

export function updateCategory(id: number, payload: Record<string, unknown>) {
  return api.put<{ message: string; category: Category }>(`/categories/${id}`, payload);
}

export function deleteCategory(id: number) {
  return api.delete<{ message: string }>(`/categories/${id}`);
}