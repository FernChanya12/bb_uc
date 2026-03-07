"use client";

import { useState, useEffect, useCallback } from "react";
import { FilterDrawer } from "../component/filter-slide";
import { SearchInput } from "../component/search-input";

const BASE_URL = "http://localhost:3000/api";

const ApiService = {
  callScreen1: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/ucHeader?${query}`).then((r) => r.json());
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
// SweetAlert2 helper (ต้อง include script ใน index.html)
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

const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none"
    stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
  </svg>
);

const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none"
    stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
  </svg>
);

const IconFilter = () => (
  <svg
    width="1em" height="1em" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
);

const IconAdd = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// ============================================================
// Checkbox Component
// ============================================================
function Checkbox({ checked, onChange, indeterminate = false }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => { if (el) el.indeterminate = indeterminate; }}
      onChange={onChange}
      className="custom-checkbox"
      style={{
        appearance: "none",
        width: "1rem",
        height: "1rem",
        border: "1px solid #d1d5db",
        borderRadius: "0.25rem",
        backgroundColor: checked ? "rgb(37,99,235)" : "#f3f4f6",
        backgroundSize: "0.55em 0.55em",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        cursor: "pointer",
        backgroundImage: checked
          ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")`
          : "none",
      }}
    />
  );
}

// ============================================================
// Modal Component
// ============================================================
function Modal({ show, onClose, title, children, footer }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
              <IconX className="h-6 w-6" />
            </button>
          </div>
          <div className="px-6 py-6 space-y-6">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-start gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ItemForm Component
// ============================================================
function ItemForm({ item, onChange }) {
  const field = (name, label, type = "text", placeholder = "", required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={item[name] || ""}
        onChange={(e) => onChange({ ...item, [name]: type === "number" ? Number(e.target.value) : e.target.value })}
        placeholder={placeholder}
        className="custom-input"
      />
    </div>
  );

  return (
    <>
      {/* {field("workDetail", "รายละเอียดงาน", "text", "รายละเอียดงาน", true)}
      {field("fiscal", "ปีงบประมาณ", "text", "เช่น 2565")}
      {field("typeId", "รหัสประเภท", "number", "รหัสประเภท")} */}
      <label className="text-label">ชื่อวัสดุ</label>
      <input className="custom-input" type="text" value={item.name} placeholder="ชื่อวัสดุ" />

      <label className="text-label mt-3">UOM</label>
      <select value={item.unitId}
        className="custom-input"
        placeholder="กรุณาเลือก">
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="pending">Pending</option>
      </select>

      <label className="text-label mt-3">รหัสกระทรวงพาณิชย์</label>
      <input className="custom-input" type="text" value={item.gfmis} placeholder="รหัสกระทรวงพาณิชย์" />


    </>
  );
}

// ============================================================
// Main BudgetApp Component
// ============================================================
const EMPTY_ITEM = { workDetail: "", fiscal: "", typeId: null, remark: "" };
const EMPTY_FILTERS = { name: "", gfmis: "", unitId: "", itemStatus: "", searchText: "" };

export default function BudgetApp() {
  // Data
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selection
  const [selectedUids, setSelectedUids] = useState(new Set());

  // Filters
  const [filters, setFilters] = useState(EMPTY_FILTERS);

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
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pagedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const allSelected = items.length > 0 && selectedUids.size === items.length;
  const someSelected = selectedUids.size > 0 && !allSelected;

  // ── Load Data ────────────────────────────────────────────
  const loadData = useCallback(async (f = filters) => {
    setIsLoading(true);
    try {
      const params = {};
      if (f.gfmis) params.gfmis = f.gfmis;
      if (f.name) params.name = f.name;
      if (f.unitId) params.unitId = f.unitId;

      const res = await ApiService.callScreen1(params);
      if (res) {
        setItems(res);
        setCurrentPage(1);
        setSelectedUids(new Set());
      } else {
        Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
      }
    } catch {
      Swal.fire("ผิดพลาด!", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(EMPTY_FILTERS); }, []);

  // ── Filter handlers ──────────────────────────────────────
  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    loadData(next);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadData(EMPTY_FILTERS);
  };

  // ── Selection handlers ───────────────────────────────────
  const toggleSelectAll = () => {
    if (allSelected) setSelectedUids(new Set());
    else setSelectedUids(new Set(items.map((i) => i.uid)));
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
    setFormItem({ workDetail: item.workDetail || "", fiscal: item.fiscal || "", typeId: item.typeId || null, remark: item.remark || "" });
    setShowDialog(true);
  };

  const saveItem = async () => {
    if (!formItem.workDetail) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกรายละเอียดงาน", "warning");
      return;
    }
    setIsLoading(true);
    try {
      const res = isEditMode
        ? await ApiService.updateItem({ uid: editingUid, ...formItem })
        : await ApiService.createItem(formItem);

      if (res.success) {
        setShowSuccess(true);
        loadData(filters);
      } else {
        Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาด: " + res.error, "error");
      }
    } catch {
      Swal.fire("ผิดพลาด!", isEditMode ? "ไม่สามารถแก้ไขข้อมูลได้" : "ไม่สามารถบันทึกข้อมูลได้", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedUids.size === 0) {
      Swal.fire("แจ้งเตือน", "กรุณาเลือกรายการที่ต้องการลบ", "warning");
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
    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        const res = await ApiService.deleteItems([...selectedUids]);
        if (res.success) {
          Swal.fire("สำเร็จ!", "ลบข้อมูลทั้งหมดสำเร็จ", "success");
          setSelectedUids(new Set());
          loadData(filters);
        } else {
          Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาด: " + res.error, "error");
        }
      } catch {
        Swal.fire("ผิดพลาด!", "ไม่สามารถลบข้อมูลได้", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ── Pagination ───────────────────────────────────────────
  const goToPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  const handleItemsPerPage = (v) => {
    setItemsPerPage(Number(v));
    setCurrentPage(1);
  };

  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Status color ─────────────────────────────────────────
  const statusClass = (s) =>
    s === "active" ? "text-green-600" : s === "inactive" ? "text-gray-600" : "text-yellow-600";

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen center-template">
      <div className="container mx-auto px-6 py-6">

        <div className="text-black text-2xl font-medium mb-3">หัวข้อรายการ</div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex justify-between gap-5">

          <SearchInput
            value={filters.searchText}
            onSearch={(val) => loadData(filters)}
            placeholder="ค้นหารายการ..."
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button onClick={() => loadData(filters)}
              className="button-primary-border">
              <IconRefresh />Refresh
            </button>

            <button onClick={deleteSelected} disabled={selectedUids.size === 0}
              className="button-primary-border">
              <IconTrash />ลบที่เลือก ({selectedUids.size})
            </button>

            <button onClick={openNewDialog}
              className="button-primary">
              <IconAdd />เพิ่มข้อมูล
            </button>

            <button className="button-primary-border" onClick={() => setDrawerOpen(true)}>
              <IconFilter />
              ตัวกรอง
            </button>
          </div>

          <FilterDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onSearch={clearFilters}
            onClear={clearFilters}
          >
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วัสดุ</label>
                <input type="text" value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                  className="custom-input"
                  placeholder="วัสดุ..." />
              </div>

              {/* GFMIS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รหัสกระทรวงพาณิชย์</label>
                <input type="text" value={filters.gfmis}
                  onChange={(e) => handleFilterChange("gfmis", e.target.value)}
                  className="custom-input"
                  placeholder="รหัสกระทรวงพาณิชย์" />
              </div>

              {/* Item Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หน่วย</label>
                <select value={filters.unitId}
                  onChange={(e) => handleFilterChange("unitId", e.target.value)}
                  className="custom-input"
                  placeholder="ค้นหา">
                  <option value="">-- ทั้งหมด --</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </FilterDrawer>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sky-100 border-b border-gray-200">
                <tr>
                  {/* <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex justify-center">
                      <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} />
                    </div>
                  </th> */}
                  {["No.", "รหัส", "ปี", "ประเภท", "รายการ"].map((h) => (
                    <th key={h} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">กำลังโหลด...</td>
                  </tr>
                ) : pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">ไม่พบข้อมูล</td>
                  </tr>
                ) : (
                  pagedItems.map((item, idx) => (
                    <tr key={item.uid ?? idx}
                      className={`cursor-pointer transition-colors hover:bg-yellow-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      onDoubleClick={() => openEditDialog(item)}>
                      {/* <td className="px-6 py-4 align-middle" onClick={(e) => { e.stopPropagation(); toggleItem(item.uid); }}>
                        <div className="flex justify-center">
                          <Checkbox checked={selectedUids.has(item.uid)} onChange={() => toggleItem(item.uid)} />
                        </div>
                      </td> */}
                      <td className="px-6 py-4 text-center align-middle text-sm text-gray-900 tabular-nums">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.header_code}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.fiscal}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.header_type}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.header_name}</td>
                      {/* <td className={`px-6 py-4 align-middle text-sm ${statusClass(item.itemStatus)}`}>
                        {item.itemStatus}
                      </td> */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex w-36 md:w-40">
              <div className="relative w-full">
                <select value={itemsPerPage} onChange={(e) => handleItemsPerPage(e.target.value)}
                  className="block w-full appearance-none border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring-1 p-2 sm:text-xs rounded-lg pr-8"
                  style={{
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
            </div>

            <div className="text-sm text-slate-600">
              แสดง {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
            </div>

            <nav>
              <ul className="inline-flex items-center -space-x-px">
                <li>
                  <button type="button" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}
                    className="ml-0 rounded-l-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 inline-flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50">
                    <IconChevronLeft />Previous
                  </button>
                </li>
                <li>
                  <button type="button" disabled={currentPage === totalPages || totalPages === 0} onClick={() => goToPage(currentPage + 1)}
                    className="rounded-r-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 inline-flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50">
                    Next<IconChevronRight />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Add/Edit Modal */}
        <Modal
          show={showDialog}
          onClose={() => setShowDialog(false)}
          title={isEditMode ? "แก้ไขวัสดุ" : "เพิ่มวัสดุ"}
          footer={
            <>
              <button type="button" onClick={() => setShowDialog(false)} style={{width: "100px"}}
                className="button-primary-border">
                Cancel
              </button>
              <button type="button" onClick={saveItem} style={{width: "100px"}}
                className="button-primary">
                Save
              </button>
            </>
          }
        >
          <ItemForm item={formItem} onChange={setFormItem} />
        </Modal>

        {/* Success Modal */}
        <Modal show={showSuccess} onClose={() => { setShowSuccess(false); setShowDialog(false); }} title="">
          <div className="text-center py-2">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">บันทึกสำเร็จ</h3>
            <p className="text-gray-600 mb-6">ข้อมูลถูกบันทึกเรียบร้อยแล้ว</p>
            <button type="button" onClick={() => { setShowSuccess(false); setShowDialog(false); }}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              ตกลง
            </button>
          </div>
        </Modal>

      </div>
    </div>
  );
}