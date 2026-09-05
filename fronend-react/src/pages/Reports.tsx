import PageMeta from "../components/common/PageMeta";
import { Link } from "react-router";
import { ListIcon } from "../icons";

const reportLinks = [
  { label: "Assets Report", desc: "All assets with current status and condition.", path: "/assets" },
  { label: "Purchases Report", desc: "Purchase history by month and supplier.", path: "/purchases" },
  { label: "Transfers (Mutasi) Report", desc: "Asset transfer history between rooms/teams.", path: "/transfers" },
  { label: "Damages (Barang Rusak) Report", desc: "List of damaged assets.", path: "/damages" },
  { label: "Vehicles Report", desc: "Vehicle fleet and tax due dates.", path: "/vehicles" },
  { label: "Asset Management Dashboard", desc: "Key metrics and charts overview.", path: "/" },
];

export default function Reports() {
  return (
    <div>
      <PageMeta
        title="Laporan"
        description="Reports page for asset management"
      />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Laporan (Reports)
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose a report section to explore.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportLinks.map((r) => (
            <Link
              key={r.label}
              to={r.path}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-brand-300 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-800 dark:hover:bg-white/[0.06]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                <ListIcon />
              </span>
              <span>
                <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                  {r.label}
                </span>
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                  {r.desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
