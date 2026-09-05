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
import {
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
  EyeIcon,
  BoxIconLine,
  CalenderIcon,
} from "../icons";
import {
  fetchVehicles,
  fetchVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  VEHICLE_CONDITION_OPTIONS,
  VEHICLE_USAGE_OPTIONS,
  VEHICLE_TAX_OPTIONS,
  VEHICLE_TAX_META,
  computeVehicleTaxStatus,
  type Vehicle,
  type Paginated,
  type VehicleFilters,
} from "../services/vehicles";
import { fetchRooms, type Room } from "../services/rooms";
import { fetchTeams, type Team } from "../services/teams";
import { fetchUsers, type User } from "../services/users";

const PER_PAGE = 10;

function extractError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

type FormState = {
  asset_code: string;
  photo: string;
  brand: string;
  model: string;
  plate_number: string;
  engine_number: string;
  chassis_number: string;
  purchase_date: string;
  purchase_price: string;
  tax_due_date: string;
  description: string;
  condition: string;
  usage_status: string;
  team_id: string;
  room_id: string;
  assigned_user_id: string;
};

const EMPTY_FORM: FormState = {
  asset_code: "",
  photo: "",
  brand: "",
  model: "",
  plate_number: "",
  engine_number: "",
  chassis_number: "",
  purchase_date: "",
  purchase_price: "",
  tax_due_date: "",
  description: "",
  condition: "GOOD",
  usage_status: "IN_STORAGE",
  team_id: "",
  room_id: "",
  assigned_user_id: "",
};

function toForm(v: Vehicle): FormState {
  return {
    asset_code: v.asset_code,
    photo: v.photo || "",
    brand: v.brand,
    model: v.model,
    plate_number: v.plate_number || "",
    engine_number: v.engine_number || "",
    chassis_number: v.chassis_number || "",
    purchase_date: v.purchase_date || "",
    purchase_price: v.purchase_price || "",
    tax_due_date: v.tax_due_date || "",
    description: v.description || "",
    condition: v.condition,
    usage_status: v.usage_status,
    team_id: v.team ? String(v.team.id) : "",
    room_id: v.room ? String(v.room.id) : "",
    assigned_user_id: v.assigned_user ? String(v.assigned_user.id) : "",
  };
}

