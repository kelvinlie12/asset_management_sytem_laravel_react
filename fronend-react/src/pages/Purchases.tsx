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
import { PlusIcon, TrashBinIcon, EyeIcon, DollarLineIcon } from "../icons";
import {
  fetchPurchases,
  fetchPurchase,
  createPurchase,
  deletePurchase,
  type Purchase,
  type Paginated,
   type PurchaseFilters,
} from "../services/purchases";
import { fetchCategories, type Category } from "../services/categories";
import { fetchRooms, type Room } from "../services/rooms";

const PER_PAGE = 10;

function extractError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

type FormState = {
  name: string;
  category_id: string;
  room_id: string;
  amount: string;
  purchase_date: string;
  supplier: string;
  invoice_number: string;
  notes: string;
  proof: File | null;
};

const EMPTY_FORM: FormState = {
  name: "",
  category_id: "",
  room_id: "",
  amount: "",
  purchase_date: "",
  supplier: "",
  invoice_number: "",
  notes: "",
  proof: null,
};

export default function Purchases() {
  const { user } = useAuth();
  const canView =
    !!user &&
    (user.role === "super_admin" || user.role === "admin" || user.role === "staff");
  const canManage = !!user && (user.role === "super_admin" || user.role === "admin");

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [meta, setMeta] = useState<Paginated<Purchase>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [filters, setFilters] = useState<PurchaseFilters>({
    search: "",
    page: 1,
    per_page: PER_PAGE,
  });

  const [selected, setSelected] = useState<Purchase | null>(null);

  const addModal = useModal();
  const detailModal = useModal();
  const deleteModal = useModal();

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPurchases(filters);
      setPurchases(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(extractError(err, "Failed to load purchases."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, roomsRes] = await Promise.all([
          fetchCategories({ per_page: 100 }),
          fetchRooms({ per_page: 100 }),
        ]);
        if (cancelled) return;
        setCategories(cats.data.data);
        setRooms(roomsRes.data.data);
      } catch {
        // options are non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateFilter(key: keyof PurchaseFilters, value: string) {
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
    await loadPurchases();
  }

  async function handleSavePurchase(payload: FormState) {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: payload.name,
        category_id: payload.category_id || null,
        room_id: payload.room_id || null,
        amount: payload.amount,
        purchase_date: payload.purchase_date,
        supplier: payload.supplier,
        invoice_number: payload.invoice_number,
        notes: payload.notes || null,
      };
      if (payload.proof) {
        body.proof = payload.proof;
      }
      await createPurchase(body as Record<string, unknown> & { proof: File });
      showTempSuccess("Purchase recorded and asset created.");
      addModal.closeModal();
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to save purchase."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSubmitting("delete");
    setError(null);
    try {
      await deletePurchase(selected.id);
      deleteModal.closeModal();
      setSelected(null);
      showTempSuccess("Purchase record deleted.");
      await refresh();
    } catch (err) {
      setError(extractError(err, "Failed to delete purchase record."));
    } finally {
      setSubmitting(null);
    }
  }

  if (!canView) {
    return (
      <>
        <PageMeta title="Purchases | Access Denied" description="Purchase management" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            You do not have permission to view purchases.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Purchase Management"
        description="Record asset purchases and proof of transactions."
      />
      

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Purchase Management
          </h3>
          {canManage && (
            <Button onClick={addModal.openModal} startIcon={<PlusIcon />}>
              Record Purchase
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
              placeholder="Search by number, supplier, invoice, or asset..."
              className="lg:max-w-[300px]"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Purchase
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Supplier
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Asset
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Date
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Amount
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Proof
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
                {!loading && purchases.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-sm text-gray-500">
                      No purchases found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  purchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                            <DollarLineIcon />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {p.purchase_number}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {p.invoice_number}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {p.supplier}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {p.asset?.name || "-"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {p.asset?.asset_code || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {p.purchase_date || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        Rp {Number(p.amount).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        {p.proof_url ? (
                          <a
                            href={p.proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                          >
                            View file
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(p);
                              detailModal.openModal();
                            }}
                            startIcon={<EyeIcon />}
                          >
                            View
                          </Button>
                          {canManage && (
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
        <PurchaseModal
          isOpen={addModal.isOpen}
          onClose={addModal.closeModal}
          saving={saving}
          categories={categories}
          rooms={rooms}
          onSubmit={handleSavePurchase}
        />
      )}

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        purchase={selected}
      />

      {canManage && selected && (
        <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[450px] m-4">
          <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Delete Purchase Record
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete the purchase record{" "}
              <span className="font-medium text-gray-700 dark:text-white/90">
                {selected.purchase_number}
              </span>
              ? The associated asset and its proof file will be kept (only the
              history record is removed).
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

function PurchaseModal({
  isOpen,
  onClose,
  saving,
  categories,
  rooms,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  categories: Category[];
  rooms: Room[];
  onSubmit: (payload: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setFileError(null);
    }
  }, [isOpen]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setFileError(null);
    if (file) {
      const okType = /\.(jpg|jpeg|png|pdf)$/i.test(file.name);
      const okSize = file.size <= 5 * 1024 * 1024;
      if (!okType) {
        setFileError("Only JPG, PNG, or PDF files are allowed.");
        set("proof", null);
        return;
      }
      if (!okSize) {
        setFileError("Proof file must be 5MB or smaller.");
        set("proof", null);
        return;
      }
    }
    set("proof", file);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.supplier.trim() || !form.invoice_number.trim()) return;
    if (!form.amount || !form.purchase_date) return;
    if (!form.proof) {
      setFileError("Proof file (JPG/PNG/PDF) is required.");
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      supplier: form.supplier.trim(),
      invoice_number: form.invoice_number.trim(),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Record Purchase
        </h4>
        <p className="mb-6 mt-1 text-sm text-gray-500 dark:text-gray-400">
          Record a new asset purchase. A new asset entry with a generated code
          and IN_STORAGE status will be created automatically.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Asset Name</Label>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Monitor Samsung 24inch"
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
            <Label>Room / Location</Label>
            <Select
              options={rooms.map((r) => ({
                value: String(r.id),
                label: r.is_storage ? `${r.name} (storage)` : r.name,
              }))}
              placeholder="Select room"
              defaultValue={form.room_id}
              onChange={(v) => set("room_id", v)}
            />
          </div>
          <div>
            <Label>Amount (Rp)</Label>
            <Input
              type="number"
              min="0"
              step={0.01}
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="e.g. 2450000"
              required
            />
          </div>
          <div>
            <Label>Purchase Date</Label>
            <Input
              type="date"
              value={form.purchase_date}
              onChange={(e) => set("purchase_date", e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Supplier</Label>
            <Input
              type="text"
              value={form.supplier}
              onChange={(e) => set("supplier", e.target.value)}
              placeholder="e.g. PT Monitor Indo"
              required
            />
          </div>
          <div>
            <Label>Invoice Number</Label>
            <Input
              type="text"
              value={form.invoice_number}
              onChange={(e) => set("invoice_number", e.target.value)}
              placeholder="e.g. INV-2026/077"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Proof of Transaction</Label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFile}
              className="block w-full text-sm text-gray-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-600 hover:file:bg-brand-100 dark:file:bg-brand-500/15 dark:file:text-brand-400"
            />
            {fileError && (
              <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                {fileError}
              </p>
            )}
            {form.proof && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Selected: {form.proof.name} (
                {(form.proof.size / 1024).toFixed(0)} KB)
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
          <div className="sm:col-span-2 mt-2 flex items-center gap-3 justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving}>
              {saving ? "Saving..." : "Record Purchase"}
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
  purchase,
}: {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
}) {
  const [loaded, setLoaded] = useState<Purchase | null>(purchase);

  useEffect(() => {
    if (isOpen && purchase) {
      setLoaded(purchase);
      fetchPurchase(purchase.id)
        .then((res) => setLoaded(res.data.purchase))
        .catch(() => undefined);
    }
  }, [isOpen, purchase]);

  if (!purchase || !loaded) return null;
  const asset = loaded.asset;
  const isPdf =
    (loaded.proof_url || "").toLowerCase().endsWith(".pdf") ||
    (loaded.proof_path || "").toLowerCase().endsWith(".pdf");

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] m-4">
      <div className="no-scrollbar max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Purchase Details
        </h4>
        <div className="mt-4">
          <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {loaded.purchase_number}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge size="sm" variant="light" color="info">
              {loaded.invoice_number}
            </Badge>
            {asset && (
              <Badge size="sm" variant="light" color="dark">
                {asset.asset_code}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Supplier</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.supplier}
            </p>
          </div>
          <div>
            <Label>Purchase Date</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.purchase_date || "-"}
            </p>
          </div>
          <div>
            <Label>Amount</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              Rp {Number(loaded.amount).toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <Label>Asset Created</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {asset ? `${asset.name} (${asset.asset_code})` : "-"}
            </p>
          </div>
          <div>
            <Label>Asset Condition</Label>
            <Badge
              size="sm"
              variant="light"
              color={asset?.condition === "GOOD" ? "success" : "error"}
            >
              {asset?.condition || "-"}
            </Badge>
          </div>
          <div>
            <Label>Asset Usage Status</Label>
            <Badge
              size="sm"
              variant="light"
              color={asset?.usage_status === "IN_USE" ? "info" : "warning"}
            >
              {asset?.usage_status || "-"}
            </Badge>
          </div>
          {loaded.proof_url && (
            <div className="sm:col-span-2">
              <Label>Proof of Transaction</Label>
              {isPdf ? (
                <iframe
                  src={loaded.proof_url}
                  title="Proof"
                  className="mt-1 h-48 w-full rounded-lg border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <img
                  src={loaded.proof_url}
                  alt="Proof"
                  className="mt-1 h-40 w-full rounded-lg border border-gray-200 object-contain dark:border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <a
                href={loaded.proof_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Open proof file
              </a>
            </div>
          )}
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {loaded.notes || "-"}
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