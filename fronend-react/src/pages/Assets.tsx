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
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon, BoxIconLine, ArrowRightIcon } from "../icons";
import {
  fetchAssets,
  fetchAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  CONDITION_OPTIONS,
  USAGE_STATUS_OPTIONS,
  type Asset,
  type Paginated,
  type AssetFilters,
  type AssetPayload,
} from "../services/assets";
import { fetchCategories, type Category } from "../services/categories";
import { fetchRooms, type Room } from "../services/rooms";
import { fetchTeams, type Team } from "../services/teams";
import { fetchUsers, type User } from "../services/users";
import { fetchTransfers, type AssetTransfer } from "../services/transfers";
import { fetchDamages, type AssetDamage } from "../services/damages";

const PER_PAGE = 10;

function extractError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

type FormState = {
  asset_code: string;
  name: string;
  category_id: string;
  photo: File | string;
  purchase_price: string;
  purchase_date: string;
  purchase_receipt: File | string;
  description: string;
  condition: string;
  usage_status: string;
  team_id: string;
  room_id: string;
  assigned_user_id: string;
};

const EMPTY_FORM: FormState = {
  asset_code: "",
  name: "",
  category_id: "",
  photo: "",
  purchase_price: "",
  purchase_date: "",
  purchase_receipt: "",
  description: "",
  condition: "GOOD",
  usage_status: "IN_STORAGE",
  team_id: "",
  room_id: "",
  assigned_user_id: "",
};

function toForm(asset: Asset): FormState {
  return {
    asset_code: asset.asset_code,
    name: asset.name,
    category_id: asset.category ? String(asset.category.id) : "",
    photo: asset.photo || "",
    purchase_price: asset.purchase_price || "",
    purchase_date: asset.purchase_date || "",
    purchase_receipt: asset.purchase_receipt || "",
    description: asset.description || "",
    condition: asset.condition,
    usage_status: asset.usage_status,
    team_id: asset.team ? String(asset.team.id) : "",
    room_id: asset.room ? String(asset.room.id) : "",
    assigned_user_id: asset.assigned_user
      ? String(asset.assigned_user.id)
      : "",
  };
}

