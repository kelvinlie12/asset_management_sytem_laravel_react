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
import { PlusIcon, EyeIcon, ArrowRightIcon } from "../icons";
import {
  fetchTransfers,
  fetchTransfer,
  createTransfer,
  type AssetTransfer,
  type Paginated,
  type TransferFilters,
} from "../services/transfers";
import { fetchAssets, type Asset } from "../services/assets";
import { fetchTeams, type Team } from "../services/teams";
import { fetchRooms, type Room } from "../services/rooms";
import { fetchUsers, type User } from "../services/users";

const PER_PAGE = 10;

function extractError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

type FormState = {
  asset_id: string;
  transfer_date: string;
  to_team_id: string;
  to_room_id: string;
  to_user_id: string;
  reason: string;
};

const EMPTY_FORM: FormState = {
  asset_id: "",
  transfer_date: new Date().toISOString().slice(0, 10),
  to_team_id: "",
  to_room_id: "",
  to_user_id: "",
  reason: "",
};

function placementLabel(
  teamLabel: string,
  roomLabel: string,
  userLabel: string,
): string {
  const parts = [teamLabel, roomLabel, userLabel].filter(Boolean);
  return parts.length ? parts.join(" / ") : "-";
}

export default function Transfers() {
  const { user } = useAuth();
  const canView =
    !!user &&
    (user.role === "super_admin" || user.role === "admin" || user.role === "staff");
  const canManage = !!user && (user.role === "super_admin" || user.role === "admin");

  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [meta, setMeta] = useState<Paginated<AssetTransfer>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [filters, setFilters] = useState<TransferFilters>({
    search: "",
    page: 1,
    per_page: PER_PAGE,
  });

  const [selected, setSelected] = useState<AssetTransfer | null>(null);

  const addModal = useModal();
  const detailModal = useModal();

  const [saving, setSaving] = useState(false);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTransfers(filters);
      setTransfers(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(extractError(err, "Failed to load transfers."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [assetsRes, teamsRes, roomsRes, usersRes] = await Promise.all([
          fetchAssets({ per_page: 100 }),
          fetchTeams({ per_page: 100 }),
          fetchRooms({ per_page: 100 }),
          fetchUsers({ per_page: 100 }),
        ]);
        if (cancelled) return;
        setAssets(assetsRes.data.data);
        setTeams(teamsRes.data.data);
        setRooms(roomsRes.data.data);
        setUsers(usersRes.data.data);
      } catch {
        // options are non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateFilter(key: keyof TransferFilters, value: string) {
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
    await loadTransfers();
  }

  async function handleSaveTransfer(payload: FormState) {
    setSaving(true);
    setError(null);
    try {
      await createTransfer({
        asset_id: payload.asset_id,
        transfer_date: payload.transfer_date,
        to_team_id: payload.to_team_id || null,
        to_room_id: payload.to_room_id || null,
        to_user_id: payload.to_user_id || null,
        reason: payload.reason || null,
      });
      showTempSuccess("Asset transferred. Transfer history saved.");
      addModal.closeModal();
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to transfer asset."));
    } finally {
      setSaving(false);
    }
  }

  if (!canView) {
    return (
      <>
        <PageMeta title="Transfers | Access Denied" description="Asset transfer management" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            You do not have permission to view asset transfers.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Asset Transfers"
        description="Track asset mutation history (team, room, user)."
      />
      

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Asset Transfer
          </h3>
          {canManage && (
            <Button onClick={addModal.openModal} startIcon={<PlusIcon />}>
              Transfer Asset
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
              placeholder="Search by asset, reason, or date..."
              className="lg:max-w-[300px]"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Every transfer records the previous and new placement as history.
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Asset
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Move
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Date
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Reason
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
                {!loading && transfers.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      No transfers found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  transfers.map((t) => {
                    const from = placementLabel(
                      t.from_team?.name || "",
                      t.from_room?.name || "",
                      t.from_user?.name || "",
                    );
                    const to = placementLabel(
                      t.to_team?.name || "",
                      t.to_room?.name || "",
                      t.to_user?.name || "",
                    );
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                              <ArrowRightIcon />
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {t.asset?.name || "-"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t.asset?.asset_code || ""}
                                {t.asset
                                  ? ` · ${t.asset.usage_status || ""}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Badge size="sm" variant="light" color="warning">
                              {from}
                            </Badge>
                            <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <Badge size="sm" variant="light" color="success">
                              {to}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {t.transfer_date || "-"}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <p className="max-w-[200px] truncate text-sm text-gray-600 dark:text-gray-400">
                            {t.reason || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {t.performed_by?.name || "-"}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelected(t);
                                detailModal.openModal();
                              }}
                              startIcon={<EyeIcon />}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        <TransferModal
          isOpen={addModal.isOpen}
          onClose={addModal.closeModal}
          saving={saving}
          assets={assets}
          teams={teams}
          rooms={rooms}
          users={users}
          onSubmit={handleSaveTransfer}
        />
      )}

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        transfer={selected}
      />
    </>
  );
}

function TransferModal({
  isOpen,
  onClose,
  saving,
  assets,
  teams,
  rooms,
  users,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  assets: Asset[];
  teams: Team[];
  rooms: Room[];
  users: User[];
  onSubmit: (payload: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY_FORM, transfer_date: new Date().toISOString().slice(0, 10) });
      setFormError(null);
    }
  }, [isOpen]);

  const selectedAsset = assets.find((a) => String(a.id) === form.asset_id);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.asset_id) {
      setFormError("Please select an asset to transfer.");
      return;
    }
    if (!form.to_team_id && !form.to_room_id && !form.to_user_id) {
      setFormError("Specify at least one target: a team, a room, or an assigned user.");
      return;
    }
    onSubmit({
      ...form,
      reason: form.reason.trim(),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Transfer Asset
        </h4>
        <p className="mb-6 mt-1 text-sm text-gray-500 dark:text-gray-400">
          Move an asset to a new team, room, or user. The previous and new
          placement are recorded in its transfer history (previous history is
          kept).
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Asset</Label>
            <Select
              options={assets.map((a) => ({
                value: String(a.id),
                label: `${a.name} (${a.asset_code} — ${a.usage_status})`,
              }))}
              placeholder="Select asset to transfer"
              defaultValue={form.asset_id}
              onChange={(v) => set("asset_id", v)}
            />
            {selectedAsset && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Current: team{" "}
                <span className="font-medium">{selectedAsset.team?.name || "-"}</span>
                , room{" "}
                <span className="font-medium">{selectedAsset.room?.name || "-"}</span>
                , user{" "}
                <span className="font-medium">
                  {selectedAsset.assigned_user?.name || "-"}
                </span>
              </p>
            )}
          </div>
          <div>
            <Label>Transfer Date</Label>
            <Input
              type="date"
              value={form.transfer_date}
              onChange={(e) => set("transfer_date", e.target.value)}
              required
            />
          </div>
          <div>
            <Label>To Team</Label>
            <Select
              options={teams.map((t) => ({ value: String(t.id), label: t.name }))}
              placeholder="Select team"
              defaultValue={form.to_team_id}
              onChange={(v) => set("to_team_id", v)}
            />
          </div>
          <div>
            <Label>To User</Label>
            <Select
              options={users.map((u) => ({ value: String(u.id), label: u.name }))}
              placeholder="Select user"
              defaultValue={form.to_user_id}
              onChange={(v) => set("to_user_id", v)}
            />
          </div>
          <div>
            <Label>To Room</Label>
            <Select
              options={rooms.map((r) => ({
                value: String(r.id),
                label: r.name,
              }))}
              placeholder="Select room"
              defaultValue={form.to_room_id}
              onChange={(v) => set("to_room_id", v)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Reason</Label>
            <Input
              type="text"
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="Reason for the transfer"
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
              {saving ? "Transferring..." : "Transfer Asset"}
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
  transfer,
}: {
  isOpen: boolean;
  onClose: () => void;
  transfer: AssetTransfer | null;
}) {
  const [loaded, setLoaded] = useState<AssetTransfer | null>(transfer);

  useEffect(() => {
    if (isOpen && transfer) {
      setLoaded(transfer);
      fetchTransfer(transfer.id)
        .then((res) => setLoaded(res.data.transfer))
        .catch(() => undefined);
    }
  }, [isOpen, transfer]);

  if (!transfer || !loaded) return null;
  const asset = loaded.asset;

  const from = placementLabel(
    loaded.from_team?.name || "",
    loaded.from_room?.name || "",
    loaded.from_user?.name || "",
  );
  const to = placementLabel(
    loaded.to_team?.name || "",
    loaded.to_room?.name || "",
    loaded.to_user?.name || "",
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Transfer Details
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
              <Badge
                size="sm"
                variant="light"
                color={asset.usage_status === "IN_USE" ? "success" : "warning"}
              >
                {asset.usage_status}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Transfer Date</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.transfer_date || "-"}
            </p>
          </div>
          <div>
            <Label>Done By</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.performed_by?.name || "-"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label>From</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">{from}</p>
          </div>
          <div className="sm:col-span-2">
            <Label>To</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">{to}</p>
          </div>
          <div className="sm:col-span-2">
            <Label>Reason</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.reason || "-"}
            </p>
          </div>
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