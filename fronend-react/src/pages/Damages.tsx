import { useCallback, useEffect, useState, type FormEvent } from "react";
import PageMeta from "../components/common/PageMeta";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import {
  Table,
  TableBody,
  TableHeader,
  TableCell,
  TableRow,
} from "../components/ui/table";
import { useAuth } from "../context/AuthContext";
import { PlusIcon, EyeIcon, AlertIcon } from "../icons";
import {
  fetchDamages,
  fetchDamage,
  createDamage,
  type AssetDamage,
  type Paginated,
  type DamageFilters,
} from "../services/damages";
import { fetchAssets, fetchAsset, type Asset } from "../services/assets";
import { fetchUsers, type User } from "../services/users";

const PER_PAGE = 10;

function extractError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

type FormState = {
  asset_id: string;
  damage_date: string;
  user_id: string;
  responsible_id: string;
  description: string;
  notes: string;
  photo: File | null;
};

const EMPTY_FORM: FormState = {
  asset_id: "",
  damage_date: new Date().toISOString().slice(0, 10),
  user_id: "",
  responsible_id: "",
  description: "",
  notes: "",
  photo: null,
};

export default function Damages() {
  const { user } = useAuth();
  const canView =
    !!user &&
    (user.role === "super_admin" || user.role === "admin" || user.role === "staff");
  const canManage = !!user && (user.role === "super_admin" || user.role === "admin");

  const [damages, setDamages] = useState<AssetDamage[]>([]);
  const [meta, setMeta] = useState<Paginated<AssetDamage>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [filters, setFilters] = useState<DamageFilters>({
    search: "",
    date_from: "",
    date_to: "",
    page: 1,
    per_page: PER_PAGE,
  });

  const [selected, setSelected] = useState<AssetDamage | null>(null);

  const addModal = useModal();
  const detailModal = useModal();

  const [saving, setSaving] = useState(false);

  const loadDamages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDamages(filters);
      setDamages(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(extractError(err, "Failed to load damage reports."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDamages();
  }, [loadDamages]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [assetsRes, usersRes] = await Promise.all([
          fetchAssets({ per_page: 100 }),
          fetchUsers({ per_page: 100 }),
        ]);
        if (cancelled) return;
        setAssets(assetsRes.data.data);
        setUsers(usersRes.data.data);
      } catch {
        // options are non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateFilter(key: keyof DamageFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function goToPage(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  function showTempSuccess(msg: string) {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(null), 3000);
  }

  async function refresh() {
    await loadDamages();
  }

  async function handleSaveDamage(payload: FormState) {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        asset_id: payload.asset_id,
        damage_date: payload.damage_date,
        user_id: payload.user_id || null,
        responsible_id: payload.responsible_id || null,
        description: payload.description,
        notes: payload.notes || null,
      };
      if (payload.photo) {
        body.photo = payload.photo;
      }
      await createDamage(body as Record<string, unknown> & { photo?: File });
      await refresh();
      try {
        const resp = await fetchAsset(Number(payload.asset_id));
        const asset = resp.data.asset;
        showTempSuccess(
          "Damage report recorded. Asset " +
            `${asset?.asset_code || ""} now has status ` +
            `${asset?.condition || "DAMAGED"} (${asset?.usage_status || "IN_STORAGE"}), ` +
            "moved to storage.",
        );
      } catch {
        showTempSuccess(
          "Damage report recorded. Asset marked as DAMAGED and moved to storage.",
        );
      }
      addModal.closeModal();
    } catch (err) {
      setError(extractError(err, "Failed to save damage report."));
    } finally {
      setSaving(false);
    }
  }

  if (!canView) {
    return (
      <>
        <PageMeta title="Damages | Access Denied" description="Asset damage report management" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            You do not have permission to view asset damage reports.
          </p>
        </div>
      </>
    );
  }

  const reportableAssets = assets.filter(
    (a) => (a.condition ?? "GOOD") !== "DAMAGED",
  );

  return (
    <>
      <PageMeta
        title="Asset Damages"
        description="Track asset damage reports (barang rusak)."
      />
      

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Asset Damage Report
          </h3>
          {canManage && (
            <Button onClick={addModal.openModal} startIcon={<PlusIcon />}>
              Report Damage
            </Button>
          )}
        </div>

        {success && (
          <div className="rounded-lg border border-success-500 bg-success-50 p-3 text-sm text-success-600 dark:bg-success-500/10 dark:text-success-400">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-error-500 bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
            <Input
              type="text"
              value={filters.search || ""}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search by asset, description, or date..."
              className="lg:max-w-[300px]"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  From
                </label>
                <Input
                  type="date"
                  value={filters.date_from || ""}
                  onChange={(e) => updateFilter("date_from", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  To
                </label>
                <Input
                  type="date"
                  value={filters.date_to || ""}
                  onChange={(e) => updateFilter("date_to", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Asset
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Damage Date
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    User / Responsible
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Description
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Done By
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    Detail
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && damages.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      No damage reports found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  damages.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                            <AlertIcon />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {d.asset?.name || "-"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {d.asset?.asset_code || ""}
                              {d.asset
                                ? ` · ${d.asset.condition || ""}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {d.damage_date || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {d.user?.name || "-"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          resp. {d.responsible?.name || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <p className="max-w-[220px] truncate text-sm text-gray-600 dark:text-gray-400">
                          {d.description || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {d.performed_by?.name || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(d);
                              detailModal.openModal();
                            }}
                            startIcon={<EyeIcon />}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing{" "}
                {(meta.current_page - 1) * meta.per_page + 1}-
                {Math.min(meta.current_page * meta.per_page, meta.total)} of{" "}
                {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.current_page <= 1}
                  onClick={() => goToPage(meta.current_page - 1)}
                >
                  Prev
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {meta.current_page} / {meta.last_page}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => goToPage(meta.current_page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {canManage && (
        <DamageModal
          isOpen={addModal.isOpen}
          onClose={addModal.closeModal}
          saving={saving}
          assets={reportableAssets}
          users={users}
          onSubmit={handleSaveDamage}
        />
      )}

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        damage={selected}
      />
    </>
  );
}

function DamageModal({
  isOpen,
  onClose,
  saving,
  assets,
  users,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  assets: Asset[];
  users: User[];
  onSubmit: (payload: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY_FORM, damage_date: new Date().toISOString().slice(0, 10) });
      setFormError(null);
    }
  }, [isOpen]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.asset_id) {
      setFormError("Please select an asset to report as damaged.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Please describe the damage.");
      return;
    }
    onSubmit({
      ...form,
      description: form.description.trim(),
      notes: form.notes.trim(),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Report Damage
        </h4>
        <p className="mb-6 mt-1 text-sm text-gray-500 dark:text-gray-400">
          Recording damage marks the asset as{" "}
          <span className="font-medium text-gray-700 dark:text-white/90">
            DAMAGED
          </span>
          , sets it to{" "}
          <span className="font-medium text-gray-700 dark:text-white/90">
            IN_STORAGE
          </span>{" "}
          and moves it to a warehouse (Gudang).
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Asset</Label>
            <Select
              options={assets.map((a) => ({
                value: String(a.id),
                label: `${a.name} (${a.asset_code} — ${a.usage_status})`,
              }))}
              placeholder="Select asset to report"
              defaultValue={form.asset_id}
              onChange={(v) => set("asset_id", v)}
            />
          </div>
          <div>
            <Label>Damage Date</Label>
            <Input
              type="date"
              value={form.damage_date}
              onChange={(e) => set("damage_date", e.target.value)}
              required
            />
          </div>
          <div>
            <Label>User</Label>
            <Select
              options={users.map((u) => ({ value: String(u.id), label: u.name }))}
              placeholder="Select user"
              defaultValue={form.user_id}
              onChange={(v) => set("user_id", v)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Responsible Person</Label>
            <Select
              options={users.map((u) => ({ value: String(u.id), label: u.name }))}
              placeholder="Select responsible person"
              defaultValue={form.responsible_id}
              onChange={(v) => set("responsible_id", v)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Damage Description</Label>
            <Input
              type="text"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the damage"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Damage Photo</Label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => set("photo", e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-600 hover:file:bg-brand-100 dark:file:bg-brand-500/15 dark:file:text-brand-400"
            />
            {form.photo && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Selected: {form.photo.name} (
                {(form.photo.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Input
              type="text"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional notes"
            />
          </div>
          {formError && (
            <div className="sm:col-span-2 rounded-lg border border-error-500 bg-error-50 p-3 text-xs text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {formError}
            </div>
          )}
          <div className="sm:col-span-2 mt-2 flex items-center gap-3 justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving}>
              {saving ? "Saving..." : "Report Damage"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function DetailModal({
  isOpen,
  onClose,
  damage,
}: {
  isOpen: boolean;
  onClose: () => void;
  damage: AssetDamage | null;
}) {
  const [loaded, setLoaded] = useState<AssetDamage | null>(damage);
  const [timeline, setTimeline] = useState<AssetDamage[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    if (isOpen && damage) {
      setLoaded(damage);
      fetchDamage(damage.id)
        .then((res) => setLoaded(res.data.damage))
        .catch(() => undefined);
      if (damage.asset_id) {
        setTimelineLoading(true);
        fetchDamages({ asset_id: String(damage.asset_id), per_page: 50 })
          .then((res) => {
            setTimeline(res.data.data);
          })
          .catch(() => undefined)
          .finally(() => setTimelineLoading(false));
      } else {
        setTimeline([]);
      }
    }
  }, [isOpen, damage]);

  if (!damage || !loaded) return null;
  const asset = loaded.asset;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[620px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[620px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Damage Report Details
        </h4>
        <div className="mt-4">
          <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {asset?.name || "-"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge size="sm" variant="light" color="info">
              {asset?.asset_code || "-"}
            </Badge>
            {asset && (
              <Badge size="sm" variant="light" color="error">
                {asset.condition}
              </Badge>
            )}
            {asset && (
              <Badge size="sm" variant="light" color="warning">
                {asset.usage_status}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Damage Date</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.damage_date || "-"}
            </p>
          </div>
          <div>
            <Label>Done By</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.performed_by?.name || "-"}
            </p>
          </div>
          <div>
            <Label>User</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.user?.name || "-"}
            </p>
          </div>
          <div>
            <Label>Responsible</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.responsible?.name || "-"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.description || "-"}
            </p>
          </div>
          {loaded.photo_url && (
            <div className="sm:col-span-2">
              <Label>Damage Photo</Label>
              <img
                src={loaded.photo_url}
                alt="Damage"
                className="mt-1 h-40 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          {loaded.notes && (
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {loaded.notes}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h5 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            Damage Timeline
          </h5>
          {timelineLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : timeline.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No damage timeline available.
            </p>
          ) : (
            <ol className="relative ml-2 space-y-5 border-l border-gray-200 dark:border-gray-700">
              {timeline.map((t) => (
                <li key={t.id} className="ml-4">
                  <span
                    className={`absolute -left-[5.5px] mt-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-gray-900 ${
                      t.id === loaded.id
                        ? "bg-error-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  ></span>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.03]">
                    <p className="text-xs font-semibold text-gray-700 dark:text-white/90">
                      {t.damage_date || "-"}
                      {t.id === loaded.id && (
                        <span className="ml-2">
                          <Badge size="sm" variant="light" color="error">
                            Current
                          </Badge>
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-gray-700 dark:text-white/90">
                      {t.description || "-"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      resp. {t.responsible?.name || "-"} · by{" "}
                      {t.performed_by?.name || "-"}
                    </p>
                    {t.photo_url && (
                      <img
                        src={t.photo_url}
                        alt="Damage"
                        className="mt-2 h-24 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
