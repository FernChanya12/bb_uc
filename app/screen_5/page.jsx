"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  aprove: (data) =>
    fetch(`${BASE_URL}/boqApproving/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boq_uid: data.selectedUids,
        created_by: 'admin',
      }),
    }).then((r) => r.json()),
  reject: (data) =>
    fetch(`${BASE_URL}/boqApproving/inapprove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boq_uid: data.selectedUids,
        reason: data.remark,
        created_by: 'admin',
      }),
    }).then((r) => r.json()),
  sendback: (data) =>
    fetch(`${BASE_URL}/boqApproving/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boq_uid: data.selectedUids,
        reason: data.remark,
        created_by: 'admin',
      }),
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
  const initialConstructionGroups = [
    {
      id: "g1",
      name: "aaaa",
      expanded: true,
      items: [
        { id: "i1", code: "00-000-00-001", name: "งานปรับพื้น-1", quantity: 10, unit: "บาท/ตัวอย่าง", materialPricePerUnit: 100.0, materialTotal: 1000.0, laborPricePerUnit: 0.0, laborTotal: 0.0 },
        { id: "i2", code: "00-000-00-002", name: "งานปรับพื้น#2", quantity: 10, unit: "บาท/ตัวอย่าง", materialPricePerUnit: 100.0, materialTotal: 1000.0, laborPricePerUnit: 50.0, laborTotal: 500.0 },
        { id: "i3", code: "Test1234", name: "Meosfa123Meosfa123M", quantity: 2, unit: "บาท/ตัวอย่าง", materialPricePerUnit: 500.0, materialTotal: 1000.0, laborPricePerUnit: 0.0, laborTotal: 0.0 },
      ],
      subGroups: [],
    },
    {
      id: "g2",
      name: "bbb",
      expanded: true,
      items: [
        { id: "i4", code: "00-000-00-001", name: "งานปรับพื้น-1", quantity: 2, unit: "บาท/ตัวอย่าง", materialPricePerUnit: 100.0, materialTotal: 200.0, laborPricePerUnit: 0.0, laborTotal: 0.0 },
        { id: "i5", code: "00-000-00-002", name: "งานปรับพื้น#2", quantity: 9000, unit: "บาท/ตัวอย่าง", materialPricePerUnit: 100.0, materialTotal: 900000.0, laborPricePerUnit: 50.0, laborTotal: 450000.0 },
        { id: "i6", code: "codex", name: "test", quantity: 0, unit: "บาท/ตัวอย่าง", materialPricePerUnit: 20.0, materialTotal: 0.0, laborPricePerUnit: 0.0, laborTotal: 0.0 },
      ],
      subGroups: [],
    },
  ];
  // Data
  const [items, setItems] = useState([]);
  const [itemsDetail, setItemsDetail] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unitList, setUnits] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [constructionName, setConstructionName] = useState("");
  const [boqForm, setBoqForm] = useState({ boq_name: "", boq_detail: "", boq_group: "", status: "T", remark: "" });
  const [constructionGroups, setConstructionGroups] = useState(initialConstructionGroups);
  const [rootItems, setRootItems] = useState([]);
  const [selectedTreeNode, setSelectedTreeNode] = useState(null);
  const [addChoiceGroupId, setAddChoiceGroupId] = useState(null);
  const [editingBoqUid, setEditingBoqUid] = useState(null);
  const [showConstructionPopup, setShowConstructionPopup] = useState(false);
  const [boqGroups, setBoqGroups] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);

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
  const selectedGroup = selectedTreeNode ? findGroupById(constructionGroups, selectedTreeNode) : null;
  const displayGroups = selectedGroup ? [selectedGroup] : constructionGroups;
  const flattenGroupItems = (groups) =>
    groups.flatMap((g) => [...g.items, ...flattenGroupItems(g.subGroups || [])]);
  const allConstructionItems = [...rootItems, ...flattenGroupItems(constructionGroups)];
  const totalMaterialSum = allConstructionItems.reduce(
    (s, i) => s + (parseFloat(i.materialPricePerUnit) || 0),
    0
  );
  const totalLaborSum = allConstructionItems.reduce(
    (s, i) => s + (parseFloat(i.laborTotal) || 0),
    0
  );

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
        setItemsDetail(res.boq_item);
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

  const toggleDropdown = useCallback(
    (name) => setOpenDropdown((prev) => (prev === name ? null : name)),
    []
  );

  const onApprove = async () => {
    if (selectedUids.length === 0) {
      Swal.fire('แจ้งเตือน', 'กรุณาเลือกรายการ', 'warning');
      return;
    }
    const result = await Swal.fire({
      title: "ยืนยันการอนุมัติ",
      text: "ต้องการอนุมัติข้อมูลนี้หรือไม่?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
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
        const param = {
          selectedUids: selectedUids,
        }
        const res = await ApiService.aprove(param);
        if (res) {
          Swal.fire("สำเร็จ!", "อนุมัติข้อมูลสำเร็จ", "success");
          setSelectedUids([]);
          getDetail();
        } else {
          Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาด: " + res.error, "error");
        }
      } catch {
        Swal.fire("ผิดพลาด!", "ไม่สามารถอนุมัติข้อมูลได้", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const onReject = async () => {
    if (selectedUids.length === 0) {
      Swal.fire('แจ้งเตือน', 'กรุณาเลือกรายการ', 'warning');
      return;
    }

    const { value, isConfirmed } = await Swal.fire({
      title: 'ไม่อนุมัติ',
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'ระบุเหตุผล',
      inputPlaceholder: 'ระบุเหตุผล',
      inputAttributes: { required: true },
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      buttonsStyling: false,
      customClass: {
        confirmButton: "sweet-confirm mr-2",
        cancelButton: "sweet-cancel",
        inputLabel: 'sweet-input-label',
      },
      preConfirm: (val) => {
        if (!val) Swal.showValidationMessage('กรุณาระบุเหตุผล');
        return val;
      },
    });

    if (isConfirmed && value) {
      setIsLoading(true);
      try {
        const param = {
          selectedUids: selectedUids,
          remark: value
        }
        const res = await ApiService.reject(param);
        if (res) {
          Swal.fire("สำเร็จ!", "ไม่อนุมัติข้อมูลสำเร็จ", "success");
          setSelectedUids([]);
          getDetail();
        } else {
          Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาด: " + res.error, "error");
        }
      } catch {
        Swal.fire("ผิดพลาด!", "ไม่สามารถไม่อนุมัติข้อมูลได้", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const onSendBack = async () => {
    if (selectedUids.length === 0) {
      Swal.fire('แจ้งเตือน', 'กรุณาเลือกรายการ', 'warning');
      return;
    }

    const { value, isConfirmed } = await Swal.fire({
      title: 'ส่งกลับแก้ไข',
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'ระบุเหตุผล',
      inputPlaceholder: 'ระบุเหตุผล',
      inputAttributes: { required: true },
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      buttonsStyling: false,
      customClass: {
        confirmButton: "sweet-confirm mr-2",
        cancelButton: "sweet-cancel",
        inputLabel: 'sweet-input-label',
      },
      preConfirm: (val) => {
        if (!val) Swal.showValidationMessage('กรุณาระบุเหตุผล');
        return val;
      },
    });

    if (isConfirmed && value) {
      setIsLoading(true);
      try {
        const param = {
          selectedUids: selectedUids,
          remark: value
        }
        const res = await ApiService.sendback(param);
        if (res) {
          Swal.fire("สำเร็จ!", "ส่งกลับแก้ไขข้อมูลสำเร็จ", "success");
          setSelectedUids([]);
          getDetail();
        } else {
          Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาด: " + res.error, "error");
        }
      } catch {
        Swal.fire("ผิดพลาด!", "ไม่สามารถส่งกลับแก้ไขข้อมูลได้", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const statusConfig = {
    S: { label: 'ยืนยันทำเล่มเอกสาร', className: 'bg-blue-100 text-blue-600' },
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
    loadData();
    setShowTable(true);
    setShowDetail(false);
  }

  const handleEdit = async (uid) => {
    setActiveMenu(null);
    try {
      // const res = await fetch(`${BASE_URL}/boqDetail?boq_uid=${uid}`);
      // if (!res.ok) {
      //   alert("ไม่พบข้อมูล BOQ");
      //   return;
      // }
      // const json = await res.json();
      // const b = json.boq || {};
      // setConstructionName(b.boq_name || "");
      // setBoqForm({
      //   boq_name: b.boq_name || "",
      //   boq_detail: b.boq_detail || "",
      //   boq_group: b.boq_group || "",
      //   status: b.status || "T",
      //   remark: b.remark || "",
      // });
      // setEditingBoqUid(uid);
      // setConstructionGroups(convertApiTree(json.tree || []));
      // setSelectedTreeNode(null);
      setShowConstructionPopup(true);
    } catch (err) {
      console.error("Error loading BOQ detail:", err);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
  };

  // ── Status color ─────────────────────────────────────────
  const statusClass = (s) =>
    s === "active" ? "text-green-600" : s === "inactive" ? "text-gray-600" : "text-yellow-600";

  const formatNumber = (n) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function CustomDropdown({ options, value, placeholder, isOpen, onToggle, onSelect }) {
    const ref = useRef(null);


    useEffect(() => {
      function handleClickOutside(e) {
        if (ref.current && !ref.current.contains(e.target)) {
          if (isOpen) onToggle();
        }
      }
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, [isOpen, onToggle]);

    const selectedLabel = options.find((o) => o.value === value)?.label;

    return (
      <div ref={ref} className="custom-dropdown relative">
        <div className="custom-dropdown-trigger" onClick={onToggle}>
          {selectedLabel ? (
            <span>{selectedLabel}</span>
          ) : (
            <span>{placeholder}</span>
          )}
          <div className="custom-dropdown-icon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {isOpen && (
          <div className="custom-dropdown-menu" style={{ display: "block" }}>
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`custom-dropdown-option${value === opt.value ? " selected" : ""}`}
                onClick={() => onSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const updateItemQuantity = (groupId, itemId, quantity) => {
    if (groupId === "__root__") {
      setRootItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            quantity,
            materialTotal: quantity * item.materialPricePerUnit,
            laborTotal: quantity * item.laborPricePerUnit,
          };
        })
      );
      return;
    }
    const update = (groups) =>
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            items: g.items.map((item) => {
              if (item.id !== itemId) return item;
              return {
                ...item,
                quantity,
                materialTotal: quantity * item.materialPricePerUnit,
                laborTotal: quantity * item.laborPricePerUnit,
              };
            }),
          };
        }
        return { ...g, subGroups: update(g.subGroups || []) };
      });
    setConstructionGroups((prev) => update(prev));
  };

  const closeConstructionPopup = () => setShowConstructionPopup(false);

  /* ───────────── Tree group renderer (recursive) ───────────── */
  const renderGroup = (group, depth = 0) => (
    <div key={group.id} className="mb-1" style={{ marginLeft: `${(depth + 1) * 16}px` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 py-0.5">
          <svg
            className={`w-3 h-3  transition-transform cursor-pointer shrink-0 ${group.expanded ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            onClick={() => toggleGroup(group.id)}
          ><path d="M6 4l8 6-8 6V4z" /></svg>
          <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
          <span
            className={`text-sm cursor-pointer hover:text-blue-600 ${selectedTreeNode === group.id ? "text-blue-700 font-medium" : "text-gray-700"}`}
            onClick={() => setSelectedTreeNode(group.id)}
          >{group.name}</span>
        </div>
        <button className=" hover:text-blue-600 p-0.5" onClick={() => addItemToGroup(group.id)} title="เพิ่มรายการ/กลุ่มย่อย">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
      {group.expanded && (
        <div>
          {(group.subGroups || []).map((sg) => renderGroup(sg, depth + 1))}
          <div className="ml-5">
            {group.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-1 py-0.5 cursor-pointer text-sm hover:text-blue-600 ${selectedTreeNode === item.id ? "text-blue-700 font-medium" : "text-gray-600"}`}
                onClick={() => setSelectedTreeNode(item.id)}
              >
                <svg className="w-4 h-4 " fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      <style jsx global>{`
        .custom-dropdown {
          position: relative;
          font-family: 'Prompt', sans-serif;
        }
        .custom-dropdown-trigger {
          width: 100%;
          padding: 0.625rem 2.5rem 0.625rem 1rem;
          margin-right: 10px;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background-color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .custom-dropdown-trigger:hover {
          border-color: #9ca3af;
        }
        .custom-dropdown-trigger:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .custom-dropdown-icon {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .custom-dropdown-icon::before {
          content: "";
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 1px;
          background-color: #d1d5db;
        }
        .custom-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background-color: white;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
          z-index: 50;
          max-height: 240px;
          overflow-y: auto;
        }
        .custom-dropdown-option {
          padding: 0.625rem 1rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: #374151;
          transition: background-color 0.15s;
        }
        .custom-dropdown-option:hover {
          background-color: #e0f2fe;
        }
        .custom-dropdown-option:first-child {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        .custom-dropdown-option:last-child {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .custom-dropdown-option.selected {
          background-color: #dbeafe;
          font-weight: 500;
        }
        .custom-checkbox {
          appearance: none;
          width: 1rem;
          height: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          background-color: #f3f4f6;
          background-size: 0.55em 0.55em;
          background-position: center;
          background-repeat: no-repeat;
          cursor: pointer;
        }
        .custom-checkbox:checked {
          border-color: transparent;
          background-color: rgb(37, 99, 235);
          background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
        }
        .custom-checkbox:focus {
          outline: none;
        }
      `}</style>
      <div className="bg-gray-50 min-h-screen center-template">
        <div className="container mx-auto px-6 py-6">


          {/* Filter Section */}
          {showTable && (
            <div>
              <div className="text-black text-2xl font-medium mb-3">รายการพิจารณา</div>

              <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex justify-between gap-5">

                <SearchInput
                  value={filters.searchText}
                  onSearch={(val) => loadData(filters)}
                  placeholder="ค้นหารายการ..."
                />

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4">
                  {/* <button
                className="button-primary">
                ส่งออกรายงาน
              </button> */}

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
                      <label className="block text-sm font-medium text-gray-700 mb-2">สถานะการอนุมัติ</label>
                      <select value={filters.status}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        className="custom-input"
                        placeholder="ค้นหา">
                        <option value="">ทั้งหมด</option>
                        <option value="S">ยืนยันทำเล่มเอกสาร</option>
                        <option value="A">อนุมัติ</option>
                        <option value="R">ส่งกลับแก้ไข</option>
                        <option value="W">รอรับทราบ</option>
                      </select>
                    </div>
                  </div>
                </FilterDrawer>
              </div>
            </div>
          )}

          {showDetail && (
            <div>
              <div className="text-black text-2xl font-medium mb-3">รายการอัตราราคาต่อหน่วย</div>

              <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex justify-between gap-5">
                <button className="button-primary-border" onClick={() => backTotable()}>
                  ย้อนกลับ
                </button>


                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4">
                  <button className="button-primary-border" style={{ width: "120px" }} onClick={() => onSendBack(true)}>
                    ส่งกลับแก้ไข
                  </button>
                  <button className="button-primary-border" style={{ width: "120px" }} onClick={() => onReject(true)}>
                    ไม่อนุมัติ
                  </button>
                  <button
                    className="button-primary" style={{ width: "120px" }} onClick={() => onApprove(true)}>
                    อนุมัติ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          {showTable && (
            <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="modern-table w-full text-black">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="w-10"></th>
                      <th className="w-10">เลขที่สัญญา</th>
                      <th className="w-80">ชื่อโครงการ</th>
                      <th className="w-30">สถานะ</th>
                      <th className="w-30">สถานะการอนุมัติ</th>
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
            <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="modern-table w-full text-black">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="w-10"></th>
                      <th className="w-10">
                        <input className="custom-checkbox"
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleCheckAll}
                        />
                      </th>
                      <th className="w-10">ลำดับ</th>
                      <th className="w-30">รหัสรายการ</th>
                      <th className="w-80">รายการ</th>
                      <th className="w-30">ปีงบประมาณ</th>
                      <th className="w-30">หน่วยนับ</th>
                      <th className="w-30">ราคาต่อหน่วย</th>
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
                            <KebabMenu
                              itemId={item.UID}
                              activeMenu={activeMenu}
                              setActiveMenu={setActiveMenu}
                            >
                              <button
                                className="kebab-menu-item w-full"
                                onClick={() => handleEdit(item.UID)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                <span>แก้ไขเล่มเอกสาร</span>
                              </button>
                            </KebabMenu>
                          </td>
                          <td>
                            <div className="grid place-content-center">
                              <input className="custom-checkbox"
                                type="checkbox" disabled={item.status != "S"}
                                checked={selectedUids.includes(item.UID)}
                                onChange={() => handleCheck(item.UID)}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center align-middle text-sm text-gray-900 tabular-nums">
                            {(currentPageDetail - 1) * itemsPerPageDetail + idx + 1}
                          </td>
                          <td className="px-6 py-4 align-middle text-sm text-gray-900 text-center">{item.item_code}</td>
                          <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.remark}</td>
                          <td className="px-6 py-4 align-middle text-sm text-gray-900 text-center">{item.fiscal}</td>
                          <td className="px-6 py-4 align-middle text-sm text-gray-900">{item.unit}</td>
                          <td className="px-6 py-4 align-middle text-sm text-gray-900 text-center">{item.price}</td>
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

          {/* ═══════ Construction Popup ═══════ */}
          {showConstructionPopup && (
            <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={closeConstructionPopup} />
              <div className="fixed inset-4 md:inset-8 flex flex-col bg-white rounded-lg shadow-xl z-10 overflow-hidden">

                {/* BOQ Info Header */}
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      {editingBoqUid ? "แก้ไขรายการ BOQ" : "สร้างรายการ BOQ ใหม่"}
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600 p-1" onClick={closeConstructionPopup}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className="text-label">ชื่อ BOQ</label>
                      <input
                        type="text"
                        className="custom-input"
                        placeholder="ชื่อ BOQ..."
                        value={boqForm.boq_name}
                        onChange={(e) => setBoqForm(f => ({ ...f, boq_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-label">รายละเอียด</label>
                      <input
                        type="text"
                        className="custom-input"
                        placeholder="รายละเอียด..."
                        value={boqForm.boq_detail}
                        onChange={(e) => setBoqForm(f => ({ ...f, boq_detail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-label">กลุ่ม BOQ</label>
                      <CustomDropdown
                        options={boqGroups}
                        value={boqForm.boq_group}
                        placeholder="เลือกกลุ่ม..."
                        isOpen={openDropdown === "boqGroup"}
                        onToggle={() => toggleDropdown("boqGroup")}
                        onSelect={(v) => {
                          setBoqForm(f => ({ ...f, boq_group: v }));
                          setOpenDropdown(null);
                        }}
                      />
                    </div>
                    <div className="col-span-5">
                      <label className="text-label">หมายเหตุ</label>
                      <textarea
                        className="custom-input"
                        style={{ height: "auto", resize: "none" }}
                        placeholder="หมายเหตุ..."
                        rows={3}
                        value={boqForm.remark}
                        onChange={(e) => setBoqForm(f => ({ ...f, remark: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Body: left tree + right table */}
                <div className="flex flex-1 overflow-hidden">
                  {/* ── Left Tree Panel ── */}
                  <div className="w-[340px] shrink-0 border-r border-gray-200 overflow-y-auto bg-white p-4">
                    {/* Root node */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSelectedTreeNode(null)}>
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                        <span className="text-sm font-medium text-blue-700">{constructionName}</span>
                      </div>
                      <button className=" hover:text-blue-600 p-0.5" onClick={() => setAddChoiceGroupId("__root__")} title="เพิ่มกลุ่ม/รายการ">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>

                    {/* Root items */}
                    {rootItems.length > 0 && (
                      <div className="ml-5">
                        {rootItems.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-1 py-0.5 cursor-pointer text-sm hover:text-blue-600 ${selectedTreeNode === item.id ? "text-blue-700 font-medium" : "text-gray-600"}`}
                            onClick={() => setSelectedTreeNode(item.id)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {item.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Groups */}
                    {constructionGroups.map((group) => renderGroup(group, 0))}

                    <p className="mt-6 text-xs leading-relaxed">
                      คลิกที่รายชื่อเพื่อดูรายละเอียด &gt; ปุ่มบวก (+) มีเฉพาะ &quot;กลุ่ม&quot; &gt; Work Item จะไม่มีปุ่มบวก
                    </p>
                  </div>

                  {/* ── Right Table Panel ── */}
                  <div className="flex-1 overflow-auto bg-gray-50 p-4">
                    {/* Title */}
                    <p className="text-xs  mb-0.5">รายการสิ่งก่อสร้าง :</p>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      {selectedGroup ? selectedGroup.name : constructionName}
                    </h2>

                    {/* Summary bar */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="inline-flex items-center gap-1 border border-gray-300 rounded px-3 py-1.5  text-xs bg-white">
                        <span className="font-medium">ราคาวัสดุ :</span> {formatNumber(totalMaterialSum)} บาท
                      </span>
                      <span className="inline-flex items-center gap-1 border border-gray-300 rounded px-3 py-1.5  text-xs bg-white">
                        <span className="font-medium">ค่าแรง :</span> {formatNumber(totalLaborSum)} บาท
                      </span>
                      <span className="inline-flex items-center gap-1 border border-gray-300 rounded px-3 py-1.5  text-xs bg-white">
                        <span className="font-medium">ราคารวม :</span> {formatNumber(totalMaterialSum + totalLaborSum)} บาท
                      </span>
                    </div>

                    {/* Data table */}
                    <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-blue-100 text-gray-700">
                            <th className="px-3 py-2 text-center font-medium">ลำดับ</th>
                            <th className="px-3 py-2 text-center font-medium">รหัส</th>
                            <th className="px-3 py-2 text-center font-medium">รายการ</th>
                            <th className="px-3 py-2 text-center font-medium">จำนวน</th>
                            <th className="px-3 py-2 text-center font-medium">หน่วย</th>
                            <th className="px-3 py-2 text-center font-medium">ราคาวัสดุ/หน่วย</th>
                            <th className="px-3 py-2 text-center font-medium">ค่าวัสดุ</th>
                            <th className="px-3 py-2 text-center font-medium">ค่าแรง/หน่วย</th>
                            <th className="px-3 py-2 text-center font-medium">ค่าแรง</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(() => {
                            let rowNum = 0;
                            const makeRow = (item, gId) => {
                              rowNum++;
                              return (
                                <tr key={item.id} className="hover:bg-yellow-50 transition-colors">
                                  <td className="px-3 py-2.5 text-center ">{rowNum}</td>
                                  <td className="px-3 py-2.5 text-gray-700">{item.code}</td>
                                  <td className="px-3 py-2.5 text-gray-700">{item.name}</td>
                                  <td className="px-3 py-2.5 text-center ">
                                    <input
                                      type="number"
                                      className="w-20 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                      value={item.quantity}
                                      onChange={(e) => updateItemQuantity(gId, item.id, Number(e.target.value) || 0)}
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center ">{item.unit}</td>
                                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(item.materialPricePerUnit)}</td>
                                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(item.materialTotal)}</td>
                                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(item.laborPricePerUnit)}</td>
                                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(item.laborTotal)}</td>
                                </tr>
                              );
                            };
                            const renderRows = (groups) =>
                              groups.flatMap((group) => [
                                ...group.items.map((item) => makeRow(item, group.id)),
                                ...renderRows(group.subGroups || []),
                              ]);
                            const rootRows = !selectedGroup ? rootItems.map((item) => makeRow(item, "__root__")) : [];
                            return [...rootRows, ...renderRows(displayGroups)];
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}