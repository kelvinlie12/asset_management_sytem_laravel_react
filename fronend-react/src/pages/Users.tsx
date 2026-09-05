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
  UserCircleIcon,
} from "../icons";
import {
  fetchUsers,
  fetchTeams,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  assignTeam,
  resetPassword,
  deactivateUser,
  activateUser,
  ROLE_OPTIONS,
  type User,
  type Team,
  type Paginated,
  type UserFilters,
} from "../services/users";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PER_PAGE = 10;

function extractError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  role: string;
  team_id: string;
  status: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  role: "",
  team_id: "",
  status: "active",
};

export default function Users() {
  const { user } = useAuth();
  const canManage =
    !!user && (user.role === "super_admin" || user.role === "admin");

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Paginated<User>["meta"] | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "",
    status: "",
    team_id: "",
    page: 1,
    per_page: PER_PAGE,
  });

  const [selected, setSelected] = useState<User | null>(null);

  const addModal = useModal();
  const detailModal = useModal();
  const editModal = useModal();
  const resetModal = useModal();
  const roleModal = useModal();
  const assignTeamModal = useModal();
  const deleteModal = useModal();

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    try {
      const res = await fetchTeams();
      setTeams(res.data.data);
    } catch {
      setTeams([]);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers(filters);
      setUsers(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(extractError(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function updateFilter(key: keyof UserFilters, value: string) {
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
    await loadUsers();
  }

  async function handleToggleStatus(u: User) {
    setSubmitting(u.id.toString());
    try {
      if (u.status === "active") {
        await deactivateUser(u.id);
        showTempSuccess(`${u.name} deactivated.`);
      } else {
        await activateUser(u.id);
        showTempSuccess(`${u.name} activated.`);
      }
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to update status."));
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSubmitting("delete");
    try {
      await deleteUser(selected.id);
      deleteModal.closeModal();
      setSelected(null);
      showTempSuccess("User deleted.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to delete user."));
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSaveUser(payload: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: string;
    team_id: string;
    status: string;
    editing: User | null;
  }) {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        role: payload.role,
        team_id: payload.team_id || null,
      };
      if (payload.editing) {
        await updateUser(payload.editing.id, body);
        showTempSuccess("User updated.");
      } else {
        body.password = payload.password;
        body.status = payload.status;
        await createUser(body);
        showTempSuccess("User created.");
      }
      if (payload.editing) {
        editModal.closeModal();
      } else {
        addModal.closeModal();
      }
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to save user."));
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(password: string) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await resetPassword(selected.id, password);
      resetModal.closeModal();
      setSelected(null);
      showTempSuccess("Password reset successfully.");
    } catch (err) {
      setError(extractError(err, "Failed to reset password."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignRole(role: string) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await assignRole(selected.id, role);
      roleModal.closeModal();
      setSelected(null);
      showTempSuccess("Role updated.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to update role."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignTeam(teamId: string) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await assignTeam(selected.id, teamId);
      assignTeamModal.closeModal();
      setSelected(null);
      showTempSuccess("Team updated.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to update team."));
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <>
        <PageMeta title="Users | Access Denied" description="User management" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            You do not have permission to manage users.
          </p>
        </div>
      </>
    );
  }

  const roleBadgeColor: Record<string, "primary" | "info" | "warning" | "dark"> =
    {
      super_admin: "primary",
      admin: "info",
      staff: "warning",
      viewer: "dark",
    };

  return (
    <>
      <PageMeta
        title="User Management"
        description="Manage users, roles, and teams."
      />
      

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            User Management
          </h3>
          <Button onClick={addModal.openModal} startIcon={<PlusIcon />}>
            Add User
          </Button>
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
              placeholder="Search by name or email..."
              className="lg:max-w-[300px]"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                options={ROLE_OPTIONS}
                placeholder="All roles"
                defaultValue=""
                onChange={(v) => updateFilter("role", v)}
              />
              <Select
                options={STATUS_OPTIONS}
                placeholder="All statuses"
                defaultValue=""
                onChange={(v) => updateFilter("status", v)}
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
                    Name
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Role
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Team
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
                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                            <UserCircleIcon />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {u.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge
                          size="sm"
                          variant="light"
                          color={roleBadgeColor[u.role] || "dark"}
                        >
                          {u.role_label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {u.team?.name || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge
                          size="sm"
                          variant="light"
                          color={u.status === "active" ? "success" : "error"}
                        >
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(u);
                              detailModal.openModal();
                            }}
                            startIcon={<EyeIcon />}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(u);
                              editModal.openModal();
                            }}
                            startIcon={<PencilIcon />}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submitting === u.id.toString()}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(u);
                              deleteModal.openModal();
                            }}
                            startIcon={<TrashBinIcon />}
                          >
                            Delete
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

      <AddEditModal
        isOpen={addModal.isOpen}
        onClose={addModal.closeModal}
        editing={null}
        teams={teams}
        saving={saving}
        onSubmit={handleSaveUser}
      />

      <AddEditModal
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        key={selected?.id || "edit"}
        editing={selected}
        teams={teams}
        saving={saving}
        onSubmit={handleSaveUser}
      />

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        user={selected}
        onEdit={() => {
          detailModal.closeModal();
          editModal.openModal();
        }}
      />

      <AssignRoleModal
        key={selected?.id || "role"}
        isOpen={roleModal.isOpen}
        onClose={roleModal.closeModal}
        user={selected}
        saving={saving}
        onSubmit={handleAssignRole}
      />

      <AssignTeamModal
        key={selected?.id || "team"}
        isOpen={assignTeamModal.isOpen}
        onClose={assignTeamModal.closeModal}
        user={selected}
        teams={teams}
        saving={saving}
        onSubmit={handleAssignTeam}
      />

      {selected && (
        <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[450px] m-4">
          <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Delete User
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700 dark:text-white/90">
                {selected.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center gap-3 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={deleteModal.closeModal}
              >
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

      {selected && (
        <Modal isOpen={resetModal.isOpen} onClose={resetModal.closeModal} className="max-w-[450px] m-4">
          <ResetPasswordBody
            user={selected}
            saving={saving}
            onSubmit={handleResetPassword}
            onClose={resetModal.closeModal}
          />
        </Modal>
      )}
    </>
  );
}

function AddEditModal({
  isOpen,
  onClose,
  editing,
  teams,
  saving,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  editing: User | null;
  teams: Team[];
  saving: boolean;
  onSubmit: (payload: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: string;
    team_id: string;
    status: string;
    editing: User | null;
  }) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          name: editing.name,
          email: editing.email,
          phone: editing.phone || "",
          password: "",
          password_confirmation: "",
          role: editing.role,
          team_id: editing.team ? String(editing.team.id) : "",
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
              email: editing.email,
              phone: editing.phone || "",
              password: "",
              password_confirmation: "",
              role: editing.role,
              team_id: editing.team ? String(editing.team.id) : "",
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
    if (!editing && form.password !== form.password_confirmation) {
      alert("Password confirmation does not match.");
      return;
    }
    onSubmit({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
      team_id: form.team_id,
      status: form.status,
      editing,
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] m-4">
      <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Edit User" : "Add User"}
        </h4>
        <p className="mb-6 mt-1 text-sm text-gray-500 dark:text-gray-400">
          {editing
            ? `Update details for ${editing.name}.`
            : "Create a new user account."}
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Full Name</Label>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              type="text"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="Phone"
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              options={ROLE_OPTIONS}
              placeholder="Select role"
              defaultValue={form.role}
              onChange={(v) => set("role", v)}
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
          {!editing && (
            <div>
              <Label>Status</Label>
              <Select
                options={STATUS_OPTIONS}
                placeholder="Select status"
                defaultValue={form.status}
                onChange={(v) => set("status", v)}
              />
            </div>
          )}
          {!editing && (
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min. 8 characters"
                required
              />
            </div>
          )}
          {!editing && (
            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={form.password_confirmation}
                onChange={(e) => set("password_confirmation", e.target.value)}
                placeholder="Repeat password"
                required
              />
            </div>
          )}
          <div className="sm:col-span-2 mt-2 flex items-center gap-3 justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create User"}
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
  user,
  onEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onEdit: () => void;
}) {
  if (!user) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          User Details
        </h4>
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <UserCircleIcon />
          </span>
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {user.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Role</Label>
            <p className="text-sm text-gray-800 dark:text-white/90 capitalize">
              {user.role_label}
            </p>
          </div>
          <div>
            <Label>Status</Label>
            <Badge
              size="sm"
              variant="light"
              color={user.status === "active" ? "success" : "error"}
            >
              {user.status}
            </Badge>
          </div>
          <div>
            <Label>Team</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {user.team?.name || "-"}
            </p>
          </div>
          <div>
            <Label>Phone</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {user.phone || "-"}
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ResetPasswordBody({
  user,
  saving,
  onSubmit,
  onClose,
}: {
  user: User;
  saving: boolean;
  onSubmit: (password: string) => void;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      alert("Password confirmation does not match.");
      return;
    }
    onSubmit(password);
  }

  return (
    <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
      <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
        Reset Password
      </h4>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Set a new password for {user.name}.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <Label>New Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
          />
        </div>
        <div>
          <Label>Confirm Password</Label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            required
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={saving}>
            {saving ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function AssignRoleModal({
  isOpen,
  onClose,
  user,
  saving,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  saving: boolean;
  onSubmit: (role: string) => void;
}) {
  const [role, setRole] = useState(user?.role || "");

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[450px] m-4">
      <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Assign Role
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Change the role for {user?.name}.
        </p>
        <div className="mt-4">
          <Label>Role</Label>
          <Select
            options={ROLE_OPTIONS}
            placeholder="Select role"
            defaultValue={user?.role || ""}
            onChange={(v) => setRole(v)}
          />
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={saving} onClick={() => onSubmit(role)}>
            {saving ? "Saving..." : "Assign Role"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AssignTeamModal({
  isOpen,
  onClose,
  user,
  teams,
  saving,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  teams: Team[];
  saving: boolean;
  onSubmit: (teamId: string) => void;
}) {
  const [teamId, setTeamId] = useState(
    user?.team ? String(user.team.id) : ""
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[450px] m-4">
      <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Assign Team
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Change the team for {user?.name}.
        </p>
        <div className="mt-4">
          <Label>Team</Label>
          <Select
            options={teams.map((t) => ({
              value: String(t.id),
              label: t.name,
            }))}
            placeholder="No team"
            defaultValue={user?.team ? String(user.team.id) : ""}
            onChange={(v) => setTeamId(v)}
          />
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={saving} onClick={() => onSubmit(teamId)}>
            {saving ? "Saving..." : "Assign Team"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
