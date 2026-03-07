"use client";

import { useState, useEffect, useCallback } from "react";

const BASE_URL = "http://localhost:8080/api/screen2.php";

const ApiService = {
  callScreen2: (params) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return fetch(`${BASE_URL}?${query}`).then((r) => r.json());
  },
  createItem: (data) =>
    fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  updateItem: (data) =>
    fetch(BASE_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deleteItems: (uids) =>
    fetch(BASE_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uids }),
    }).then((r) => r.json()),
};

// ============================================================
// SweetAlert2 fallback
// ============================================================
const Swal =
  typeof window !== "undefined" && window.Swal
    ? window.Swal
    : {
        fire: ({ title, text, icon }) => {
          alert(`[${icon?.toUpperCase()}] ${title}\n${text || ""}`);
          return Promise.resolve({ isConfirmed: true });
        },
      };

// ============================================================
// Icons
// ============================================================
const IconX = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconRefresh = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconTrash = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconSearch = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// ============================================================
// Checkbox
// ============================================================
function Checkbox({ checked, onChange, indeterminate = false }) {
  const TICK = `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")`;
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => { if (el) el.indeterminate = indeterminate; }}
      onChange={onChange}
      style={{
        appearance: "none",
        width: "1rem", height: "1rem",
        border: "1px solid #d1d5db",
        borderRadius: "0.25rem",
        backgroundColor: checked ? "rgb(37,99,235)" : "#f3f4f6",
        backgroundSize: "0.55em 0.55em",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        cursor: "pointer",
        backgroundImage: checked ? TICK : "none",
        flexShrink: 0,
      }}
    />
  );
}

// ============================================================
// Modal
// ============================================================
function Modal({ show, onClose, title, children, footer }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
                <IconX className="h-6 w-6" />
              </button>
            </div>
          )}
          <div className="px-6 py-6 space-y-4">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-start gap-3">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Input / Textarea helpers (inline style แทน Tailwind focus:*)
// ============================================================
const inputCls = {
  base: "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm transition-shadow",
};

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      className={inputCls.base}
      style={{ outline: "none" }}
      onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgb(59,130,246)")}
      onBlur={(e) => (e.target.style.boxShadow = "none")}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={inputCls.base}
      style={{ outline: "none", resize: "vertical" }}
      onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgb(59,130,246)")}
      onBlur={(e) => (e.target.style.boxShadow = "none")}
    />
  );
}

function FilterInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
      style={{ outline: "none" }}
      onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgb(59,130,246)")}
      onBlur={(e) => (e.target.style.boxShadow = "none")}
    />
  );
}

function FilterSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
      style={{ outline: "none" }}
      onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgb(59,130,246)")}
      onBlur={(e) => (e.target.style.boxShadow = "none")}
    >
      {children}
    </select>
  );
}

// ============================================================
// Constants
// ============================================================
const EMPTY_FILTERS = { searchText: "", year: "", code: "", status: "" };
const EMPTY_ITEM = {
  uid: "", fiscal: "", itemDetail: "", typeId: "",
  unitId: "", price: 0, itemStatus: "T", uidUplevel: "",
};

