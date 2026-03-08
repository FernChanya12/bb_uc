"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Pagination from "@/app/components/pagination"; 
import KebabMenu from "@/app/components/kebabMenu";
const API_BASE = "http://localhost:3000/api";

const emptyFilters = {
  fiscal: "",
  material: "",
  departmentCode: "",
  unit: "",
  jobCode: "",
  jobDescription: "",
};

const emptyNewItem = {
  code: "",
  buildingGroup: "",
  itemName: "",
  unit: "",
  material: "",
  materialCost: 0,
  labor: "",
  laborCost: 0,
  totalPrice: 0,
};

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

const formatNumber = (n) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ───────────── Custom Dropdown ───────────── */
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
export default function Screen4Page() {
  // --- state ---
  const [selectedYear] = useState("2568");
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [items, setItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [units, setUnits] = useState([]);

  const [buildingGroups] = useState([
    { value: "group1", label: "บ้านพักข้าราชการ" },
    { value: "group2", label: "บ้านพักข้าราชการ2" },
    { value: "group3", label: "อาคารอเนกประสงค์-หลังคาเหล็ก" },
    { value: "group4", label: "อาคารเรียนปูนเปือโบง" },
  ]);

  const [materials, setMaterials] = useState([]);
  const [laborTypes, setLaborTypes] = useState([]);
  const [boqGroups, setBoqGroups] = useState([]);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // modal
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [newItem, setNewItem] = useState({ ...emptyNewItem });

  // dropdowns open state
  const [openDropdown, setOpenDropdown] = useState(null);

  // hover row
  const [hoverIdx, setHoverIdx] = useState(null);

  // construction popup
  const [showConstructionPopup, setShowConstructionPopup] = useState(false);
  const [constructionName, setConstructionName] = useState("");
  const [editingBoqUid, setEditingBoqUid] = useState(null);
  const [boqForm, setBoqForm] = useState({ boq_name: "", boq_detail: "", boq_group: "", status: "T", remark: "" });
  const [constructionGroups, setConstructionGroups] = useState(initialConstructionGroups);
  const [selectedTreeNode, setSelectedTreeNode] = useState(null);
  const [addChoiceGroupId, setAddChoiceGroupId] = useState(null);

  // server-side pagination
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // derived
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const selectedItems = items.filter((i) => i.selected);

  /* ───── helpers ───── */
  const getLabel = (list, value) =>
    list.find((o) => o.value === value)?.label ?? "";

  const toggleDropdown = useCallback(
    (name) => setOpenDropdown((prev) => (prev === name ? null : name)),
    []
  );

  /* ───── API calls ───── */
  const loadSelections = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/selectionUnit`, { method: "GET" });
      const data = await res.json();
      console.log("Units:", data);
      // support array response, { units: [...] }, or { success, units: [...] }
      const rawUnits = Array.isArray(data)
        ? data
        : Array.isArray(data.units)
        ? data.units
        : [];
      setUnits(rawUnits.map((u) => ({ value: u.UID, label: u.unit_name })));
      if (data.materials) setMaterials(data.materials);
      if (data.laborTypes) setLaborTypes(data.laborTypes);

      // load boq groups
      const grpRes = await fetch(`${API_BASE}/selectionGroup`);
      const grpData = await grpRes.json();
      const rawGroups = Array.isArray(grpData) ? grpData : [];
      setBoqGroups(rawGroups.map((g) => ({ value: g.value, label: g.label })));
    } catch (err) {
      console.error("Error loading selections:", err);
    }
  }, []);

  const loadWorkItems = useCallback(async (page = currentPage, limit = itemsPerPage) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", limit);
      if (filters.fiscal) params.set("fiscal", filters.fiscal);
      if (filters.jobDescription) params.set("boq_name", filters.jobDescription);
      if (filters.jobCode) params.set("boq_group", filters.jobCode);

      const res = await fetch(`${API_BASE}/boq?${params.toString()}`);
      const json = await res.json();

      setItems(
        (json.data || []).map((item) => ({
          uid: item.UID,
          code: item.UID,
          year: item.fiscal,
          type: item.boq_group,
          description: item.boq_name,
          boq_detail: item.boq_detail,
          price: item.price,
          itemStatus: item.status,
          remark: item.remark,
          selected: false,
        }))
      );
      setTotalItems(json.totalCount || 0);
    } catch (err) {
      console.error("Error loading BOQ:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, filters.fiscal, filters.jobCode, filters.jobDescription]);

  useEffect(() => {
    loadSelections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-filter with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadWorkItems(1, itemsPerPage);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.fiscal, filters.jobCode, filters.jobDescription, filters.unit, filters.material]);


  /* ───── actions ───── */
  const clearFilters = () => {
    setFilters({ ...emptyFilters });
    setCurrentPage(1);
    setTimeout(() => loadWorkItems(1, itemsPerPage), 0);
  };

  const refreshData = () => loadWorkItems(currentPage, itemsPerPage);

  const handleToggleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    setItems((prev) => prev.map((i) => ({ ...i, selected: next })));
  };

  const handleItemSelect = (idx) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], selected: !updated[idx].selected };
      const allSelected = updated.every((i) => i.selected);
      setSelectAll(allSelected);
      return updated;
    });
  };

  const openNew = () => {
    setConstructionName("");
    setBoqForm({ boq_name: "", boq_detail: "", boq_group: "", status: "T", remark: "" });
    setConstructionGroups([]);
    setSelectedTreeNode(null);
    setEditingBoqUid(null);
    setShowConstructionPopup(true);
  };

  // แปลง API tree → constructionGroups format
  const convertApiTree = (tree) => {
    const convertHeader = (header) => ({
      id: header.UID,
      name: header.header_code || header.UID,
      expanded: true,
      items: (header.items || []).map((item) => ({
        id: item.UID,
        code: item.item_code || "",
        name: item.item_code || "",
        quantity: 0,
        unit: "บาท/ตัวอย่าง",
        materialPricePerUnit: item.price || 0,
        materialTotal: 0,
        laborPricePerUnit: 0,
        laborTotal: 0,
      })),
      subGroups: (header.children || []).map(convertHeader),
    });
    return tree.map(convertHeader);
  };

  const handleEdit = async (uid) => {
    setActiveMenu(null);
    try {
      const res = await fetch(`${API_BASE}/boqDetail?boq_uid=${uid}`);
      if (!res.ok) {
        alert("ไม่พบข้อมูล BOQ");
        return;
      }
      const json = await res.json();
      const b = json.boq || {};
      setConstructionName(b.boq_name || "");
      setBoqForm({
        boq_name: b.boq_name || "",
        boq_detail: b.boq_detail || "",
        boq_group: b.boq_group || "",
        status: b.status || "T",
        remark: b.remark || "",
      });
      setEditingBoqUid(uid);
      setConstructionGroups(convertApiTree(json.tree || []));
      setSelectedTreeNode(null);
      setShowConstructionPopup(true);
    } catch (err) {
      console.error("Error loading BOQ detail:", err);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
  };

  const handleDelete = async (uid) => {
    setActiveMenu(null);
    if (!confirm("ต้องการลบรายการนี้หรือไม่?")) return;
    try {
      const res = await fetch(`${API_BASE}/boq`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ UID: uid, status: "F" }),
      });
      if (res.ok) {
        alert("ลบสำเร็จ");
        loadWorkItems(currentPage, itemsPerPage);
      } else {
        alert("ลบไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Error deleting:", err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  const editItem = (item) => {
    setIsEditMode(true);
    setEditingIndex(items.indexOf(item));
    setNewItem({
      code: item.code,
      buildingGroup: item.remark || "",
      itemName: item.description,
      unit: item.unitId || "",
      material: item.materialLevel1 || "",
      materialCost: 0,
      labor: item.laborLevel1 || "",
      laborCost: 0,
      totalPrice: item.price || 0,
    });
    setOpenDropdown(null);
    setShowNewDialog(true);
  };

  const saveNewItem = async () => {
    if (!newItem.code) return alert("กรุณากรอกรหัส");
    if (!newItem.itemName) return alert("กรุณากรอกชื่อรายการ");

    const body = {
      fiscal: selectedYear,
      boq_name: newItem.itemName,
      boq_detail: newItem.buildingGroup || null,
      boq_group: newItem.code,
      status: "T",
      remark: newItem.buildingGroup || null,
    };

    try {
      let res;
      if (isEditMode) {
        body.UID = items[editingIndex].uid;
        res = await fetch(`${API_BASE}/boq`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_BASE}/boq`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        setShowSuccessDialog(true);
        loadWorkItems(currentPage, itemsPerPage);
      } else {
        const err = await res.json();
        alert("Error: " + (err.message || "เกิดข้อผิดพลาด"));
      }
    } catch (err) {
      console.error("Error saving item:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const deleteSelected = async () => {
    if (selectedItems.length === 0) return;
    if (
      !confirm(
        `ต้องการลบรายการที่เลือก ${selectedItems.length} รายการหรือไม่?`
      )
    )
      return;

    let deletedCount = 0;
    let failedCount = 0;

    await Promise.all(
      selectedItems.map(async (item) => {
        try {
          const res = await fetch(`${API_BASE}/boq`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ UID: item.uid, status: "F" }),
          });
          if (res.ok) deletedCount++;
          else failedCount++;
        } catch {
          failedCount++;
        }
      })
    );

    let msg = `ลบสำเร็จ ${deletedCount} รายการ`;
    if (failedCount > 0) msg += `, ล้มเหลว ${failedCount} รายการ`;
    alert(msg);
    setSelectAll(false);
    loadWorkItems(1, itemsPerPage);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      loadWorkItems(page, itemsPerPage);
    }
  };

  const changeItemsPerPage = (val) => {
    setItemsPerPage(val);
    setCurrentPage(1);
    loadWorkItems(1, val);
  };

  const updateNewItem = (patch) =>
    setNewItem((prev) => ({ ...prev, ...patch }));

  const closeNewDialog = () => setShowNewDialog(false);
  const closeSuccessDialog = () => {
    setShowSuccessDialog(false);
    setShowNewDialog(false);
  };

  /* ───── construction popup helpers ───── */
  const closeConstructionPopup = () => setShowConstructionPopup(false);

  const toggleGroup = (groupId) => {
    const toggle = (groups) =>
      groups.map((g) =>
        g.id === groupId
          ? { ...g, expanded: !g.expanded }
          : { ...g, subGroups: toggle(g.subGroups || []) }
      );
    setConstructionGroups((prev) => toggle(prev));
  };

  const updateItemQuantity = (groupId, itemId, quantity) => {
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

  const addGroupToConstruction = () => {
    const name = prompt("ชื่อกลุ่มใหม่:");
    if (!name) return;
    setConstructionGroups((prev) => [
      ...prev,
      { id: "g" + Date.now(), name, expanded: true, items: [], subGroups: [] },
    ]);
  };

  const addItemToGroup = (groupId) => {
    setAddChoiceGroupId(groupId);
  };

  const confirmAddItem = (groupId) => {
    setAddChoiceGroupId(null);
    const name = prompt("ชื่อรายการ:");
    if (!name) return;
    const code = prompt("รหัส:") || "";
    const materialPrice = parseFloat(prompt("ราคาวัสดุ/หน่วย:") || "0");
    const laborPrice = parseFloat(prompt("ค่าแรง/หน่วย:") || "0");
    const newEntry = {
      id: "i" + Date.now(),
      code,
      name,
      quantity: 0,
      unit: "บาท/ตัวอย่าง",
      materialPricePerUnit: materialPrice,
      materialTotal: 0,
      laborPricePerUnit: laborPrice,
      laborTotal: 0,
    };
    const addToGroup = (groups) =>
      groups.map((g) => {
        if (g.id === groupId) return { ...g, items: [...g.items, newEntry] };
        return { ...g, subGroups: addToGroup(g.subGroups || []) };
      });
    setConstructionGroups((prev) => addToGroup(prev));
  };

  const confirmAddGroup = (groupId) => {
    setAddChoiceGroupId(null);
    const name = prompt("ชื่อกลุ่มย่อยใหม่:");
    if (!name) return;
    const newGroup = { id: "g" + Date.now(), name, expanded: true, items: [], subGroups: [] };
    const addToGroup = (groups) =>
      groups.map((g) => {
        if (g.id === groupId) return { ...g, subGroups: [...(g.subGroups || []), newGroup] };
        return { ...g, subGroups: addToGroup(g.subGroups || []) };
      });
    setConstructionGroups((prev) => addToGroup(prev));
  };

  // construction computed values
  const flattenGroupItems = (groups) =>
    groups.flatMap((g) => [...g.items, ...flattenGroupItems(g.subGroups || [])]);
  const allConstructionItems = flattenGroupItems(constructionGroups);

  const findGroupById = (groups, id) => {
    for (const g of groups) {
      if (g.id === id) return g;
      const found = findGroupById(g.subGroups || [], id);
      if (found) return found;
    }
    return null;
  };

  const selectedGroup = selectedTreeNode ? findGroupById(constructionGroups, selectedTreeNode) : null;
  const displayGroups = selectedGroup ? [selectedGroup] : constructionGroups;
  const totalMaterialSum = allConstructionItems.reduce(
    (s, i) => s + (parseFloat(i.materialPricePerUnit) || 0),
    0
  );
  const totalCostSum = allConstructionItems.reduce(
    (s, i) => s + (parseFloat(i.materialTotal) || 0),
    0
  );
  const totalLaborSum = allConstructionItems.reduce(
    (s, i) => s + (parseFloat(i.laborTotal) || 0),
    0
  );

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

  /* ───────────── Render ───────────── */
  return (
    <>
      {/* ---------- inline styles for custom dropdown ---------- */}
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
        {/* Main Content */}
        <div className="container mx-auto px-6 py-6">
          <div className="text-black text-2xl font-medium mb-3">รายการ BOQ</div>
          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex gap-4 mb-4">
              {/* รหัสงาน */}
              <div>
                <label className="text-label">
                  รหัสงาน
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="รหัสงาน..."
                    className="custom-input"
                    value={filters.jobCode}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, jobCode: e.target.value }))
                    }
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2  pointer-events-none">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              {/* รายการงาน */}
              <div>
                <label className="text-label">
                  รายการงาน
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="รายการงาน..."
                    className="custom-input"
                    value={filters.jobDescription}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        jobDescription: e.target.value,
                      }))
                    }
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2  pointer-events-none">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              {/* หน่วย */}
              <div>
                <label className="text-label">
                  หน่วย
                </label>
                <CustomDropdown
                  options={units}
                  value={filters.unit}
                  placeholder="ค้นหา..."
                  isOpen={openDropdown === "filterUnit"}
                  onToggle={() => toggleDropdown("filterUnit")}
                  onSelect={(v) => {
                    setFilters((f) => ({ ...f, unit: v }));
                    setOpenDropdown(null);
                  }}
                />
              </div>

              {/* วัสดุ */}
              <div>
                <label className="text-label">
                  วัสดุ
                </label>
                <CustomDropdown
                  options={materials}
                  value={filters.material}
                  placeholder="ค้นหา..."
                  isOpen={openDropdown === "filterMaterial"}
                  onToggle={() => toggleDropdown("filterMaterial")}
                  onSelect={(v) => {
                    setFilters((f) => ({ ...f, material: v }));
                    setOpenDropdown(null);
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button
                className="button-primary-border"
                onClick={clearFilters}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear
              </button>

              <button
                className="button-primary-border"
                onClick={refreshData}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>

              <button
                className="button-primary-border"
                disabled={selectedItems.length === 0}
                onClick={deleteSelected}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                ลบที่เลือก ({selectedItems.length})
              </button>

              <button
                className="button-primary"
                onClick={openNew}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                เพิ่มข้อมูล
              </button>
            </div>
          </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="overflow-x-auto">
                <table className="modern-table w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16"></th>
                      <th className="px-6 py-3">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={selectAll}
                            onChange={handleToggleSelectAll}
                          />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center">ลำดับ</th>
                      <th className="px-6 py-3 text-center">รหัสรายการ</th>
                      <th className="px-6 py-3 text-center">รายการ</th>
                      <th className="px-6 py-3 text-center">ปีงบประมาณ</th>
                      <th className="px-6 py-3 text-center">ประเภท</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => {
                      const itemId = item.uid || item.code || `row-${idx}`;
                      const globalIdx = (currentPage - 1) * itemsPerPage + idx;

                      return (
                        <tr
                          key={itemId}
                          className="modern-table-row hover:bg-gray-50/50 transition-colors"
                          // ลบ onClick และ onDoubleClick ออกจากตรงนี้แล้วค่ะ
                        >
                          {/* 1. คอลัมน์ Kebab Menu */}
                          <td className="px-4 py-4 text-center">
                            <KebabMenu
                              itemId={itemId}
                              activeMenu={activeMenu}
                              setActiveMenu={setActiveMenu}
                            >
                              <button 
                                className="kebab-menu-item w-full" 
                                onClick={() => handleEdit(item.uid)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye text-blue-500" viewBox="0 0 16 16">
                                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
                                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
                                </svg> 
                                <span>แก้ไขรายละเอียด</span>
                              </button>

                              <button 
                                className="kebab-menu-item w-full text-red-500 hover:bg-red-50" 
                                onClick={() => handleDelete(item.uid)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash-fill" viewBox="0 0 16 16">
                                  <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                                </svg> 
                                <span>ลบรายการ</span>
                              </button>
                            </KebabMenu>
                          </td>

                          {/* 2. Checkbox */}
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              className="custom-checkbox"
                              checked={item.selected || false}
                              onChange={() => handleItemSelect(globalIdx)}
                            />
                          </td>

                          {/* 3. ข้อมูลอื่นๆ */}
                          <td className="px-6 py-4 text-center tabular-nums">{globalIdx + 1}</td>
                          <td className="px-6 py-4">{item.code}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{item.description}</td>
                          <td className="px-6 py-4 text-center">{item.year}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-medium">
                              {item.type}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              changeItemsPerPage={changeItemsPerPage}
              goToPage={goToPage}
            />
          </div>
        </div>
      </div>

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
                  <button className=" hover:text-blue-600 p-0.5" onClick={() => addItemToGroup()} title="เพิ่มกลุ่ม">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>

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
                        <th className="px-3 py-2 text-center font-medium">ค่าวัสดุ (จำนวนเงิน)</th>
                        <th className="px-3 py-2 text-center font-medium">ค่าแรง/หน่วย</th>
                        <th className="px-3 py-2 text-center font-medium">ค่าแรง (จำนวนเงิน)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        let rowNum = 0;
                        const renderRows = (groups) =>
                          groups.flatMap((group) => [
                            ...group.items.map((item) => {
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
                                      onChange={(e) =>
                                        updateItemQuantity(
                                          group.id,
                                          item.id,
                                          Number(e.target.value) || 0
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center ">{item.unit}</td>
                                  <td className="px-3 py-2.5 text-right  tabular-nums">{formatNumber(item.materialPricePerUnit)}</td>
                                  <td className="px-3 py-2.5 text-right  tabular-nums">{formatNumber(item.materialTotal)}</td>
                                  <td className="px-3 py-2.5 text-right  tabular-nums">{formatNumber(item.laborPricePerUnit)}</td>
                                  <td className="px-3 py-2.5 text-right  tabular-nums">{formatNumber(item.laborTotal)}</td>
                                </tr>
                              );
                            }),
                            ...renderRows(group.subGroups || []),
                          ]);
                        return renderRows(displayGroups);
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    

      {/* ═══════ Add Choice Modal ═══════ */}
      {addChoiceGroupId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setAddChoiceGroupId(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-72 p-6 z-10">
            <h3 className="text-base font-semibold text-gray-900 mb-5 text-center">เลือกประเภทที่จะเพิ่ม</h3>
            <div className="flex flex-col gap-3">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors text-left"
                onClick={() => confirmAddItem(addChoiceGroupId)}
              >
                <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <div>
                  <p className="text-sm font-medium text-gray-800">เพิ่มรายการ (Item)</p>
                  <p className="text-xs text-gray-500">เพิ่มรายการงานในกลุ่มนี้</p>
                </div>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-yellow-50 hover:border-yellow-400 transition-colors text-left"
                onClick={() => confirmAddGroup(addChoiceGroupId)}
              >
                <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                <div>
                  <p className="text-sm font-medium text-gray-800">เพิ่มกลุ่มย่อย (Sub-Group)</p>
                  <p className="text-xs text-gray-500">เพิ่มกลุ่มย่อยภายใต้กลุ่มนี้</p>
                </div>
              </button>
            </div>
            <button
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setAddChoiceGroupId(null)}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ═══════ Success Popup ═══════ */}
      {showSuccessDialog && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <button
                type="button"
                className="absolute top-4 right-4  hover:"
                onClick={closeSuccessDialog}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="px-6 py-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  บันทึกสำเร็จ
                </h3>
                <p className="text-gray-600 mb-6">
                  ข้อมูลถูกบันเดตเรียบร้อยแล้ว
                </p>
                <button
                  type="button"
                  onClick={closeSuccessDialog}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
