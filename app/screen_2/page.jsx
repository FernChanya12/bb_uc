"use client";

import { useState, useEffect, useCallback } from "react";
import { FilterDrawer } from "../components/filter-slide";
import { SearchInput } from "../components/search-input";
import KebabMenu from "@/app/components/kebabMenu";
import Pagination from "@/app/components/pagination";
import Swal from "sweetalert2";

const BASE_URL = "http://localhost:3000/api";

const ApiService = {
  callData: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/ucItem?${query}`).then((r) => r.json());
  },
  createItem: (data) =>
    fetch(`${BASE_URL}/ucItem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  updateItem: (data) =>
    fetch(`${BASE_URL}/ucItem`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deleteItem: (uid) =>
    fetch(`${BASE_URL}/ucItem?UID=${uid}`, {
      method: "DELETE",
    }).then((r) => r.json()),
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
function ItemForm({ item, onChange, unitList }) {
  return (
    <>
      <label className="text-label">ชื่อแรงงาน</label>
      <input className="custom-input" type="text" value={item.item_name} placeholder="ชื่อแรงงาน" onChange={(e) => onChange({ ...item, item_name: e.target.value })} />

      <label className="text-label mt-3">หน่วยวัด</label>
      <select value={item.unitId} onChange={(e) => onChange({ ...item, unitId: e.target.value })}
        className="custom-input"
        placeholder="ค้นหา">
        <option value="">กรุณาเลือก</option>
        {unitList.map((unit) => (
          <option key={unit.value} value={unit.value}>
            {unit.label}
          </option>
        ))}
      </select>

    </>
  );
}

// ============================================================
// Main BudgetApp Component
// ============================================================
const EMPTY_ITEM = { item_name: "", item_code: "", fiscal: "2568", unitId: "", remark: "" };
const EMPTY_FILTERS = { item_name: "", item_code: "", unitId: "", itemStatus: "", searchText: "" };

export default function BudgetApp() {
  // Data
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unitList, setUnits] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);

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
      if (f.item_code) params.item_code = f.item_code;
      if (f.item_name) params.item_name = f.item_name;
      if (f.unitId) params.unitId = f.unitId;

      const res = await ApiService.callData(params);
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

  const loadUnitList = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/selectionUnit`, { method: "GET" });
      const data = await res.json();
      const rawUnits = Array.isArray(data)
        ? data
        : Array.isArray(data.units)
          ? data.units
          : [];
      setUnits(rawUnits.map((u) => ({ value: u.UID, label: u.unit_name })));
      if (data.materials) setMaterials(data.materials);
      if (data.laborTypes) setLaborTypes(data.laborTypes);
    } catch (err) {
      console.error("Error loading selections:", err);
    }
  }, []);

  useEffect(() => {
    loadData(EMPTY_FILTERS);
    loadUnitList();
  }, []);

  // ── Filter handlers ──────────────────────────────────────
  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
  };

  const searchFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    loadData(next)
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadData(EMPTY_FILTERS);
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
    setEditingUid(item.UID);
    setFormItem(item);
    setShowDialog(true);
  };

  const saveItem = async () => {
    if (!formItem.item_name) {
      Swal.fire("แจ้งเตือน", "กรุณากรอก ชื่อแรงงาน", "warning");
      return;
    }

    if (!formItem.unitId) {
      Swal.fire("แจ้งเตือน", "กรุณาเลือก หน่วยวัด", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "ยืนยันการบันทึก",
      text: "ต้องการบันทึกข้อมูลนี้หรือไม่?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        confirmButton: "sweet-confirm mr-2",
        cancelButton: "sweet-cancel",
      },
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        const res = isEditMode
          ? await ApiService.updateItem({ UID: editingUid, ...formItem })
          : await ApiService.createItem(formItem);

        if (res) {
          setShowDialog(false);
          Swal.fire("สำเร็จ!", "บันทึกข้อมูลสำเร็จ", "success");
          loadData(filters);
        } else {
          Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาด: " + res.error, "error");
        }
      } catch {
        Swal.fire("ผิดพลาด!", isEditMode ? "ไม่สามารถแก้ไขข้อมูลได้" : "ไม่สามารถบันทึกข้อมูลได้", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteSelected = async (uid) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: "ต้องการลบข้อมูลนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,  // ปิด style default ของ Swal
      customClass: {
        confirmButton: "sweet-confirm mr-2",
        cancelButton: "sweet-cancel",
      },
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        const res = await ApiService.deleteItem(uid);
        if (res) {
          Swal.fire("สำเร็จ!", "ลบข้อมูลสำเร็จ", "success");
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

  const changeItemsPerPage = (val) => {
    setItemsPerPage(val);
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

        <div className="text-black text-2xl font-medium mb-3">รายการ</div>

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
            onSearch={searchFilter}
            onClear={clearFilters}
          >
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">แรงงาน</label>
                <input type="text" value={filters.item_name}
                  onChange={(e) => handleFilterChange("item_name", e.target.value)}
                  className="custom-input"
                  placeholder="แรงงาน..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หน่วย</label>
                <select value={filters.unitId}
                  onChange={(e) => handleFilterChange("unitId", e.target.value)}
                  className="custom-input"
                  placeholder="ค้นหา">
                  <option value="">ทั้งหมด</option>
                  {unitList.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FilterDrawer>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="modern-table w-full text-black">
              <thead className="bg-gray-50/50">
                <tr>
                  {["", "No.", "รหัส", "ปี", "ประเภท", "รายการ", "สถานะ"].map((h) => (
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
                    <tr key={item.UID ?? idx}
                      className={`cursor-pointer transition-colors hover:bg-yellow-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td>
                        <KebabMenu
                          itemId={item.UID}
                          activeMenu={activeMenu}
                          setActiveMenu={setActiveMenu}
                        >
                          <button
                            className="kebab-menu-item w-full"
                            onClick={() => openEditDialog(item)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>แก้ไขรายการ</span>
                          </button>

                          <button
                            className="kebab-menu-item w-full text-red-500 hover:bg-red-50"
                            onClick={() => deleteSelected(item.UID)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash-fill" viewBox="0 0 16 16">
                              <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                            </svg>
                            <span>ลบรายการ</span>
                          </button>
                        </KebabMenu>
                      </td>
                      <td className="px-6 py-4 text-center align-middle text-sm text-gray-900 tabular-nums">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.item_code}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.fiscal}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.item_type}</td>
                      <td className="px-6 py-4 align-middle texst-sm text-gray-900">{item.item_name}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">
                        <div className={item.status === 'T' ? 'active-badge' : 'inactive-badge'}>
                          { item.status == 'T' ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            changeItemsPerPage={changeItemsPerPage}
            goToPage={goToPage}
          />
        </div>

        {/* Add/Edit Modal */}
        <Modal
          show={showDialog}
          onClose={() => setShowDialog(false)}
          title={isEditMode ? "แก้ไขแรงงาน" : "เพิ่มแรงงาน"}
          footer={
            <>
              <button type="button" onClick={() => setShowDialog(false)} style={{ width: "100px" }}
                className="button-primary-border">
                ยกเลิก
              </button>
              <button type="button" onClick={saveItem} style={{ width: "100px" }}
                className="button-primary">
                บันทึก
              </button>
            </>
          }
        >
          <ItemForm item={formItem} onChange={setFormItem} unitList={unitList} />
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