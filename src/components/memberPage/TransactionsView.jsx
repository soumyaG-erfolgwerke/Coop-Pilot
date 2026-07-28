"use client";
import React, { useState, useMemo, useEffect } from "react";
import {useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel,getPaginationRowModel, flexRender} from "@tanstack/react-table";
import {ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, ChevronLeft, Search, Eye, Download, FileText, ShieldCheck} from "lucide-react";
import { getTransactionsByMemberId } from "../../lib/transactionService";
import TransactionDetailModal from "./TransactionDetailModal";
import { getAllCoops } from "../../lib/getCoopsService";
import { useAuth } from "../../hooks/useAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const StatusPill = ({ status }) => {
  const s = (status || "").toLowerCase();
  let style = "bg-gray-50 text-gray-700 border-gray-200";

  if (s === "verified" || s === "approved") {
    style = "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50";
  } else if (s === "pending") {
    style = "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50";
  } else if (s === "cancelled" || s === "rejected") {
    style = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
      {status || "Unknown"}
    </span>
  );
};

const TypePill = ({ type }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/50 capitalize">
    {type || "Unknown"}
  </span>
);

const TransactionsView = ({ coopId }) => {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const memberId = user?.$id;

  useEffect(() => {
    if (!memberId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        const coops = await getAllCoops();
        const coopMap = coops.reduce((acc, c) => {
          acc[c.id] = c;
          return acc;
        }, {});

        const res = await getTransactionsByMemberId(memberId);
        const docs = res?.documents || [];

        const enriched = docs.map((tx) => ({
          ...tx,
          coopName: coopMap[tx.coopId]?.name || "Unknown",
        }));

        setTransactions(enriched);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [memberId]);

  const filteredTransactions = useMemo(() => {
    let txs = transactions;
    if (coopId) {
      txs = txs.filter((tx) => tx.coopId === coopId);
    }
    return txs.filter(
      (tx) => (tx.verificationStatus || "").toLowerCase() === "verified"
    );
  }, [transactions, coopId]);

  const totalCount = filteredTransactions.length;

  const columns = useMemo(
    () => [
      {
        accessorKey: "coopName",
        header: "Cooperative",
        cell: (info) => <span className="font-medium text-gray-900 dark:text-gray-100">{info.getValue()}</span>,
      },
      {
        accessorKey: "verificationStatus",
        header: "Status",
        cell: (info) => <StatusPill status={info.getValue()} />,
      },
      {
        accessorKey: "shares",
        header: () => <div className="text-right">Shares</div>,
        cell: (info) => <div className="text-right">{info.getValue().toLocaleString()}</div>,
      },
      {
        accessorKey: "price",
        header: () => <div className="text-right">Total Price</div>,
        cell: (info) => (
          <div className="font-medium text-right text-green-600">
            €{info.getValue().toLocaleString({ minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        accessorKey: "transactionType",
        header: "Type",
        cell: (info) => <TypePill type={info.getValue()} />,
      },
      {
        accessorKey: "buyFor",
        header: "For",
        cell: (info) => <span className="text-gray-600 dark:text-gray-400">{info.getValue() || "—"}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-center">View</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button
              onClick={() => setSelectedTransaction(row.original)}
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="View Details"
            >
              <Eye size={18} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(
      "Meine Transaktionen / My Transactions",
      doc.internal.pageSize.width / 2,
      20,
      { align: "center" }
    );

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(100);

    doc.text(
      `Generated: ${new Date().toLocaleDateString("de-DE")}`,
      14,
      30
    );

    doc.text(
      "Compliance: GDPR Art. 15 / GoBD Record",
      14,
      36
    );

    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.setFont(undefined, "bold");
    doc.text("Member Details", 14, 45);

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    doc.text("Name:", 14, 52);
    doc.text(user?.name || "—", 60, 52);

    doc.text("Email:", 14, 58);
    doc.text(user?.email || "—", 60, 58);

    doc.text("Member ID:", 14, 64);
    doc.text(user?.$id || "—", 60, 64);

    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(14, 68, doc.internal.pageSize.width - 14, 68);

    const rows = filteredTransactions.map((tx) => [
      tx.coopName || "—",
      tx.verificationStatus || "—",
      tx.shares?.toLocaleString() || "0",
      `€${Number(tx.price || 0).toLocaleString()}`,
      tx.transactionType || "—",
      tx.buyFor || "—",
    ]);

    autoTable(doc, {
      startY: 72,
      head: [["Cooperative", "Status", "Shares", "Total Price", "Type", "For"]],
      body: rows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4, valign: "middle" },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        halign: "center",
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 20, halign: "right" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 25, halign: "center" },
        5: { cellWidth: 25, halign: "center" },
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    });

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "This document is system-generated and compliant with GDPR Article 15.",
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );

    const fileName = `Transactions_${user?.$id}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
  };

  return (
    <>
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      <div className="p-4 mx-auto space-y-6 max-w-7xl sm:p-6 lg:p-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 text-indigo-600 bg-indigo-50 rounded-xl dark:bg-indigo-900/30 dark:text-indigo-400">
              <FileText className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Transactions / Meine Transaktionen
              </h2>
              <p className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                {totalCount} records found
              </p>
            </div>
          </div>

          <div className="flex w-full gap-3 md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search records..."
                className="w-full py-2 pr-3 text-sm transition-shadow border border-gray-200 rounded-lg pl-9 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <button
              onClick={exportPDF}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs tracking-wider text-gray-500 uppercase border-b border-gray-200 select-none bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 font-semibold transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.id === "shares" || header.column.id === "price"
                              ? "justify-end"
                              : header.column.id === "actions"
                              ? "justify-center"
                              : "justify-start"
                          }`}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                            {{
                              asc: <ChevronUp size={14} className="text-indigo-600" />,
                              desc: <ChevronDown size={14} className="text-indigo-600" />,
                            }[header.column.getIsSorted()] ?? (
                              header.column.getCanSort() ? <ChevronsUpDown size={14} className="transition-opacity opacity-0 group-hover:opacity-50" /> : null
                            )}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-6 h-6 border-2 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                        Loading records...
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 italic text-center text-gray-500">
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700 sm:flex-row">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
              <strong>{table.getPageCount() || 1}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 text-gray-600 transition-colors border border-gray-200 rounded-md dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-700 dark:text-gray-300"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 text-gray-600 transition-colors border border-gray-200 rounded-md dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-700 dark:text-gray-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="text-xs text-center text-gray-400 dark:text-gray-500">
          <p>This list is strictly read-only and cannot be altered or deleted.</p>
        </div>
      </div>
    </>
  );
};

export default TransactionsView;