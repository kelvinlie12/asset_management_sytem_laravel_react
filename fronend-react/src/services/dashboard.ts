import api from "./api";

export interface DashboardMetrics {
  total_assets: number;
  assets_in_use: number;
  assets_in_storage: number;
  assets_damaged: number;
  total_asset_value: number;
  total_teams: number;
  total_users: number;
  total_rooms: number;
}

export interface TaxReminderNumbers {
  overdue: number;
  due_today: number;
  due_soon_7: number;
  due_soon_14: number;
  due_soon_30: number;
  needs_attention: number;
  total_vehicles: number;
}

export interface AssetSlice {
  label: string;
  value: number;
}

export interface PurchaseMonthly {
  month: string;
  label: string;
  count: number;
  total: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  tax_reminders: TaxReminderNumbers;
  assets_by_category: AssetSlice[];
  assets_by_condition: AssetSlice[];
  assets_by_team: AssetSlice[];
  purchases_per_month: PurchaseMonthly[];
}

export function fetchDashboard() {
  return api.get<DashboardData>("/dashboard");
}
