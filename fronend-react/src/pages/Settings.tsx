import { useState } from "react";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import { useAuth } from "../context/AuthContext";
import { UserIcon, ListIcon } from "../icons";

export default function Settings() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [updated, setUpdated] = useState(false);

  const handleSave = () => {
    setUpdated(true);
    window.setTimeout(() => setUpdated(false), 2500);
  };

  return (
    <div>
      <PageMeta
        title="Settings"
        description="Application and profile settings"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-8">
          {/* Profile settings */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Profile Settings
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Update your personal information.
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <UserIcon className="size-6 text-gray-800 dark:text-white/90" />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                  className="h-11 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Phone
                </label>
                <input
                  type="text"
                  value={phone ?? ""}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={handleSave}
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Save Changes
              </button>
              {updated && (
                <Badge color="success" variant="light">
                  Saved
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4">
          {/* Account info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Account
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                <Badge color="primary" variant="light">
                  {user?.role.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <Badge color="success" variant="light">
                  Active
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <ListIcon className="size-5 text-gray-800 dark:text-white/90" />
              </span>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                Application
              </h3>
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Asset Management System — admin layout with role-based sidebar, topbar,
              breadcrumb, notifications, and profile menu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
