import api from "./api";
import type { Asset } from "./assets";

export interface Purchase {
  id: number;
  purchase_number: string;
  supplier: string;
  invoice_number: string;
  purchase_date: string | null;
  amount: string;
  notes: string | null;
  proof_path: string | null;
  proof_url: string | null;
  asset: Asset | null;
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

export interface PurchaseFilters {
  search?: string;
  page?: number;
  per_page?: number;
}

export function fetchPurchases(filters: PurchaseFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;
  return api.get<Paginated<Purchase>>("/purchases", { params });
}

export function fetchPurchase(id: number) {
  return api.get<{ purchase: Purchase }>(`/purchases/${id}`);
}

export function createPurchase(
  payload: Record<string, unknown> & { proof: File },
) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.append(key, value as Blob | string);
    }
  });
  return api.post<{ message: string; purchase: Purchase }>("/purchases", form);
}

export function deletePurchase(id: number) {
  return api.delete<{ message: string }>(`/purchases/${id}`);
}