import { useCallback, useEffect, useState, type FormEvent } from "react";
import PageMeta from "../components/common/PageMeta";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
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
import { PlusIcon, PencilIcon, TrashBinIcon } from "../icons";
import {
  fetchPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  type Permission,
} from "../services/roles";

function extractError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

export default function Permissions() {
  const { user } = useAuth();
  const canManage = !!user && user.role === "super_admin";

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Permission | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const addModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPermissions(search || undefined);
      setPermissions(res.data.data);
    } catch (err) {
      setError(extractError(err, "Failed to load permissions."));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  function showTempSuccess(msg: string) {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(null), 3000);
  }

  async function refresh() {
    await loadPermissions();
  }

  async function handleSavePermission(payload: {
    name: string;
    permission: Permission | null;
  }) {
    setSaving(true);
    setError(null);
    try {
      if (payload.permission) {
        await updatePermission(payload.permission.id, payload.name);
        editModal.closeModal();
        showTempSuccess("Permission updated.");
      } else {
        await createPermission(payload.name);
        addModal.closeModal();
        showTempSuccess("Permission created.");
      }
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to save permission."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSubmitting("delete");
    setError(null);
    try {
      await deletePermission(selected.id);
      deleteModal.closeModal();
      setSelected(null);
      showTempSuccess("Permission deleted.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to delete permission."));
    } finally {
      setSubmitting(null);
    }
  }

  if (!canManage) {
    return (
      <>
        <PageMeta
          title="Permissions | Access Denied"
          description="Permission management"
        />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            You do not have permission to manage permissions.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Permission Management"
        description="Manage permissions."
      />
      

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Permission Management
          </h3>
          <Button
            onClick={() => {
              setSelected(null);
              addModal.openModal();
            }}
            startIcon={<PlusIcon />}
          >
            Add Permission
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
              placeholder="Search permissions..."
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
                    Guard
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
                {!loading && permissions.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      No permissions found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  permissions.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="px-5 py-4">
                        <Badge size="sm" variant="light" color="info">
                          {p.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {p.guard_name}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(p);
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
                              setSelected(p);
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

      <PermissionModal
        key={selected?.id || "add"}
        isOpen={addModal.isOpen || editModal.isOpen}
        onClose={() => {
          editModal.closeModal();
          addModal.closeModal();
        }}
        permission={selected}
        saving={saving}
        onSubmit={handleSavePermission}
      />

      {selected && (
        <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[450px] m-4">
          <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Delete Permission
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete the permission{" "}
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

function PermissionModal({
  isOpen,
  onClose,
  permission,
  saving,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  permission: Permission | null;
  saving: boolean;
  onSubmit: (payload: { name: string; permission: Permission | null }) => void;
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(permission?.name || "");
    }
  }, [isOpen, permission]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), permission });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[450px] m-4">
      <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {permission ? "Edit Permission" : "Add Permission"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {permission
            ? `Rename ${permission.name}.`
            : "Create a new permission."}
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label>Permission Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. report.view"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving}>
              {saving
                ? "Saving..."
                : permission
                  ? "Save Changes"
                  : "Create Permission"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
