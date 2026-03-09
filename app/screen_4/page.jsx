"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Pagination from "@/app/components/pagination"; 
import KebabMenu from "@/app/components/kebabMenu";
import { FilterDrawer } from "../components/filter-slide";
import { SearchInput } from "../components/search-input";
const API_BASE = "/api"; 

const ApiService = {
  callData: (params) => {
    const query = typeof params === 'object' 
      ? new URLSearchParams(params).toString() 
      : params;

    return fetch(`${API_BASE}/boqApproved?${query}`).then((r) => {
      if (!r.ok) throw new Error(`Error: ${r.status}`);
      return r.json();
    });
  },
  updateItem: (data) =>
    fetch(`${API_BASE}/ucItem`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deleteItem: (uid) =>
    fetch(`${API_BASE}/ucItem?UID=${uid}`, {
      method: "DELETE",
    }).then((r) => r.json()),
};

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

const formatNumber = (n) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });




const EMPTY_FILTERS = { item_name: "", item_code: "", unitId: "", itemStatus: "", searchText: "" };

export default function BudgetApp() {
  // --- state ---
  const [selectedYear] = useState("2568");
  const [selectedParentId, setSelectedParentId] = useState(null); // เก็บ UID ของรายการที่คลิก
  const [subItems, setSubItems] = useState([]); // เก็บข้อมูลตารางลูก
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [items, setItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [units, setUnits] = useState([]);
  const HIERARCHY = [
    { table: 'uc_group',    next: 'uc_boq',      parentKey: 'GROUP_ID' },
    { table: 'uc_boq',      next: 'boq_header',  parentKey: 'BOQ_TYPE_ID' },
    { table: 'boq_header',  next: 'boq_item',    parentKey: 'HEADER_ID' },
    { table: 'boq_item',    next: null,          parentKey: null }
  ];
  const [currentLevel, setCurrentLevel] = useState(0); // 0 คือ uc_group
  const [parentFilters, setParentFilters] = useState({}); // เก็บ ID ที่ส่งต่อมาจากชั้นก่อนหน้า

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  
  const handleEdit = (uid) => console.log("Edit:", uid);
  const handleDelete = (uid) => console.log("Delete:", uid);
  const [parentId, setParentId] = useState(null); // เก็บ ID ของตัวแม่ที่คลิกเข้ามา
  const [navHistory, setNavHistory] = useState([]); // เก็บประวัติการคลิกเพื่อใช้กดย้อนกลับ
  const loadData = useCallback(async (level = 0, pCode = null, f = filters) => {
    setIsLoading(true);
    try {
      const tableOrder = ['uc_group', 'uc_boq', 'boq_header', 'boq_item'];
      const currentTable = tableOrder[level] || 'uc_group';
      const queryObj = { table: currentTable };
      if (pCode) {
        queryObj.UID_PARENT = pCode; 
      }

      const res = await ApiService.callData(queryObj);
          console.log("res",res);

      if (res && Array.isArray(res)) {
        setItems(res.map((item) => ({
          uid: item.UID, 
          code: item.code || item.group_code || "-", 
          itemName: item.group_name || item.boq_name || item.remark || "-",
          year: item.fiscal,
          status: item.status,
          raw: item
        })));
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // modal
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [newItem, setNewItem] = useState({ ...emptyNewItem });

  // construction popup
  const [showConstructionPopup, setShowConstructionPopup] = useState(false);
  const [constructionName] = useState("บ้านพักข้าราชการ-6");
  const [constructionGroups, setConstructionGroups] = useState(initialConstructionGroups);
  const [selectedTreeNode, setSelectedTreeNode] = useState(null);
  const [addChoiceGroupId, setAddChoiceGroupId] = useState(null);

  // derived
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const selectedItems = items.filter((i) => i.selected);

  const pagedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ───── API calls ───── */
  const loadUnitList = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/selectionUnit`, { method: "GET" });
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

  const loadWorkItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.fiscal) params.set("fiscal", filters.fiscal);
      const search = filters.jobCode || filters.jobDescription;
      if (search) params.set("search", search);

      const qs = params.toString();
      const url = `${API_BASE}/screen3.php${qs ? "?" + qs : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setItems(
          data.data.map((item) => ({
            uid: item.uid,
            code: item.seqId,
            year: item.fiscal,
            type: item.unitId,
            description: item.workItemName,
            materialLevel1: item.materialLevel1,
            laborLevel1: item.laborLevel1,
            price: item.price,
            unitId: item.unitId,
            itemStatus: item.itemStatus,
            remark: item.remark,
            selected: false,
          }))
        );
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Error loading work items:", err);
    }
  }, [filters.fiscal, filters.jobCode, filters.jobDescription]);

  useEffect(() => {
      loadData(0, null, EMPTY_FILTERS); 
      loadUnitList();
    }, []);
  const [parentCode, setParentCode] = useState(null); // สำหรับ UI
  const [parentUid, setParentUid] = useState(null);   // สำหรับ API

  const handleViewDetail = (item) => {
    const nextLevel = currentLevel + 1;
    
    if (nextLevel < 4) {
      const targetParentId = typeof item === 'object' ? item.uid : item;
      const targetParentCode = typeof item === 'object' ? item.code : item;

      if (!targetParentCode) {
        console.error("ไม่พบ UID สำหรับอ้างอิงชั้นลูก. ข้อมูลที่ได้รับ:", item);
        return;
      }

      setNavHistory(prev => [...prev, { 
        level: currentLevel, 
        pId: parentId, 
        pCode: parentCode 
      }]);
      
      setCurrentLevel(nextLevel);
      setParentId(targetParentId); 
      setParentCode(targetParentCode);
      
      loadData(nextLevel, targetParentCode, filters);
      setCurrentPage(1);
    }
  };

  const handleBack = () => {
    if (navHistory.length > 0) {
      const lastPage = navHistory[navHistory.length - 1];
      
      // คืนค่าประวัติล่าสุด
      setNavHistory(prev => prev.slice(0, -1));
      setCurrentLevel(lastPage.level);
      setParentId(lastPage.pId);
      setParentCode(lastPage.pCode); // คืนค่า Code ให้ UI
      
      loadData(lastPage.level, lastPage.pCode);
    }
  };
  /* ───── actions ───── */
  const clearFilters = () => {
    setFilters({ ...emptyFilters });
    setTimeout(() => loadWorkItems(), 0);
  };

  const refreshData = () => loadWorkItems();

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
    setShowConstructionPopup(true);
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
    if (!newItem.unit) return alert("กรุณาเลือกหน่วย");
    if (!newItem.labor) return alert("กรุณาเลือกแรงงาน");

    const body = {
      fiscal: selectedYear,
      seqId: newItem.code,
      workItemName: newItem.itemName,
      materialLevel1: newItem.material || null,
      laborLevel1: newItem.labor,
      price: (newItem.materialCost || 0) + (newItem.laborCost || 0),
      unitId: newItem.unit,
      itemStatus: "T",
      remark: newItem.buildingGroup || null,
    };

    try {
      if (isEditMode) {
        body.uid = items[editingIndex].uid;
        const data = await res.json();
        if (data.success) {
          setShowSuccessDialog(true);
          loadWorkItems();
        } else {
          alert("Error: " + data.message);
        }
      } else {
        const data = await res.json();
        if (data.success) {
          setShowSuccessDialog(true);
          loadWorkItems();
        } else {
          alert("Error: " + data.message);
        }
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
          const data = await res.json();
          if (data.success) deletedCount++;
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
    loadWorkItems();
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const changeItemsPerPage = (val) => {
    setItemsPerPage(val);
    setCurrentPage(1);
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

  const openNewDialog = () => {
    setIsEditMode(false);
    setEditingUid(null);
    setFormItem(EMPTY_ITEM);
    setShowDialog(true);
  };
  const IconFilter = () => (
    <svg
      width="1em" height="1em" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const IconAdd = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
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
    (s, i) => s + i.materialTotal,
    0
  );
  const totalLaborSum = allConstructionItems.reduce(
    (s, i) => s + i.laborTotal,
    0
  );
  const totalCostSum = totalMaterialSum + totalLaborSum;
  const costPerSqm = allConstructionItems.length > 0 ? totalCostSum / 7 : 0;

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
  

      <div className="bg-gray-50 min-h-screen">
        {/* Main Content */}
        <div className="container mx-auto px-6 py-6">
          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex justify-between gap-5">
  
            <SearchInput
              value={filters.searchText}
              onSearch={(val) => loadData(filters)}
              placeholder="ค้นหา..."
            />
  
            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button onClick={() => loadData(currentLevel, parentId, filters)}
                className="button-primary-border">
                <IconRefresh />Refresh
              </button>
  
              <button onClick={deleteSelected} disabled={selectedItems.size === 0}
                className="button-primary-border">
                <IconTrash />ลบที่เลือก ({selectedItems.size})
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
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">วัสดุ</label>
                  <input type="text" value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    className="custom-input"
                    placeholder="วัสดุ..." />
                </div> */}
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">วัสดุ</label>
                  <select 
                    value={filters.unitId}
                    onChange={(e) => handleFilterChange("unitId", e.target.value)}
                    className="custom-input"
                    placeholder="ค้นหา"
                  >
                    <option value="">ทั้งหมด</option>
                    {units.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">หน่วย</label>
                  <select 
                    value={filters.unitId}
                    onChange={(e) => handleFilterChange("unitId", e.target.value)}
                    className="custom-input"
                    placeholder="ค้นหา"
                  >
                    <option value="">ทั้งหมด</option>
                    {units.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </FilterDrawer>
          </div>
          {currentLevel > 0 && (
            <div className="mb-6 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between gap-3">
                
                <div>
                  {/* <h2 className="text-xl font-bold text-gray-800">
                    {currentLevel === 1 && "กลุ่มย่อย (uc_boq)"}
                    {currentLevel === 2 && "หัวข้อโครงการ (boq_header)"}
                    {currentLevel === 3 && "รายการวัสดุ (boq_item)"}
                  </h2> */}
                  
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-sm text-blue-600 font-medium">
                      รหัสรายการ: 
                      <span className="ml-2 text-gray-900 font-bold px-2 py-0.5 bg-blue-100 rounded border border-blue-200">
                        {parentCode}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      กำลังดู: {items.length > 0 ? `${items.length} รายการ` : "ไม่พบข้อมูล"}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleBack} 
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-all text-sm font-medium whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left-short" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/>
                  </svg>
                  ย้อนกลับ
                </button>

              </div>
            </div>
          )}


          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="overflow-x-auto">
                <table className="modern-table w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">จัดการ</th>
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
                      <th className="px-6 py-3 text-center">ปีงบประมาณ</th>
                      <th className="px-6 py-3 text-center">รายการ</th>
                      <th className="px-6 py-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pagedItems.map((item, idx) => {
                      const itemId = item.uid || item.code || `row-${idx}`;
                      const globalIdx = (currentPage - 1) * itemsPerPage + idx;

                      return (
                        <tr
                          key={itemId}
                          className="modern-table-row hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-4 text-center">
                            <KebabMenu
                              itemId={itemId}
                              activeMenu={activeMenu}
                              setActiveMenu={setActiveMenu}
                            >
                              <button 
                                className="kebab-menu-item w-full" 
                                onClick={() => handleViewDetail(item)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye text-blue-500" viewBox="0 0 16 16">
                                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
                                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
                                </svg> 
                                <span>ดูรายละเอียด</span>
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

                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              className="custom-checkbox"
                              checked={item.selected || false}
                              onChange={() => handleItemSelect(globalIdx)}
                            />
                          </td>

                          <td className="px-6 py-4 text-center tabular-nums">{globalIdx + 1}</td>
                          <td className="px-6 py-4">{item.code}</td>
                          <td className="px-6 py-4">{item.year}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{item.itemName}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-medium">
                              {item.status}
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
            {/* Popup Header / Tabs */}
            <div className="flex items-center border-b border-gray-200 bg-white px-4 shrink-0">
              <button className="px-4 py-3 text-sm  hover:text-gray-700 border-b-2 border-transparent">ข้อมูลสิ่งก่อสร้าง</button>
              <button className="px-4 py-3 text-sm text-blue-600 font-medium border-b-2 border-blue-600">สร้างบัญชีรายการสิ่งก่อสร้าง</button>
              <button className="px-4 py-3 text-sm  hover:text-gray-700 border-b-2 border-transparent">แสดงบัญชีรายการสิ่งก่อสร้าง</button>
              <button className="px-4 py-3 text-sm  hover:text-gray-700 border-b-2 border-transparent">สรุปข้อมูลวัสดุ</button>
              <button className="px-4 py-3 text-sm  hover:text-gray-700 border-b-2 border-transparent">สรุปข้อมูลค่าแรง</button>
              <button className="px-4 py-3 text-sm  hover:text-gray-700 border-b-2 border-transparent">รายงานสิ่งก่อสร้าง</button>
              <div className="ml-auto">
                <button className=" hover:text-gray-600 p-1" onClick={closeConstructionPopup}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
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
                  <button className=" hover:text-blue-600 p-0.5" onClick={addGroupToConstruction} title="เพิ่มกลุ่ม">
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
                    <span className="font-medium">ราคารวม :</span> {formatNumber(totalCostSum)} บาท
                  </span>
                  <span className="inline-flex items-center gap-1 border border-blue-400 rounded px-3 py-1.5  text-xs bg-blue-50 text-blue-700">
                    <span className="font-medium">ราคาต่อพื้นที่ 1 ตร.ม. :</span> {formatNumber(costPerSqm)} บาท
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
