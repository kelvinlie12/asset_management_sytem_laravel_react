import { useCallback, useEffect, useState, type FormEvent } from "react";
import PageMeta from "../components/common/PageMeta";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import Checkbox from "../components/form/input/Checkbox";
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
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon, GroupIcon } from "../icons";
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  assignTeamRooms,
  STATUS_OPTIONS,
  type Team,
  type Room,
  type Paginated,
  type TeamFilters,
} from "../services/teams";
import { fetchRooms } from "../services/rooms";

const PER_PAGE = 10;

function extractError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

type FormState = {
  name: string;
  description: string;
  status: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  status: "active",
};

export default function Teams() {
  const { user } = useAuth();
  const canView =
    !!user &&
    (user.role === "super_admin" || user.role === "admin" || user.role === "staff");
  const canManage = !!user && (user.role === "super_admin" || user.role === "admin");

  const [teams, setTeams] = useState<Team[]>([]);
  const [meta, setMeta] = useState<Paginated<Team>["meta"] | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filters, setFilters] = useState<TeamFilters>({
    search: "",
    status: "",
    page: 1,
    per_page: PER_PAGE,
  });

  const [selected, setSelected] = useState<Team | null>(null);

  const addModal = useModal();
  const detailModal = useModal();
  const editModal = useModal();
  const roomsModal = useModal();
  const deleteModal = useModal();

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTeams(filters);
      setTeams(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(extractError(err, "Failed to load teams."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (canManage) {
      fetchRooms({ per_page: 100 })
        .then((res) => setRooms(res.data.data))
        .catch(() => setRooms([]));
    }
  }, [canManage]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  function updateFilter(key: keyof TeamFilters, value: string) {
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
    await loadTeams();
  }

  async function handleSaveTeam(payload: {
    name: string;
    description: string;
    status: string;
    roomIds: number[];
    editing: Team | null;
  }) {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: payload.name,
        description: payload.description || null,
        room_ids: payload.roomIds,
      };
      if (payload.editing) {
        await updateTeam(payload.editing.id, body);
        showTempSuccess("Team updated.");
        editModal.closeModal();
      } else {
        body.status = payload.status;
        await createTeam(body);
        showTempSuccess("Team created.");
        addModal.closeModal();
      }
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to save team."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignRooms(roomIds: number[]) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await assignTeamRooms(selected.id, roomIds);
      roomsModal.closeModal();
      setSelected(null);
      showTempSuccess("Rooms updated.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to update rooms."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSubmitting("delete");
    setError(null);
    try {
      await deleteTeam(selected.id);
      deleteModal.closeModal();
      setSelected(null);
      showTempSuccess("Team deleted.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to delete team."));
    } finally {
      setSubmitting(null);
    }
  }

  if (!canView) {
    return (
      <>
        <PageMeta title="Teams | Access Denied" description="Team management" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            You do not have permission to view teams.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Team Management"
        description="Manage teams, members, and assigned rooms."
      />
      

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Team Management
          </h3>
          {canManage && (
            <Button onClick={addModal.openModal} startIcon={<PlusIcon />}>
              Add Team
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
              placeholder="Search by name or description..."
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
                    Team
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Members
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Rooms
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
                {!loading && teams.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      No teams found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  teams.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                            <GroupIcon />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {t.name}
                            </p>
                            <p className="max-w-[240px] truncate text-xs text-gray-500 dark:text-gray-400">
                              {t.description || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {t.users_count ?? 0}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(t.rooms ?? []).length === 0 && (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                          {(t.rooms ?? []).slice(0, 3).map((r) => (
                            <Badge
                              key={r.id}
                              size="sm"
                              variant="light"
                              color="info"
                            >
                              {r.name}
                            </Badge>
                          ))}
                          {(t.rooms ?? []).length > 3 && (
                            <Badge size="sm" variant="solid" color="dark">
                              +{(t.rooms ?? []).length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge
                          size="sm"
                          variant="light"
                          color={t.status === "active" ? "success" : "error"}
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
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
                          {canManage && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelected(t);
                                  roomsModal.openModal();
                                }}
                              >
                                Rooms
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelected(t);
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
                                  setSelected(t);
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
        <TeamModal
          isOpen={addModal.isOpen}
          onClose={addModal.closeModal}
          editing={null}
          rooms={rooms}
          saving={saving}
          onSubmit={handleSaveTeam}
        />
      )}

      {canManage && (
        <TeamModal
          isOpen={editModal.isOpen}
          onClose={editModal.closeModal}
          key={selected?.id || "edit"}
          editing={selected}
          rooms={rooms}
          saving={saving}
          onSubmit={handleSaveTeam}
        />
      )}

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        team={selected}
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
        <AssignRoomsModal
          key={selected.id}
          isOpen={roomsModal.isOpen}
          onClose={roomsModal.closeModal}
          team={selected}
          rooms={rooms}
          saving={saving}
          onSubmit={handleAssignRooms}
        />
      )}

      {canManage && selected && (
        <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[450px] m-4">
          <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Delete Team
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

function TeamModal({
  isOpen,
  onClose,
  editing,
  rooms,
  saving,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  editing: Team | null;
  rooms: Room[];
  saving: boolean;
  onSubmit: (payload: {
    name: string;
    description: string;
    status: string;
    roomIds: number[];
    editing: Team | null;
  }) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          name: editing.name,
          description: editing.description || "",
          status: editing.status,
        }
      : EMPTY_FORM
  );
  const [roomIds, setRoomIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setForm(
        editing
          ? {
              name: editing.name,
              description: editing.description || "",
              status: editing.status,
            }
          : EMPTY_FORM
      );
      setRoomIds((editing?.rooms ?? []).map((r) => r.id));
    }
  }, [isOpen, editing]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleRoom(id: number) {
    setRoomIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, name: form.name.trim(), roomIds, editing });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[550px] m-4">
      <div className="no-scrollbar relative w-full max-w-[550px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Edit Team" : "Add Team"}
        </h4>
        <p className="mb-6 mt-1 text-sm text-gray-500 dark:text-gray-400">
          {editing
            ? `Update details for ${editing.name}.`
            : "Create a new team."}
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Team Name</Label>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Development"
              required
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
              placeholder="Team description"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Rooms ({roomIds.length} selected)</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {rooms.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700"
                >
                  <Checkbox
                    label={r.name}
                    checked={roomIds.includes(r.id)}
                    onChange={() => toggleRoom(r.id)}
                  />
                </div>
              ))}
              {rooms.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No rooms available.
                </p>
              )}
            </div>
          </div>
          <div className="sm:col-span-2 mt-2 flex items-center gap-3 justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function AssignRoomsModal({
  isOpen,
  onClose,
  team,
  rooms,
  saving,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  rooms: Room[];
  saving: boolean;
  onSubmit: (roomIds: number[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds((team.rooms ?? []).map((r) => r.id));
    }
  }, [isOpen, team]);

  function toggle(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[550px] m-4">
      <div className="no-scrollbar relative max-h-[85vh] w-full max-w-[550px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Assign Rooms
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select the rooms that team{" "}
          <span className="font-medium text-gray-700 dark:text-white/90">
            {team.name}
          </span>{" "}
          can use.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700"
            >
              <Checkbox
                label={r.name}
                checked={selectedIds.includes(r.id)}
                onChange={() => toggle(r.id)}
              />
            </div>
          ))}
          {rooms.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No rooms available.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={saving} onClick={() => onSubmit(selectedIds)}>
            {saving ? "Saving..." : "Save Rooms"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DetailModal({
  isOpen,
  onClose,
  team,
  onEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onEdit?: () => void;
}) {
  if (!team) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Team Details
        </h4>
        <div className="mt-4">
          <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {team.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{team.slug}</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Status</Label>
            <Badge
              size="sm"
              variant="light"
              color={team.status === "active" ? "success" : "error"}
            >
              {team.status}
            </Badge>
          </div>
          <div>
            <Label>Members</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {team.users_count ?? 0}
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {team.description || "-"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label>Assigned Rooms</Label>
            {(team.rooms ?? []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(team.rooms ?? []).map((r) => (
                  <Badge key={r.id} size="sm" variant="light" color="info">
                    {r.name}
                  </Badge>
                ))}
              </div>
            )}
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