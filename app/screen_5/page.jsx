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
    return fetch(`${BASE_URL}/boqApproving?${query}`).then((r) => r.json());
  },
  getDetailByUid: (uid) => {
    return fetch(`${BASE_URL}/boqApproving/detail?${uid}`).then((r) => r.json());
  },
  createItem: (data) =>
    fetch(`${BASE_URL}/boqApproving`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  updateItem: (data) =>
    fetch(`${BASE_URL}/boqApproving`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deleteItem: (uid) =>
    fetch(`${BASE_URL}/boqApproving?UID=${uid}`, {
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

const IconFilter = () => (
  <svg
    width="1em" height="1em" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
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
// Main BudgetApp Component
// ============================================================
const EMPTY_ITEM = { header_name: "", header_code: "", fiscal: "2568", unitId: "", remark: "" };
const EMPTY_FILTERS = { header_name: "", header_code: "", unitId: "", itemStatus: "", searchText: "" };

export default function BudgetApp() {
  // Data
  const [items, setItems] = useState([]);
  const [itemsDetail, setItemsDetail] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unitList, setUnits] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);

  // Filters
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPageDetail, setCurrentPageDetail] = useState(1);
  const [itemsPerPageDetail, setItemsPerPageDetail] = useState(10);

  // Modal
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUid, setEditingUid] = useState(null);
  const [formItem, setFormItem] = useState(EMPTY_ITEM);
  const [showTable, setShowTable] = useState(true);
  const [showDetail, setShowDetail] = useState(false);


  // Derived
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pagedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  //DetailPaginator
  const totalItemsDetail = itemsDetail.length;
  const totalPagesDetail = Math.ceil(totalItemsDetail / itemsPerPageDetail);
  const pagedItemsDetail = itemsDetail.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [selectedUids, setSelectedUids] = useState([]);
  const allSelected = pagedItemsDetail.length > 0 && pagedItemsDetail.every(i => selectedUids.includes(i.UID));

  // ── Load Data ────────────────────────────────────────────
  const loadData = useCallback(async (f = filters) => {
    setIsLoading(true);
    try {
      const params = {};
      if (f.header_code) params.header_code = f.header_code;
      if (f.header_name) params.header_name = f.header_name;
      if (f.unitId) params.unitId = f.unitId;

      const res = await ApiService.callData(params);
      if (res) {
        setItems(res);
        setCurrentPage(1);
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

  const getDetail = useCallback(async (uid) => {
    setIsLoading(true);
    try {

      const res = await ApiService.getDetailByUid(uid);
      if (res) {
        setItemsDetail(res.boq_header);
        setCurrentPage(1);
        setShowTable(false);
        setShowDetail(true);
      } else {
        Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
      }
    } catch {
      Swal.fire("ผิดพลาด!", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      setIsLoading(false);
    }
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

  const handleCheckAll = () => {
    if (allSelected) {
      setSelectedUids([]);
    } else {
      setSelectedUids(pagedItemsDetail.map(i => i.UID));
    }
  };

  const handleCheck = (uid) => {
    setSelectedUids(prev =>
      prev.includes(uid)
        ? prev.filter(id => id !== uid)
        : [...prev, uid]
    );
  };

  const saveItem = async () => {
    if (!formItem.header_name) {
      Swal.fire("แจ้งเตือน", "กรุณากรอก ชื่อวัสดุ", "warning");
      return;
    }

    if (!formItem.unitId) {
      Swal.fire("แจ้งเตือน", "กรุณาเลือก UOM", "warning");
      return;
    }

    if (!formItem.header_code) {
      Swal.fire("แจ้งเตือน", "กรุณากรอก รหัสกระทรวงพาณิชย์", "warning");
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

  const statusConfig = {
    S: { label: 'รอพิจารณา', className: 'bg-blue-100 text-blue-600' },
    A: { label: 'อนุมัติ', className: 'bg-green-100 text-green-600' },
    R: { label: 'ส่งกลับแก้ไข', className: 'bg-yellow-100 text-yellow-600' },
    W: { label: 'รอรับทราบ', className: 'bg-gray-100 text-gray-500' },
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

  const backTotable = () => {
    setShowTable(true);
    setShowDetail(false);
  }

  // ── Status color ─────────────────────────────────────────
  const statusClass = (s) =>
    s === "active" ? "text-green-600" : s === "inactive" ? "text-gray-600" : "text-yellow-600";

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen center-template">
      <div className="container mx-auto px-6 py-6">

        <div className="text-black text-2xl font-medium mb-3">รายการพิจารณา</div>

        {/* Filter Section */}
        {showTable && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex justify-between gap-5">

            <SearchInput
              value={filters.searchText}
              onSearch={(val) => loadData(filters)}
              placeholder="ค้นหารายการ..."
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button
                className="button-primary">
                ส่งออกรายงาน
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">วัสดุ</label>
                  <input type="text" value={filters.header_name}
                    onChange={(e) => handleFilterChange("header_name", e.target.value)}
                    className="custom-input"
                    placeholder="วัสดุ..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">รหัสกระทรวงพาณิชย์</label>
                  <input type="text" value={filters.header_code}
                    onChange={(e) => handleFilterChange("header_code", e.target.value)}
                    className="custom-input"
                    placeholder="รหัสกระทรวงพาณิชย์" />
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
        )}

        {showDetail && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex justify-between gap-5">
            <button className="button-primary-border" onClick={() => backTotable()}>
              ย้อนกลับ
            </button>


            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button className="button-primary-border" style={{ width: "120px" }} onClick={() => setDrawerOpen(true)}>
                ส่งกลับแก้ไข
              </button>
              <button className="button-primary-border" style={{ width: "120px" }} onClick={() => setDrawerOpen(true)}>
                ไม่อนุมัติ
              </button>
              <button
                className="button-primary" style={{ width: "120px" }}>
                อนุมัติ
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        {showTable && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="modern-table w-full text-black">
                <thead className="bg-gray-50/50">
                  <tr>
                    {["", "เลขที่สัญญา", "ชื่อโครงการ", "สถานะ", "สถานะการอนุมัติ"].map((h) => (
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
                              onClick={() => getDetail(item.UID)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>แก้ไขรายการ</span>
                            </button>
                          </KebabMenu>
                        </td>
                        <td className="px-6 py-4 text-center align-middle text-sm text-gray-900 tabular-nums">
                          {item.report_id}
                        </td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">
                          <div>{item.boq_name}</div>
                          <div>{item.boq_detail}</div>
                        </td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">
                          <div className="grid place-content-center">
                            <div className="px-3 py-1 rounded-2xl text-center w-fit text-sm" style={{ backgroundColor: "#E7F7F1", color: "#5B975D" }}>{item.approveCount ?? "0"}/{item.count ?? "0"}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">
                          <div className="grid place-content-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[item.status]?.className ?? 'bg-gray-100 text-gray-400'}`}>
                              {statusConfig[item.status]?.label ?? '-'}
                            </span>
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
        )}

        {/* Detail */}
        {showDetail && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="modern-table w-full text-black">
                <thead className="bg-gray-50/50">
                  <tr>
                    {[<input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleCheckAll}
                    />, "No.", "ID", "ประเภทสิ่งก่อสร้าง", "ชื่อรายการ", "พื้นที่/ระยะทาง", "ค่าวัสดุ", "ค่าแรง", "ราคารวม", "แก้ไขโดย"].map((h) => (
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
                  ) : pagedItemsDetail.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">ไม่พบข้อมูล</td>
                    </tr>
                  ) : (
                    pagedItemsDetail.map((item, idx) => (
                      <tr key={item.UID ?? idx}
                        className={`cursor-pointer transition-colors hover:bg-yellow-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUids.includes(item.UID)}
                            onChange={() => handleCheck(item.UID)}
                          />
                        </td>
                        <td className="px-6 py-4 text-center align-middle text-sm text-gray-900 tabular-nums">
                          {(currentPageDetail - 1) * itemsPerPageDetail + idx + 1}
                        </td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.boq_type}</td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.status}</td>
                        <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.approveStatus}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPageDetail}
              totalPages={totalPagesDetail}
              totalItems={totalItemsDetail}
              itemsPerPage={itemsPerPageDetail}
              changeItemsPerPage={changeItemsPerPage}
              goToPage={goToPage}
            />
          </div>
        )}

      </div>
    </div>
  );
}