export default function Assets() {
  const { user } = useAuth();
  const canView =
    !!user &&
    (user.role === "super_admin" || user.role === "admin" || user.role === "staff");
  const canManage = !!user && (user.role === "super_admin" || user.role === "admin");

  const [assets, setAssets] = useState<Asset[]>([]);
  const [meta, setMeta] = useState<Paginated<Asset>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [filters, setFilters] = useState<AssetFilters>({
    search: "",
    condition: "",
    usage_status: "",
    category_id: "",
    page: 1,
    per_page: PER_PAGE,
  });

  const [selected, setSelected] = useState<Asset | null>(null);

  const addModal = useModal();
  const detailModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAssets(filters);
      setAssets(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(extractError(err, "Failed to load assets."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, roomsRes, teamsRes, usersRes] = await Promise.all([
          fetchCategories({ per_page: 100 }),
          fetchRooms({ per_page: 100 }),
          fetchTeams({ per_page: 100 }),
          fetchUsers({ per_page: 100 }),
        ]);
        if (cancelled) return;
        setCategories(cats.data.data);
        setRooms(roomsRes.data.data);
        setTeams(teamsRes.data.data);
        setUsers(usersRes.data.data);
      } catch {
        // options are non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateFilter(key: keyof AssetFilters, value: string) {
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
    await loadAssets();
  }

  async function handleSaveAsset(payload: FormState & { editing: Asset | null }) {
    setSaving(true);
    setError(null);
    try {
      const damaged = payload.condition === "DAMAGED";
      const body: AssetPayload = {
        asset_code: payload.asset_code,
        name: payload.name,
        category_id: payload.category_id || null,
        photo: payload.photo instanceof File ? payload.photo : null,
        purchase_price: payload.purchase_price || null,
        purchase_date: payload.purchase_date || null,
        purchase_receipt:
          payload.purchase_receipt instanceof File
            ? payload.purchase_receipt
            : null,
        description: payload.description || null,
        condition: payload.condition,
        usage_status: damaged ? "IN_STORAGE" : payload.usage_status,
        team_id: payload.team_id || null,
        room_id: payload.room_id || null,
        assigned_user_id: payload.assigned_user_id || null,
      };
      if (payload.editing) {
        await updateAsset(payload.editing.id, body);
        showTempSuccess("Asset updated.");
        editModal.closeModal();
      } else {
        await createAsset(body);
        showTempSuccess("Asset created.");
        addModal.closeModal();
      }
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to save asset."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSubmitting("delete");
    setError(null);
    try {
      await deleteAsset(selected.id);
      deleteModal.closeModal();
      setSelected(null);
      showTempSuccess("Asset deleted.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to delete asset."));
    } finally {
      setSubmitting(null);
    }
  }

  if (!canView) {
    return (
      <>
        <PageMeta title="Assets | Access Denied" description="Asset management" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            You do not have permission to view assets.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Asset Management"
        description="Manage company assets and inventory."
      />
      

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Asset Management
          </h3>
          {canManage && (
            <Button onClick={addModal.openModal} startIcon={<PlusIcon />}>
              Add Asset
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
              placeholder="Search by code, name, or description..."
              className="lg:max-w-[280px]"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                options={CONDITION_OPTIONS}
                placeholder="All conditions"
                defaultValue=""
                onChange={(v) => updateFilter("condition", v)}
              />
              <Select
                options={USAGE_STATUS_OPTIONS}
                placeholder="All usage"
                defaultValue=""
                onChange={(v) => updateFilter("usage_status", v)}
              />
              <Select
                options={categories.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
                placeholder="All categories"
                defaultValue=""
                onChange={(v) => updateFilter("category_id", v)}
              />
              <Select
                options={teams.map((t) => ({
                  value: String(t.id),
                  label: t.name,
                }))}
                placeholder="All teams"
                defaultValue=""
                onChange={(v) => updateFilter("team_id", v)}
              />
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
                    Category
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Condition
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Usage Status
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Location
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Assigned To
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    Actions
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
                {!loading && assets.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      No assets found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  assets.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                            <BoxIconLine />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {a.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {a.asset_code}
                              {a.description ? ` · ${a.description}` : ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {a.category?.name || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge
                          size="sm"
                          variant="light"
                          color={a.condition === "GOOD" ? "success" : "error"}
                        >
                          {a.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge
                          size="sm"
                          variant="light"
                          color={a.usage_status === "IN_USE" ? "info" : "warning"}
                        >
                          {a.usage_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {a.room
                          ? a.room.is_storage
                            ? `${a.room.name} (storage)`
                            : a.room.name
                          : "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {a.assigned_user?.name || a.team?.name || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(a);
                              detailModal.openModal();
                            }}
                            startIcon={<EyeIcon />}
                          >
                            View
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelected(a);
                                  editModal.openModal();
                                }}
                                startIcon={<PencilIcon />}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelected(a);
                                  deleteModal.openModal();
                                }}
                                startIcon={<TrashBinIcon />}
                              >
                                Delete
                              </Button>
                            </>
                          )}
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
        <AssetModal
          isOpen={addModal.isOpen}
          onClose={addModal.closeModal}
          editing={null}
          saving={saving}
          categories={categories}
          rooms={rooms}
          teams={teams}
          users={users}
          onSubmit={handleSaveAsset}
        />
      )}

      {canManage && selected && (
        <AssetModal
          isOpen={editModal.isOpen}
          onClose={editModal.closeModal}
          key={selected.id}
          editing={selected}
          saving={saving}
          categories={categories}
          rooms={rooms}
          teams={teams}
          users={users}
          onSubmit={handleSaveAsset}
        />
      )}

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        asset={selected}
        onEdit={
          canManage
            ? () => {
                detailModal.closeModal();
                editModal.openModal();
              }
            : undefined
        }
      />

      {canManage && selected && (
        <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[450px] m-4">
          <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Delete Asset
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700 dark:text-white/90">
                {selected.name}
              </span>{" "}
              ({selected.asset_code})? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button size="sm" variant="outline" onClick={deleteModal.closeModal}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={submitting === "delete"}
                onClick={handleDelete}
              >
                {submitting === "delete" ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function AssetModal({
  isOpen,
  onClose,
  editing,
  saving,
  categories,
  rooms,
  teams,
  users,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  editing: Asset | null;
  saving: boolean;
  categories: Category[];
  rooms: Room[];
  teams: Team[];
  users: User[];
  onSubmit: (payload: FormState & { editing: Asset | null }) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    editing ? toForm(editing) : EMPTY_FORM
  );

  useEffect(() => {
    if (isOpen) {
      setForm(editing ? toForm(editing) : EMPTY_FORM);
    }
  }, [isOpen, editing]);

  const damaged = form.condition === "DAMAGED";

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "condition" && value === "DAMAGED") {
        next.usage_status = "IN_STORAGE";
      }
      return next;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.asset_code.trim() || !form.name.trim()) return;
    onSubmit({ ...form, asset_code: form.asset_code.trim(), name: form.name.trim(), editing });
  }

  const roomOptions = damaged
    ? rooms.filter((r) => r.is_storage)
    : rooms;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Edit Asset" : "Add Asset"}
        </h4>
        <p className="mb-6 mt-1 text-sm text-gray-500 dark:text-gray-400">
          {editing
            ? `Update details for ${editing.asset_code}.`
            : "Create a new asset."}
        </p>

        {damaged && (
          <div className="mb-4 rounded-lg border border-warning-500 bg-warning-50 p-3 text-xs text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
            Damaged assets are forced to{" "}
            <span className="font-semibold">IN_STORAGE</span> and must be placed
            in a storage room (warehouse).
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Asset Code</Label>
            <Input
              type="text"
              value={form.asset_code}
              onChange={(e) => set("asset_code", e.target.value)}
              placeholder="e.g. AST-007"
              required
            />
          </div>
          <div>
            <Label>Name</Label>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Laptop Lenovo"
              required
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              options={categories.map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              placeholder="Select category"
              defaultValue={form.category_id}
              onChange={(v) => set("category_id", v)}
            />
          </div>
          <div>
            <Label>Condition</Label>
            <Select
              options={CONDITION_OPTIONS}
              placeholder="Select condition"
              defaultValue={form.condition}
              onChange={(v) => set("condition", v)}
            />
          </div>
          <div>
            <Label>Usage Status</Label>
            <Select
              options={USAGE_STATUS_OPTIONS}
              placeholder="Select usage status"
              defaultValue={form.usage_status}
              disabled={damaged}
              onChange={(v) => set("usage_status", v)}
            />
          </div>
          <div>
            <Label>Room / Location</Label>
            <Select
              options={roomOptions.map((r) => ({
                value: String(r.id),
                label: r.is_storage ? `${r.name} (storage)` : r.name,
              }))}
              placeholder={damaged ? "Select storage room" : "Select room"}
              defaultValue={form.room_id}
              onChange={(v) => set("room_id", v)}
            />
          </div>
          <div>
            <Label>Team</Label>
            <Select
              options={teams.map((t) => ({ value: String(t.id), label: t.name }))}
              placeholder="Select team"
              defaultValue={form.team_id}
              onChange={(v) => set("team_id", v)}
            />
          </div>
          <div>
            <Label>Assigned User</Label>
            <Select
              options={users.map((u) => ({ value: String(u.id), label: u.name }))}
              placeholder="Select user"
              defaultValue={form.assigned_user_id}
              onChange={(v) => set("assigned_user_id", v)}
            />
          </div>
          <div>
            <Label>Purchase Price (Rp)</Label>
            <Input
              type="number"
              min="0"
              step={0.01}
              value={form.purchase_price}
              onChange={(e) => set("purchase_price", e.target.value)}
              placeholder="e.g. 1000000"
            />
          </div>
          <div>
            <Label>Purchase Date</Label>
            <Input
              type="date"
              value={form.purchase_date}
              onChange={(e) => set("purchase_date", e.target.value)}
            />
          </div>
          <div>
            <Label>Purchase Receipt (File)</Label>
            <Input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) =>
                e.target.files?.length
                  ? set("purchase_receipt", e.target.files[0])
                  : undefined
              }
            />
            {typeof form.purchase_receipt === "string" && form.purchase_receipt && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Current: {form.purchase_receipt}
              </p>
            )}
          </div>
          <div>
            <Label>Photo (File)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.length
                  ? set("photo", e.target.files[0])
                  : undefined
              }
            />
            {typeof form.photo === "string" && form.photo && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Current: {form.photo}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Input
              type="text"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Asset description"
            />
          </div>
          <div className="sm:col-span-2 mt-2 flex items-center gap-3 justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Asset"}
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
  asset,
  onEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onEdit?: () => void;
}) {
  const [loaded, setLoaded] = useState<Asset | null>(asset);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [transferHistory, setTransferHistory] = useState<AssetTransfer[]>([]);
  const [damageHistory, setDamageHistory] = useState<AssetDamage[]>([]);

  useEffect(() => {
    if (isOpen && asset) {
      setLoaded(asset);
      setTransferHistory([]);
      setDamageHistory([]);
      setHistoryLoading(true);
      fetchAsset(asset.id)
        .then((res) => setLoaded(res.data.asset))
        .catch(() => undefined);
      fetchTransfers({ asset_id: String(asset.id), per_page: 20 })
        .then((res) => setTransferHistory(res.data.data))
        .catch(() => undefined);
      fetchDamages({ asset_id: String(asset.id), per_page: 20 })
        .then((res) => setDamageHistory(res.data.data))
        .catch(() => undefined)
        .finally(() => setHistoryLoading(false));
    }
  }, [isOpen, asset]);

  if (!asset || !loaded) return null;

  function placement(pieces: (string | null | undefined)[]): string {
    const parts = pieces.filter((p): p is string => !!p);
    return parts.length ? parts.join(" / ") : "-";
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Asset Details
        </h4>
        <div className="mt-4">
          <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {loaded.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge size="sm" variant="light" color="info">
              {loaded.asset_code}
            </Badge>
            {loaded.category && (
              <Badge size="sm" variant="light" color="dark">
                {loaded.category.name}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Condition</Label>
            <Badge
              size="sm"
              variant="light"
              color={loaded.condition === "GOOD" ? "success" : "error"}
            >
              {loaded.condition}
            </Badge>
          </div>
          <div>
            <Label>Usage Status</Label>
            <Badge
              size="sm"
              variant="light"
              color={loaded.usage_status === "IN_USE" ? "info" : "warning"}
            >
              {loaded.usage_status}
            </Badge>
          </div>
          <div>
            <Label>Room / Location</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.room
                ? loaded.room.is_storage
                  ? `${loaded.room.name} (storage)`
                  : loaded.room.name
                : "-"}
            </p>
          </div>
          <div>
            <Label>Team</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.team?.name || "-"}
            </p>
          </div>
          <div>
            <Label>Assigned User</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.assigned_user?.name || "-"}
            </p>
          </div>
          <div>
            <Label>Purchase Price</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.purchase_price
                ? `Rp ${Number(loaded.purchase_price).toLocaleString("id-ID")}`
                : "-"}
            </p>
          </div>
          <div>
            <Label>Purchase Date</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.purchase_date || "-"}
            </p>
          </div>
          <div>
            <Label>Receipt</Label>
            {loaded.purchase_receipt ? (
              loaded.purchase_receipt_url ? (
                <a
                  href={loaded.purchase_receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-brand-600 underline dark:text-brand-400"
                >
                  {loaded.purchase_receipt}
                </a>
              ) : (
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {loaded.purchase_receipt}
                </p>
              )
            ) : (
              <p className="text-sm text-gray-800 dark:text-white/90">-</p>
            )}
          </div>
          {(loaded.photo_url || loaded.photo) && (
            <div className="sm:col-span-2">
              <Label>Photo</Label>
              <img
                src={loaded.photo_url || loaded.photo || ""}
                alt={loaded.name}
                className="mt-1 h-40 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.description || "-"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h5 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            Purchase History
          </h5>
          {loaded.purchases && loaded.purchases.length > 0 ? (
            <div className="space-y-3">
              {loaded.purchases.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-white/90">
                      {p.purchase_number || "-"}
                      <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                        {p.purchase_date || ""}
                      </span>
                    </p>
                    <Badge size="sm" variant="light" color="success">
                      Rp {Number(p.amount).toLocaleString("id-ID")}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>Supplier: {p.supplier || "-"}</span>
                    <span>Invoice: {p.invoice_number || "-"}</span>
                  </div>
                  {p.notes && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {p.notes}
                    </p>
                  )}
                  {p.proof_url && (
                    <a
                      href={p.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-brand-600 underline dark:text-brand-400"
                    >
                      View proof
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No purchase history for this asset.
            </p>
          )}
        </div>

        <div className="mt-6">
          <h5 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            Transfer History
          </h5>
          {historyLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : transferHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No transfer history for this asset.
            </p>
          ) : (
            <div className="space-y-3">
              {transferHistory.map((t) => {
                const from = placement([
                  t.from_team?.name,
                  t.from_room?.name,
                  t.from_user?.name,
                ]);
                const to = placement([
                  t.to_team?.name,
                  t.to_room?.name,
                  t.to_user?.name,
                ]);
                return (
                  <div
                    key={t.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.03]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-white/90">
                        {t.transfer_date || "-"}{" "}
                        <span className="font-normal text-gray-500 dark:text-gray-400">
                          by {t.performed_by?.name || "-"}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Badge size="sm" variant="light" color="warning">
                        {from}
                      </Badge>
                      <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <Badge size="sm" variant="light" color="success">
                        {to}
                      </Badge>
                    </div>
                    {t.reason && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {t.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6">
          <h5 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            Damage History
          </h5>
          {historyLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : damageHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No damage reports for this asset.
            </p>
          ) : (
            <div className="space-y-3">
              {damageHistory.map((d) => (
                <div
                  key={d.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge size="sm" variant="light" color="error">
                      {d.damage_date || "-"}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      by {d.performed_by?.name || "-"} · user{" "}
                      {d.user?.name || "-"} · resp.{" "}
                      {d.responsible?.name || "-"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-white/90">
                    {d.description || "-"}
                  </p>
                  {d.notes && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {d.notes}
                    </p>
                  )}
                  {d.photo_url && (
                    <img
                      src={d.photo_url}
                      alt="Damage"
                      className="mt-2 h-32 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}