// ============================================================
// Main Component
// ============================================================
export default function BudgetApp2() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedUids, setSelectedUids] = useState(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal
  const [showDialog, setShowDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUid, setEditingUid] = useState(null);
  const [formItem, setFormItem] = useState(EMPTY_ITEM);

  // Derived
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const pagedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const allSelected = items.length > 0 && selectedUids.size === items.length;
  const someSelected = selectedUids.size > 0 && !allSelected;

  // ── Load data ────────────────────────────────────────────
  const loadData = useCallback(async (f = filters) => {
    setIsLoading(true);
    try {
      const params = {
        ...(f.searchText && { searchText: f.searchText }),
        ...(f.year      && { fiscal:     f.year }),
        ...(f.code      && { code:        f.code }),
        ...(f.status    && { status:      f.status }),
      };
      const res = await ApiService.callScreen2(params);
      if (res.success) {
        setItems(res.data ?? []);
        setCurrentPage(1);
        setSelectedUids(new Set());
      } else {
        Swal.fire({ title: "ผิดพลาด!", text: "เกิดข้อผิดพลาดในการโหลดข้อมูล", icon: "error" });
      }
    } catch {
      Swal.fire({ title: "ผิดพลาด!", text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", icon: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(EMPTY_FILTERS); }, []);

  // ── Filter ───────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    loadData(next);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadData(EMPTY_FILTERS);
  };

  // ── Selection ────────────────────────────────────────────
  const toggleSelectAll = () => {
    setSelectedUids(allSelected ? new Set() : new Set(items.map((i) => i.uid)));
  };
  const toggleItem = (uid) => {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  // ── CRUD ─────────────────────────────────────────────────
  const openNewDialog = () => {
    setIsEditMode(false);
    setEditingUid(null);
    setFormItem(EMPTY_ITEM);
    setShowDialog(true);
  };

  const openEditDialog = (item) => {
    setIsEditMode(true);
    setEditingUid(item.uid);
    setFormItem({
      uid: item.uid ?? "",
      fiscal: item.fiscal ?? "",
      itemDetail: item.itemDetail ?? "",
      typeId: item.typeId ?? "",
      unitId: item.unitId ?? "",
      price: item.price ?? 0,
      itemStatus: item.itemStatus ?? "T",
      uidUplevel: item.uidUplevel ?? "",
    });
    setShowDialog(true);
  };

  const saveItem = async () => {
    if (!formItem.fiscal || !formItem.itemDetail) {
      Swal.fire({ title: "แจ้งเตือน", text: "กรุณากรอกปีและรายละเอียด", icon: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const payload = isEditMode ? { ...formItem, uid: editingUid } : formItem;
      const res = isEditMode
        ? await ApiService.updateItem(payload)
        : await ApiService.createItem(payload);

      if (res.success) {
        setShowSuccess(true);
        loadData(filters);
      } else {
        Swal.fire({ title: "ผิดพลาด!", text: "เกิดข้อผิดพลาด: " + res.error, icon: "error" });
      }
    } catch {
      Swal.fire({ title: "ผิดพลาด!", text: isEditMode ? "ไม่สามารถแก้ไขข้อมูลได้" : "ไม่สามารถบันทึกข้อมูลได้", icon: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedUids.size === 0) {
      Swal.fire({ title: "แจ้งเตือน", text: "กรุณาเลือกรายการที่ต้องการลบ", icon: "warning" });
      return;
    }
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: `ต้องการลบรายการที่เลือกทั้งหมด ${selectedUids.size} รายการ หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบทั้งหมด",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const res = await ApiService.deleteItems([...selectedUids]);
      if (res.success) {
        Swal.fire({ title: "สำเร็จ!", text: "ลบข้อมูลทั้งหมดสำเร็จ", icon: "success" });
        setSelectedUids(new Set());
        loadData(filters);
      } else {
        Swal.fire({ title: "ผิดพลาด!", text: "เกิดข้อผิดพลาด: " + res.error, icon: "error" });
      }
    } catch {
      Swal.fire({ title: "ผิดพลาด!", text: "ไม่สามารถลบข้อมูลได้", icon: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Pagination ───────────────────────────────────────────
  const goToPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };
  const handleItemsPerPage = (v) => { setItemsPerPage(Number(v)); setCurrentPage(1); };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-6">

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4 mb-4 flex-wrap">

            {/* Search */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-gray-700 text-sm font-medium mb-2">ค้นหา</label>
              <div className="relative">
                <FilterInput
                  value={filters.searchText}
                  onChange={(e) => handleFilterChange("searchText", e.target.value)}
                  placeholder="ค้นหา..."
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <IconSearch />
                </span>
              </div>
            </div>

            {/* Year */}
            <div className="flex-1 min-w-[120px]">
              <label className="block text-gray-700 text-sm font-medium mb-2">ปี</label>
              <FilterInput
                value={filters.year}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                placeholder="เช่น 2565"
              />
            </div>

            {/* Code */}
            <div className="flex-1 min-w-[120px]">
              <label className="block text-gray-700 text-sm font-medium mb-2">รหัส</label>
              <FilterInput
                value={filters.code}
                onChange={(e) => handleFilterChange("code", e.target.value)}
                placeholder="เช่น B00001"
              />
            </div>

            {/* Status */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-gray-700 text-sm font-medium mb-2">สถานะ</label>
              <FilterSelect
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">-- ทั้งหมด --</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </FilterSelect>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-sm">
              <IconX /><span>Clear</span>
            </button>
            <button onClick={() => loadData(filters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-sm">
              <IconRefresh /><span>Refresh</span>
            </button>
            <button onClick={deleteSelected} disabled={selectedUids.size === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-sm text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
              <IconTrash /><span>ลบที่เลือก ({selectedUids.size})</span>
            </button>
            <button onClick={openNewDialog}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm">
              <span className="text-xl font-light leading-none">+</span><span>New</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sky-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                    <div className="flex justify-center">
                      <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} />
                    </div>
                  </th>
                  {["#", "ปี", "รายการ"].map((h) => (
                    <th key={h} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">กำลังโหลด...</td>
                  </tr>
                ) : pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">ไม่พบข้อมูล</td>
                  </tr>
                ) : (
                  pagedItems.map((item, idx) => (
                    <tr key={item.uid ?? idx}
                      className={`cursor-pointer transition-colors hover:bg-yellow-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      onDoubleClick={() => openEditDialog(item)}>
                      <td className="px-6 py-4 align-middle"
                        onClick={(e) => { e.stopPropagation(); toggleItem(item.uid); }}>
                        <div className="flex justify-center">
                          <Checkbox checked={selectedUids.has(item.uid)} onChange={() => toggleItem(item.uid)} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center align-middle text-sm text-gray-900 tabular-nums">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.fiscal}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.itemDetail}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="w-36 md:w-40">
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPage(e.target.value)}
                className="block w-full appearance-none border border-gray-300 bg-gray-50 text-gray-900 p-2 text-xs rounded-lg pr-8"
                style={{
                  outline: "none",
                  backgroundImage: `linear-gradient(to right, #d1d5db 1px, transparent 1px), url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 2rem center, right 0.5rem center",
                  backgroundRepeat: "no-repeat, no-repeat",
                  backgroundSize: "1px 60%, 1.5em 1.5em",
                }}>
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} / หน้า</option>
                ))}
              </select>
            </div>

            <div className="text-sm text-slate-600">
              แสดง {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
              –{Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
            </div>

            <nav>
              <ul className="inline-flex items-center -space-x-px">
                <li>
                  <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}
                    className="rounded-l-lg border border-gray-300 bg-white px-3 py-2 text-gray-500 hover:bg-gray-100 inline-flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                </li>
                <li>
                  <button disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}
                    className="rounded-r-lg border border-gray-300 bg-white px-3 py-2 text-gray-500 hover:bg-gray-100 inline-flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    Next
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                    </svg>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Add / Edit Modal */}
        <Modal
          show={showDialog}
          onClose={() => setShowDialog(false)}
          title={isEditMode ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
          footer={
            <>
              <button type="button" onClick={() => setShowDialog(false)}
                className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                Cancel
              </button>
              <button type="button" onClick={saveItem}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                ตกลง
              </button>
            </>
          }
        >
          <Field label="ปี (Fiscal)" required>
            <TextInput value={formItem.fiscal} placeholder="เช่น 2565"
              onChange={(e) => setFormItem({ ...formItem, fiscal: e.target.value })} />
          </Field>
          <Field label="รายละเอียด (Item Detail)" required>
            <TextArea value={formItem.itemDetail} placeholder="รายละเอียดรายการ"
              onChange={(e) => setFormItem({ ...formItem, itemDetail: e.target.value })} />
          </Field>
          <Field label="ประเภท (Type ID)">
            <TextInput value={formItem.typeId} placeholder="รหัสประเภท"
              onChange={(e) => setFormItem({ ...formItem, typeId: e.target.value })} />
          </Field>
          <Field label="หน่วย (Unit ID)">
            <TextInput value={formItem.unitId} placeholder="รหัสหน่วย"
              onChange={(e) => setFormItem({ ...formItem, unitId: e.target.value })} />
          </Field>
          <Field label="ราคา (Price)">
            <TextInput type="number" value={formItem.price} placeholder="0"
              onChange={(e) => setFormItem({ ...formItem, price: Number(e.target.value) })} />
          </Field>
          <Field label="รหัสอ้างอิง (UID Uplevel)">
            <TextInput value={formItem.uidUplevel} placeholder="รหัสอ้างอิง"
              onChange={(e) => setFormItem({ ...formItem, uidUplevel: e.target.value })} />
          </Field>
        </Modal>

        {/* Success Modal */}
        <Modal show={showSuccess} onClose={() => { setShowSuccess(false); setShowDialog(false); }}>
          <div className="text-center py-2">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              onClick={() => { setShowSuccess(false); setShowDialog(false); }}>
              <IconX className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">บันทึกสำเร็จ</h3>
            <p className="text-gray-600 mb-6">ข้อมูลถูกบันทึกเรียบร้อยแล้ว</p>
            <button onClick={() => { setShowSuccess(false); setShowDialog(false); }}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              ตกลง
            </button>
          </div>
        </Modal>

      </div>
    </div>
  );
}