import { useCallback, useEffect, useState, type FormEvent } from "react";
import PageMeta from "../components/common/PageMeta";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
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
import { PlusIcon, PencilIcon, TrashBinIcon } from "../icons";
import {
  fetchRoles,
  fetchPermissions,
  createRole,
  updateRole,
  deleteRole,
  assignRolePermissions,
  type Role,
  type Permission,
} from "../services/roles";

const ROLE_BADGE_COLOR: Record<
  string,
  "primary" | "info" | "warning" | "dark"
> = {
  super_admin: "primary",
  admin: "info",
  staff: "warning",
  viewer: "dark",
};

function extractError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

export default function Roles() {
  const { user } = useAuth();
  const canManage = !!user && user.role === "super_admin";

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const addModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  const permModal = useModal();

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRoles(search || undefined);
      setRoles(res.data.data);
    } catch (err) {
      setError(extractError(err, "Failed to load roles."));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    fetchPermissions()
      .then((res) => setPermissions(res.data.data))
      .catch(() => setPermissions([]));
  }, []);

  function showTempSuccess(msg: string) {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(null), 3000);
  }

  async function refresh() {
    await loadRoles();
  }

  async function handleSaveRole(payload: { name: string; role: Role | null }) {
    setSaving(true);
    setError(null);
    try {
      if (payload.role) {
        await updateRole(payload.role.id, payload.name);
        editModal.closeModal();
        showTempSuccess("Role updated.");
      } else {
        await createRole(payload.name);
        addModal.closeModal();
        showTempSuccess("Role created.");
      }
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to save role."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSubmitting("delete");
    setError(null);
    try {
      await deleteRole(selected.id);
      deleteModal.closeModal();
      setSelected(null);
      showTempSuccess("Role deleted.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to delete role."));
    } finally {
      setSubmitting(null);
    }
  }

  async function handleAssignPermissions(permissionIds: number[]) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await assignRolePermissions(selected.id, permissionIds);
      permModal.closeModal();
      setSelected(null);
      showTempSuccess("Permissions updated.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to update permissions."));
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <>
        <PageMeta title="Roles | Access Denied" description="Role management" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            You do not have permission to manage roles.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Role Management" description="Manage roles and permissions." />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Role Management
          </h3>
          <Button
            onClick={() => {
              setSelected(null);
              addModal.openModal();
            }}
            startIcon={<PlusIcon />}
          >
            Add Role
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles..."
              className="lg:max-w-[300px]"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Name
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Permissions
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
                {!loading && roles.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      No roles found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  roles.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-5 py-4">
                        <Badge
                          size="sm"
                          variant="light"
                          color={ROLE_BADGE_COLOR[r.name] || "dark"}
                        >
                          {r.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(r.permissions ?? []).length === 0 && (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                          {(r.permissions ?? []).slice(0, 6).map((p) => (
                            <Badge
                              key={p.id}
                              size="sm"
                              variant="light"
                              color="info"
                            >
                              {p.name}
                            </Badge>
                          ))}
                          {(r.permissions ?? []).length > 6 && (
                            <Badge size="sm" variant="solid" color="dark">
                              +{(r.permissions ?? []).length - 6}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(r);
                              permModal.openModal();
                            }}
                          >
                            Permissions
                          </Button>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <RoleModal
        key={selected?.id || "add"}
        isOpen={addModal.isOpen || editModal.isOpen}
        onClose={() => {
          editModal.closeModal();
          addModal.closeModal();
        }}
        role={selected}
        saving={saving}
        onSubmit={handleSaveRole}
      />

      <PermissionsModal
        key={selected?.id || "perms"}
        isOpen={permModal.isOpen}
        onClose={permModal.closeModal}
        role={selected}
        permissions={permissions}
        saving={saving}
        onSubmit={handleAssignPermissions}
      />

      {selected && (
        <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[450px] m-4">
          <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Delete Role
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete the role{" "}
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

function RoleModal({
  isOpen,
  onClose,
  role,
  saving,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  saving: boolean;
  onSubmit: (payload: { name: string; role: Role | null }) => void;
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(role?.name || "");
    }
  }, [isOpen, role]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), role });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[450px] m-4">
      <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {role ? "Edit Role" : "Add Role"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {role ? `Rename ${role.name}.` : "Create a new system role."}
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label>Role Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. manager"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving}>
              {saving ? "Saving..." : role ? "Save Changes" : "Create Role"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function PermissionsModal({
  isOpen,
  onClose,
  role,
  permissions,
  saving,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  permissions: Permission[];
  saving: boolean;
  onSubmit: (permissionIds: number[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds((role?.permissions ?? []).map((p) => p.id));
    }
  }, [isOpen, role]);

  if (!role) return null;

  function toggle(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] m-4">
      <div className="no-scrollbar relative max-h-[85vh] w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Assign Permissions
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select permissions for role{" "}
          <span className="font-medium text-gray-700 dark:text-white/90">
            {role.name}
          </span>
          .
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {permissions.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700"
            >
              <Checkbox
                label={p.name}
                checked={selectedIds.includes(p.id)}
                onChange={() => toggle(p.id)}
              />
            </div>
          ))}
          {permissions.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No permissions available.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={() => onSubmit(selectedIds)}
          >
            {saving ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
