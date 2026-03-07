"use client";

export default function Pagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  changeItemsPerPage, 
  goToPage 
}) {
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) end = 4;
      if (currentPage >= totalPages - 2) start = totalPages - 3;
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex-1 flex justify-start">
        <div className="flex w-20">
          <select
            className="block w-full appearance-none border border-gray-300 bg-gray-50 text-gray-700 p-1.5 text-[10px] md:text-xs rounded-md pr-6 cursor-pointer focus:outline-none"
            value={itemsPerPage}
            onChange={(e) => changeItemsPerPage(Number(e.target.value))}
            style={{
              backgroundImage: "linear-gradient(to right, #d1d5db 1px, transparent 1px), url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
              backgroundPosition: "right 1.5rem center, right 0.4rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1px 50%, 1.2em 1.2em",
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex justify-center text-[11px] md:text-xs text-slate-500 font-normal whitespace-nowrap">
        แสดง {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
      </div>

      <div className="flex-1 flex justify-end items-center">
        <nav>
          <ul className="flex items-center gap-0.5">
            <li>
              <button
                className={`flex items-center justify-center min-w-[60px] px-2 py-1.5 border rounded-md text-[11px] md:text-xs transition-colors ${
                  currentPage === 1 ? "text-gray-300 border-gray-200 cursor-not-allowed" : "text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                ก่อนหน้า
              </button>
            </li>

            <div className="flex items-center px-1">
              {getPageNumbers().map((page, idx) => (
                <li key={idx}>
                  {page === "..." ? (
                    <span className="px-1.5 text-gray-400 text-[10px]">...</span>
                  ) : (
                    <button
                      onClick={() => goToPage(page)}
                      className={`min-w-[28px] h-[28px] mx-0.5 flex items-center justify-center rounded-md text-[11px] md:text-xs font-medium transition-all ${
                        currentPage === page
                          ? "bg-[#003d5b] text-white" 
                          : "text-gray-500 hover:text-blue-600"
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </li>
              ))}
            </div>

            <li>
              <button
                className={`flex items-center justify-center min-w-[60px] px-2 py-1.5 border rounded-md text-[11px] md:text-xs transition-colors ${
                  currentPage === totalPages ? "text-gray-300 border-gray-200 cursor-not-allowed" : "text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                ถัดไป
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}