export default function Vehicles() {
  const { user } = useAuth();
  const canView =
    !!user &&
    (user.role === "super_admin" || user.role === "admin" || user.role === "staff");
  const canManage = !!user && (user.role === "super_admin" || user.role === "admin");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [meta, setMeta] = useState<Paginated<Vehicle>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [filters, setFilters] = useState<VehicleFilters>({
    search: "",
    condition: "",
    usage_status: "",
    tax_status: "",
    page: 1,
    per_page: PER_PAGE,
  });

  const [selected, setSelected] = useState<Vehicle | null>(null);

  const addModal = useModal();
  const detailModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchVehicles(filters);
      setVehicles(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(extractError(err, "Failed to load vehicles."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [roomsRes, teamsRes, usersRes] = await Promise.all([
          fetchRooms({ per_page: 100 }),
          fetchTeams({ per_page: 100 }),
          fetchUsers({ per_page: 100 }),
        ]);
        if (cancelled) return;
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

  function updateFilter(key: keyof VehicleFilters, value: string) {
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
    await loadVehicles();
  }

  async function handleSave(payload: FormState & { editing: Vehicle | null }) {
    setSaving(true);
    setError(null);
    try {
      const damaged = payload.condition === "DAMAGED";
      const body: Record<string, unknown> = {
        asset_code: payload.asset_code,
        photo: payload.photo || null,
        brand: payload.brand,
        model: payload.model,
        plate_number: payload.plate_number || null,
        engine_number: payload.engine_number || null,
        chassis_number: payload.chassis_number || null,
        purchase_date: payload.purchase_date || null,
        purchase_price: payload.purchase_price || null,
        tax_due_date: payload.tax_due_date || null,
        description: payload.description || null,
        condition: payload.condition,
        usage_status: damaged ? "IN_STORAGE" : payload.usage_status,
        team_id: payload.team_id || null,
        room_id: payload.room_id || null,
        assigned_user_id: payload.assigned_user_id || null,
      };
      if (payload.editing) {
        await updateVehicle(payload.editing.id, body);
        showTempSuccess("Vehicle updated.");
        editModal.closeModal();
      } else {
        await createVehicle(body);
        showTempSuccess("Vehicle created.");
        addModal.closeModal();
      }
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to save vehicle."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSubmitting("delete");
    setError(null);
    try {
      await deleteVehicle(selected.id);
      deleteModal.closeModal();
      setSelected(null);
      showTempSuccess("Vehicle deleted.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to delete vehicle."));
    } finally {
      setSubmitting(null);
    }
  }

  if (!canView) {
    return (
      <>
        <PageMeta title="Vehicles | Access Denied" description="Vehicle asset management" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            You do not have permission to view vehicles.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Vehicle Assets"
        description="Manage motorcycle vehicle assets."
      />
      

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Vehicle Assets
          </h3>
          {canManage && (
            <Button onClick={addModal.openModal} startIcon={<PlusIcon />}>
              Add Vehicle
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
              placeholder="Search by code, plate, brand, or model..."
              className="lg:max-w-[300px]"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                options={VEHICLE_CONDITION_OPTIONS}
                placeholder="All conditions"
                defaultValue=""
                onChange={(v) => updateFilter("condition", v)}
              />
              <Select
                options={VEHICLE_USAGE_OPTIONS}
                placeholder="All usage"
                defaultValue=""
                onChange={(v) => updateFilter("usage_status", v)}
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
              <Select
                options={VEHICLE_TAX_OPTIONS}
                placeholder="All tax status"
                defaultValue=""
                onChange={(v) => updateFilter("tax_status", v)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Vehicle
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Plate Number
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Team
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Condition
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Tax Due
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Tax Status
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    User
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
                {!loading && vehicles.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  vehicles.map((v) => {
                    const taxStatus = computeVehicleTaxStatus(v.tax_due_date);
                    const taxMeta = taxStatus ? VEHICLE_TAX_META[taxStatus] : null;
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {v.photo ? (
                              <img
                                src={v.photo}
                                alt={`${v.brand} ${v.model}`}
                                className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-gray-700"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                <BoxIconLine />
                              </span>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {v.brand} {v.model}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {v.asset_code}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <Badge size="sm" variant="light" color="info">
                            {v.plate_number || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {v.team?.name || "-"}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <Badge
                            size="sm"
                            variant="light"
                            color={v.condition === "GOOD" ? "success" : "error"}
                          >
                            {v.condition}
                          </Badge>
                          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                            {v.usage_status}
                          </p>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <CalenderIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {v.tax_due_date || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {taxMeta ? (
                            <Badge
                              size="sm"
                              variant="light"
                              color={taxMeta.color}
                            >
                              {taxMeta.label}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {v.assigned_user?.name || "-"}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelected(v);
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
                                    setSelected(v);
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
                                    setSelected(v);
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
        <VehicleModal
          isOpen={addModal.isOpen}
          onClose={addModal.closeModal}
          editing={null}
          saving={saving}
          rooms={rooms}
          teams={teams}
          users={users}
          onSubmit={handleSave}
        />
      )}

      {canManage && selected && (
        <VehicleModal
          isOpen={editModal.isOpen}
          onClose={editModal.closeModal}
          key={selected.id}
          editing={selected}
          saving={saving}
          rooms={rooms}
          teams={teams}
          users={users}
          onSubmit={handleSave}
        />
      )}

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        vehicle={selected}
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
              Delete Vehicle
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700 dark:text-white/90">
                {selected.brand} {selected.model}
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

function VehicleModal({
  isOpen,
  onClose,
  editing,
  saving,
  rooms,
  teams,
  users,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  editing: Vehicle | null;
  saving: boolean;
  rooms: Room[];
  teams: Team[];
  users: User[];
  onSubmit: (payload: FormState & { editing: Vehicle | null }) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    editing ? toForm(editing) : EMPTY_FORM
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(editing ? toForm(editing) : EMPTY_FORM);
      setFormError(null);
    }
  }, [isOpen, editing]);

  const damaged = form.condition === "DAMAGED";

  function set<K extends keyof FormState>(key: K, value: string) {
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
    setFormError(null);
    if (!form.brand.trim() || !form.model.trim()) {
      setFormError("Brand and model are required.");
      return;
    }
    if (form.plate_number.trim() && !/^[A-Z]{1,2}[ ]?\d{1,4}[ ]?[A-Z]{1,3}$/.test(form.plate_number.trim().toUpperCase())) {
      setFormError("Plate number format is invalid (e.g. B 1234 ABC).");
      return;
    }
    if (form.purchase_date && form.tax_due_date && form.tax_due_date < form.purchase_date) {
      setFormError("Tax due date cannot be before the purchase date.");
      return;
    }
    onSubmit({
      ...form,
      brand: form.brand.trim(),
      model: form.model.trim(),
      plate_number: form.plate_number.trim().toUpperCase(),
      engine_number: form.engine_number.trim(),
      chassis_number: form.chassis_number.trim(),
      description: form.description.trim(),
      editing,
    });
  }

  const roomOptions = damaged
    ? rooms.filter((r) => r.is_storage)
    : rooms;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[640px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[640px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Edit Vehicle" : "Add Vehicle"}
        </h4>
        <p className="mb-6 mt-1 text-sm text-gray-500 dark:text-gray-400">
          {editing
            ? `Update details for ${editing.asset_code}.`
            : "Register a new motorcycle asset. Leave the asset code blank to auto-generate (VHC-xxx)."}
        </p>

        {damaged && (
          <div className="mb-4 rounded-lg border border-warning-500 bg-warning-50 p-3 text-xs text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
            Damaged vehicles are forced to{" "}
            <span className="font-semibold">IN_STORAGE</span> and must be placed
            in a storage room (warehouse).
          </div>
        )}
        {formError && (
          <div className="mb-4 rounded-lg border border-error-500 bg-error-50 p-3 text-xs text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Asset Code</Label>
            <Input
              type="text"
              value={form.asset_code}
              onChange={(e) => set("asset_code", e.target.value)}
              placeholder="e.g. VHC-001 (auto)"
            />
          </div>
          <div>
            <Label>Photo (URL)</Label>
            <Input
              type="text"
              value={form.photo}
              onChange={(e) => set("photo", e.target.value)}
              placeholder="Optional image URL"
            />
          </div>
          <div>
            <Label>Brand</Label>
            <Input
              type="text"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="e.g. Honda"
              required
            />
          </div>
          <div>
            <Label>Model</Label>
            <Input
              type="text"
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="e.g. Vario 160"
              required
            />
          </div>
          <div>
            <Label>Plate Number</Label>
            <Input
              type="text"
              value={form.plate_number}
              onChange={(e) => set("plate_number", e.target.value.toUpperCase())}
              placeholder="e.g. B 1234 ABC"
            />
          </div>
          <div>
            <Label>Engine Number</Label>
            <Input
              type="text"
              value={form.engine_number}
              onChange={(e) => set("engine_number", e.target.value)}
              placeholder="Engine number"
            />
          </div>
          <div>
            <Label>Chassis Number</Label>
            <Input
              type="text"
              value={form.chassis_number}
              onChange={(e) => set("chassis_number", e.target.value)}
              placeholder="Chassis number"
            />
          </div>
          <div>
            <Label>Condition</Label>
            <Select
              options={VEHICLE_CONDITION_OPTIONS}
              placeholder="Select condition"
              defaultValue={form.condition}
              onChange={(v) => set("condition", v)}
            />
          </div>
          <div>
            <Label>Usage Status</Label>
            <Select
              options={VEHICLE_USAGE_OPTIONS}
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
            <Label>Purchase Date</Label>
            <Input
              type="date"
              value={form.purchase_date}
              onChange={(e) => set("purchase_date", e.target.value)}
            />
          </div>
          <div>
            <Label>Tax Due Date</Label>
            <Input
              type="date"
              value={form.tax_due_date}
              onChange={(e) => set("tax_due_date", e.target.value)}
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
              placeholder="e.g. 25000000"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Input
              type="text"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="sm:col-span-2 mt-2 flex items-center gap-3 justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Vehicle"}
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
  vehicle,
  onEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onEdit?: () => void;
}) {
  const [loaded, setLoaded] = useState<Vehicle | null>(vehicle);

  useEffect(() => {
    if (isOpen && vehicle) {
      setLoaded(vehicle);
      fetchVehicle(vehicle.id)
        .then((res) => setLoaded(res.data.vehicle))
        .catch(() => undefined);
    }
  }, [isOpen, vehicle]);

  if (!vehicle || !loaded) return null;

  const taxStatus = computeVehicleTaxStatus(loaded.tax_due_date);
  const taxMeta = taxStatus ? VEHICLE_TAX_META[taxStatus] : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Vehicle Details
        </h4>
        <div className="mt-4">
          <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {loaded.brand} {loaded.model}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge size="sm" variant="light" color="info">
              {loaded.asset_code}
            </Badge>
            <Badge size="sm" variant="light" color="info">
              {loaded.plate_number || "-"}
            </Badge>
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
            <Label>Engine Number</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.engine_number || "-"}
            </p>
          </div>
          <div>
            <Label>Chassis Number</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.chassis_number || "-"}
            </p>
          </div>
          <div>
            <Label>Purchase Date</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.purchase_date || "-"}
            </p>
          </div>
          <div>
            <Label>Tax Due Date</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.tax_due_date || "-"}
            </p>
          </div>
          <div>
            <Label>Tax Status</Label>
            {taxMeta ? (
              <Badge size="sm" variant="light" color={taxMeta.color}>
                {taxMeta.label}
              </Badge>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">-</p>
            )}
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
            <Label>Team</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.team?.name || "-"}
            </p>
          </div>
          <div>
            <Label>Room / Location</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.room ? loaded.room.name : "-"}
            </p>
          </div>
          <div>
            <Label>Assigned User</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.assigned_user?.name || "-"}
            </p>
          </div>
          {loaded.photo && (
            <div className="sm:col-span-2">
              <Label>Photo</Label>
              <img
                src={loaded.photo}
                alt={`${loaded.brand} ${loaded.model}`}
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
