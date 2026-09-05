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
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon, BoxIconLine } from "../icons";
import {
  fetchRooms,
  fetchRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  STATUS_OPTIONS,
  type Room,
  type Paginated,
  type RoomFilters,
} from "../services/rooms";

const PER_PAGE = 10;

function extractError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

type FormState = {
  name: string;
  location: string;
  description: string;
  status: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  location: "",
  description: "",
  status: "active",
};

export default function Rooms() {
  const { user } = useAuth();
  const canView =
    !!user &&
    (user.role === "super_admin" || user.role === "admin" || user.role === "staff");
  const canManage = !!user && (user.role === "super_admin" || user.role === "admin");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [meta, setMeta] = useState<Paginated<Room>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filters, setFilters] = useState<RoomFilters>({
    search: "",
    status: "",
    page: 1,
    per_page: PER_PAGE,
  });

  const [selected, setSelected] = useState<Room | null>(null);

  const addModal = useModal();
  const detailModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRooms(filters);
      setRooms(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(extractError(err, "Failed to load rooms."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  function updateFilter(key: keyof RoomFilters, value: string) {
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
    await loadRooms();
  }

  async function handleSaveRoom(payload: {
    name: string;
    location: string;
    description: string;
    status: string;
    editing: Room | null;
  }) {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: payload.name,
        location: payload.location || null,
        description: payload.description || null,
        status: payload.status,
      };
      if (payload.editing) {
        await updateRoom(payload.editing.id, body);
        showTempSuccess("Room updated.");
        editModal.closeModal();
      } else {
        await createRoom(body);
        showTempSuccess("Room created.");
        addModal.closeModal();
      }
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to save room."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSubmitting("delete");
    setError(null);
    try {
      await deleteRoom(selected.id);
      deleteModal.closeModal();
      setSelected(null);
      showTempSuccess("Room deleted.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to delete room."));
    } finally {
      setSubmitting(null);
    }
  }

  if (!canView) {
    return (
      <>
        <PageMeta title="Rooms | Access Denied" description="Room management" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            You do not have permission to view rooms.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Room Management"
        description="Manage rooms and location information."
      />
      

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Room Management
          </h3>
          {canManage && (
            <Button onClick={addModal.openModal} startIcon={<PlusIcon />}>
              Add Room
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
              placeholder="Search by name, location, or description..."
              className="lg:max-w-[300px]"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                options={STATUS_OPTIONS}
                placeholder="All statuses"
                defaultValue=""
                onChange={(v) => updateFilter("status", v)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Room
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Location
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Assets
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Status
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
                {!loading && rooms.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      No rooms found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  rooms.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                            <BoxIconLine />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {r.name}
                            </p>
                            <p className="max-w-[240px] truncate text-xs text-gray-500 dark:text-gray-400">
                              {r.description || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {r.location || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {r.assets_count ?? 0}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge
                          size="sm"
                          variant="light"
                          color={r.status === "active" ? "success" : "error"}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(r);
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
                                  setSelected(r);
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
                                  setSelected(r);
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
        <RoomModal
          isOpen={addModal.isOpen}
          onClose={addModal.closeModal}
          editing={null}
          saving={saving}
          onSubmit={handleSaveRoom}
        />
      )}

      {canManage && (
        <RoomModal
          isOpen={editModal.isOpen}
          onClose={editModal.closeModal}
          key={selected?.id || "edit"}
          editing={selected}
          saving={saving}
          onSubmit={handleSaveRoom}
        />
      )}

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        room={selected}
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
              Delete Room
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700 dark:text-white/90">
                {selected.name}
              </span>
              ? This action cannot be undone.
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

function RoomModal({
  isOpen,
  onClose,
  editing,
  saving,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  editing: Room | null;
  saving: boolean;
  onSubmit: (payload: {
    name: string;
    location: string;
    description: string;
    status: string;
    editing: Room | null;
  }) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          name: editing.name,
          location: editing.location || "",
          description: editing.description || "",
          status: editing.status,
        }
      : EMPTY_FORM
  );

  useEffect(() => {
    if (isOpen) {
      setForm(
        editing
          ? {
              name: editing.name,
              location: editing.location || "",
              description: editing.description || "",
              status: editing.status,
            }
          : EMPTY_FORM
      );
    }
  }, [isOpen, editing]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, name: form.name.trim(), editing });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Edit Room" : "Add Room"}
        </h4>
        <p className="mb-6 mt-1 text-sm text-gray-500 dark:text-gray-400">
          {editing
            ? `Update details for ${editing.name}.`
            : "Create a new room."}
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Room Name</Label>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Meeting Room A"
              required
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Lantai 1"
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              options={STATUS_OPTIONS}
              placeholder="Select status"
              defaultValue={form.status}
              onChange={(v) => set("status", v)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Input
              type="text"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Room description"
            />
          </div>
          <div className="sm:col-span-2 mt-2 flex items-center gap-3 justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Room"}
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
  room,
  onEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onEdit?: () => void;
}) {
  const [loaded, setLoaded] = useState<Room | null>(room);

  useEffect(() => {
    if (isOpen && room) {
      setLoaded(room);
      fetchRoom(room.id)
        .then((res) => setLoaded(res.data.room))
        .catch(() => undefined);
    }
  }, [isOpen, room]);

  if (!room || !loaded) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Room Details
        </h4>
        <div className="mt-4">
          <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {loaded.name}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(loaded.teams ?? []).length === 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                No teams assigned.
              </span>
            )}
            {(loaded.teams ?? []).map((t) => (
              <Badge key={t.id} size="sm" variant="light" color="info">
                {t.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Location</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.location || "-"}
            </p>
          </div>
          <div>
            <Label>Status</Label>
            <Badge
              size="sm"
              variant="light"
              color={loaded.status === "active" ? "success" : "error"}
            >
              {loaded.status}
            </Badge>
          </div>
          <div>
            <Label>Assets</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.assets_count ?? 0}
            </p>
          </div>
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