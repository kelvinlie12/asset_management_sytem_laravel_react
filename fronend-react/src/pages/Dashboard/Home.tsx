import { useCallback, useEffect, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import PageMeta from "../../components/common/PageMeta";
import {
  BoxIconLine,
  BoxCubeIcon,
  GroupIcon,
  UserIcon,
  DollarLineIcon,
  CalenderIcon,
  AlertIcon,
  CheckCircleIcon,
  TaskIcon,
  ListIcon,
} from "../../icons";
import {
  fetchDashboard,
  type DashboardData,
} from "../../services/dashboard";
import { useAuth } from "../../context/AuthContext";

function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

interface MetricCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
}

export default function Home() {
  const { user } = useAuth();
  const canView =
    !!user &&
    (user.role === "super_admin" || user.role === "admin" || user.role === "staff");

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboard();
      setData(res.data);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  const m = data?.metrics;

  const metricCards: MetricCard[] = [
    { label: "Total Assets", value: m ? String(m.total_assets) : "-", icon: <BoxCubeIcon />, iconClass: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400" },
    { label: "Assets In Use", value: m ? String(m.assets_in_use) : "-", icon: <TaskIcon />, iconClass: "bg-success-50 text-success-500 dark:bg-success-500/15 dark:text-success-400" },
    { label: "Assets In Storage", value: m ? String(m.assets_in_storage) : "-", icon: <BoxIconLine />, iconClass: "bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400" },
    { label: "Damaged Assets", value: m ? String(m.assets_damaged) : "-", icon: <AlertIcon />, iconClass: "bg-error-50 text-error-500 dark:bg-error-500/15 dark:text-error-400" },
    { label: "Total Asset Value", value: m ? formatIDR(m.total_asset_value) : "-", icon: <DollarLineIcon />, iconClass: "bg-success-50 text-success-500 dark:bg-success-500/15 dark:text-success-400" },
    { label: "Total Teams", value: m ? String(m.total_teams) : "-", icon: <GroupIcon />, iconClass: "bg-purple-50 text-purple-500 dark:bg-purple-500/15 dark:text-purple-400" },
    { label: "Total Users", value: m ? String(m.total_users) : "-", icon: <UserIcon />, iconClass: "bg-warning-50 text-warning-500 dark:bg-warning-500/15 dark:text-warning-400" },
    { label: "Total Rooms", value: m ? String(m.total_rooms) : "-", icon: <ListIcon />, iconClass: "bg-pink-50 text-pink-500 dark:bg-pink-500/15 dark:text-pink-400" },
  ];

  const categoryOptions: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", type: "donut", toolbar: { show: false } },
    labels: data?.assets_by_category.map((c) => c.label) ?? [],
    colors: ["#465FFF", "#9CB9FF", "#22C55E", "#FFA860", "#FBA0AF", "#8A63E3"],
    legend: { position: "bottom", fontFamily: "Outfit, sans-serif" },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    plotOptions: { pie: { donut: { size: "70%" } } },
  };

  const conditionOptions: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", type: "donut", toolbar: { show: false } },
    labels: data?.assets_by_condition.map((c) => c.label) ?? [],
    colors: ["#22C55E", "#F33845"],
    legend: { position: "bottom", fontFamily: "Outfit, sans-serif" },
    dataLabels: { enabled: false },
  };

  const teamOptions: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", toolbar: { show: false } },
    colors: ["#465FFF"],
    plotOptions: { bar: { horizontal: true, columnWidth: "60%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: { categories: data?.assets_by_team.map((t) => t.label) ?? [], axisBorder: { show: false }, axisTicks: { show: false } },
    grid: { xaxis: { lines: { show: true } } },
    legend: { show: false },
  };

  const purchaseOptions: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", height: 260, toolbar: { show: false } },
    colors: ["#465FFF"],
    plotOptions: { bar: { horizontal: false, columnWidth: "40%", borderRadius: 5, borderRadiusApplication: "end" } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: { categories: data?.purchases_per_month.map((p) => p.label) ?? [], axisBorder: { show: false }, axisTicks: { show: false } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    yaxis: { title: { text: undefined }, labels: { formatter: (val: number) => String(val) } },
    tooltip: { y: { formatter: (val: number) => String(val) } },
  };

  if (!canView) return null;

  return (
    <>
      <PageMeta
        title="Asset Management Dashboard"
        description="Overview of assets, teams, users, rooms, and vehicle tax reminders"
      />

      {loading && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metricCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconClass}`}>
                  {card.icon}
                </div>
                <span className="mt-5 block text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
                <h4 className="mt-2 break-words text-title-sm font-bold text-gray-800 dark:text-white/90">
                  {card.value}
                </h4>
              </div>
            ))}
          </div>

          {/* Vehicle tax reminder card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Vehicle Taxes Due Soon
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Motorcycle tax due dates requiring attention.
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <CalenderIcon className="size-6 text-gray-800 dark:text-white/90" />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Due Today", value: data.tax_reminders.due_today, color: "error" },
                { label: "< 7 Days", value: data.tax_reminders.due_soon_7, color: "warning" },
                { label: "< 14 Days", value: data.tax_reminders.due_soon_14, color: "info" },
                { label: "< 30 Days", value: data.tax_reminders.due_soon_30, color: "info" },
                { label: "Overdue", value: data.tax_reminders.overdue, color: "error" },
                { label: "Needs Attention", value: data.tax_reminders.needs_attention, color: "dark" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    {t.color === "error" ? <AlertIcon /> : <CheckCircleIcon />}
                    {t.label}
                  </p>
                  <h4 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{t.value}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:col-span-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Assets by Category</h3>
              {data.assets_by_category.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No data.</p>
              ) : (
                <Chart options={categoryOptions} series={data.assets_by_category.map((c) => c.value)} type="donut" height={320} />
              )}
            </div>
            <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:col-span-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Assets by Condition</h3>
              {data.assets_by_condition.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No data.</p>
              ) : (
                <Chart options={conditionOptions} series={data.assets_by_condition.map((c) => c.value)} type="donut" height={320} />
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:col-span-5">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Assets by Team</h3>
              {data.assets_by_team.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No data.</p>
              ) : (
                <Chart options={teamOptions} series={[{ name: "Assets", data: data.assets_by_team.map((t) => t.value) }]} type="bar" height={280} />
              )}
            </div>
            <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:col-span-7">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Purchases per Month</h3>
              {data.purchases_per_month.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No data.</p>
              ) : (
                <Chart options={purchaseOptions} series={[{ name: "Purchases", data: data.purchases_per_month.map((p) => p.count) }]} type="bar" height={280} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
