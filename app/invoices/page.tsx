"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  invoiceApi,
  type InvoiceRow,
  type Metrics,
  type TrendPoint,
  type TopItem,
} from "@/lib/services";
import { errorMessage, getCurrencySymbol } from "@/lib/api";
import {
  formatMoney,
  formatDate,
  downloadCsv,
} from "@/lib/format";

import InvoiceCharts from "../component/InvoiceCharts";

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    invoiceCount: 0,
    totalAmount: 0,
  });
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showColumns, setShowColumns] = useState(false);
const [visibleColumns, setVisibleColumns] = useState({
  invoiceNo: true,
  date: true,
  customer: true,
  items: true,
  subTotal: true,
  tax: true,
  taxAmount: true,
  total: true,
  actions: true,
});
  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [invoiceData, metricsData, trendData, topItemsData] =
        await Promise.all([
          invoiceApi.getList(),
          invoiceApi.getMetrics({}),
          invoiceApi.getTrend12m(),
          invoiceApi.getTopItems({}, 5),
        ]);

      setInvoices(invoiceData ?? []);
      setMetrics(metricsData);
      setTrend(trendData ?? []);
      setTopItems(topItemsData ?? []);
      setCurrency(getCurrencySymbol());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const query = search.toLowerCase();

    return (
      String(invoice.invoiceNo ?? "")
        .toLowerCase()
        .includes(query) || invoice.customerName.toLowerCase().includes(query)
    );
  });

const handleExport = () => {
  const headers = [
    "Invoice No",
    "Date",
    "Customer",
    "Items",
    "Sub Total",
    "Tax %",
    "Tax Amount",
    "Total",
  ];

  const rows = filteredInvoices.map((invoice) => [
    invoice.invoiceNo ?? "-",
    invoice.invoiceDate,
    invoice.customerName,
    invoice.totalItems,
    invoice.subTotal,
    invoice.taxPercentage,
    invoice.taxAmount,
    invoice.invoiceAmount,
  ]);

  downloadCsv("invoices.csv", headers, rows);
};
  

async function handleDelete(invoiceID: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this invoice?",
  );

  if (!confirmed) return;

  try {
    setError("");
    await invoiceApi.remove(invoiceID);
    await loadDashboard();
  } catch (err) {
    setError(errorMessage(err, "Unable to delete invoice."));
  }
}

  const totalInvoices = filteredInvoices.length;

  const totalPages = Math.ceil(totalInvoices / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;

  const paginatedInvoices = filteredInvoices.slice(
    startIndex,
    startIndex + rowsPerPage,
  );
  return (
    <div className="min-h-screen bg-[var(--background)] p-4 text-[var(--text-primary)]">
      <h1 className="mb-2 text-sm text-[var(--text-muted)]">
        Invoice Dashboard
      </h1>

      <div className="container !p-3">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-light)] pb-3">
          <h2 className="text-base font-normal">Invoices</h2>

          <div className="flex flex-wrap gap-1.5">
            {["Today", "Week", "Month", "Year", "Custom"].map((item, index) => (
              <button
                key={item}
                className={`rounded-full px-3 py-1 text-[10px] ${
                  index === 0
                    ? "bg-[var(--button-bg)] text-white"
                    : "bg-[var(--background)] text-[var(--text-secondary)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-[var(--border-color)] bg-[var(--surface)] p-4">
            <h3 className="text-xl">
              {loading ? "..." : metrics.invoiceCount}
            </h3>
            <p className="text-[10px] text-[var(--text-muted)]">
              Number of Invoices
            </p>
            <p className="mt-1 text-[9px] text-[var(--helper-color)]">Today</p>
          </div>

          <div className="rounded-md border border-[var(--border-color)] bg-[var(--surface)] p-4">
            <h3 className="text-xl">
              {loading ? "..." : formatMoney(metrics.totalAmount, currency)}
            </h3>
            <p className="text-[10px] text-[var(--text-muted)]">
              Total Invoice Amount
            </p>
            <p className="mt-1 text-[9px] text-[var(--helper-color)]">Today</p>
          </div>
          <div className="xl:col-span-2">
            <InvoiceCharts
              trend={trend}
              topItems={topItems}
              currency={currency}
            />
          </div>
        </div>

        <div className="my-4 flex flex-wrap items-center justify-between gap-3">
          <input
            className="form_input !h-[30px] !w-full sm:!max-w-[220px]"
            placeholder="⌕ Search Invoice No, Customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />

          <div className="flex flex-wrap gap-2">
            <Link
              href="/invoice/editor"
              className="btn btn_bg_primary !h-[30px] !min-w-0 !px-3"
            >
              + New Invoice
            </Link>
            <button
              onClick={handleExport}
              className="btn btn_bg_light !h-[30px] flex gap-2 !border !border-[var(--border-color)] !px-3"
            >
              <svg
                className="w-5 h-5 text-[var(--primary)]"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M13 11.15V4a1 1 0 1 0-2 0v7.15L8.78 8.374a1 1 0 1 0-1.56 1.25l4 5a1 1 0 0 0 1.56 0l4-5a1 1 0 1 0-1.56-1.25L13 11.15Z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M9.657 15.874 7.358 13H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2.358l-2.3 2.874a3 3 0 0 1-4.685 0ZM17 16a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H17Z"
                  clipRule="evenodd"
                />
              </svg>
              Export
            </button>
            <div className="relative">
              <button
                onClick={() => setShowColumns(!showColumns)}
                className="rounded border px-4 py-2 btn btn_bg_light"
              >
                Columns
              </button>

              {showColumns && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded border bg-white p-3 shadow-lg">
                  {Object.entries(visibleColumns).map(([key, visible]) => (
                    <label key={key} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={(e) =>
                          setVisibleColumns((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                      {key === "invoiceNo"
                        ? "Invoice No"
                        : key === "taxAmount"
                          ? "Tax Amount"
                          : key === "subTotal"
                            ? "Sub Total"
                            : key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="overflow-x-auto rounded-md border border-[var(--border-color)] bg-[var(--surface)]">
          <table className="w-full min-w-[750px] border-collapse">
            <thead>
              <tr>
                {visibleColumns.invoiceNo && <th>Invoice No</th>}
                {visibleColumns.date && <th>Date</th>}
                {visibleColumns.customer && <th>Customer</th>}
                {visibleColumns.items && <th>Items</th>}
                {visibleColumns.subTotal && <th>Sub Total</th>}
                {visibleColumns.tax && <th>Tax %</th>}
                {visibleColumns.taxAmount && <th>Tax Amt</th>}
                {visibleColumns.total && <th>Total</th>}
                {visibleColumns.actions && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-5 text-center">
                    Loading invoices...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="p-5 text-center text-red-500">
                    {error}
                    <button onClick={loadDashboard} className="ml-2 underline">
                      Retry
                    </button>
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-5 text-center">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr key={invoice.invoiceID}>
                    {visibleColumns.invoiceNo && (
                      <td>{invoice.invoiceNo ?? "-"}</td>
                    )}

                    {visibleColumns.date && (
                      <td>{formatDate(invoice.invoiceDate)}</td>
                    )}

                    {visibleColumns.customer && <td>{invoice.customerName}</td>}

                    {visibleColumns.items && <td>{invoice.totalItems}</td>}

                    {visibleColumns.subTotal && (
                      <td>{formatMoney(invoice.subTotal, currency)}</td>
                    )}

                    {visibleColumns.tax && <td>{invoice.taxPercentage}%</td>}

                    {visibleColumns.taxAmount && (
                      <td>{formatMoney(invoice.taxAmount, currency)}</td>
                    )}

                    {visibleColumns.total && (
                      <td>{formatMoney(invoice.invoiceAmount, currency)}</td>
                    )}

                    {visibleColumns.actions && (
                      <td>
                        <div className="flex gap-2 text-[var(--text-muted)]">
                          <Link
                            href={`/invoice/editor?invoiceID=${invoice.invoiceID}`}
                            aria-label="Edit invoice"
                            className="inline-flex"
                          >
                            <svg
                              className="w-5 h-5 text-gray-800"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"
                              />
                            </svg>
                          </Link>
                          <button
                            aria-label="Delete invoice"
                            onClick={() => handleDelete(invoice.invoiceID)}
                          >
                            <svg
                              className="w-5 h-5 text-gray-800"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-color)] px-3 py-2 text-[10px] text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <label htmlFor="rowsPerPage" className="form_label">
                Rows per page:
              </label>

              <select
                id="rowsPerPage"
                className="form_input !h-[25px] !w-[55px] !px-1 !text-[10px]"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="px-1 disabled:opacity-40"
              >
                ‹
              </button>

              <span>
                {currentPage} / {Math.max(totalPages, 1)}
              </span>

              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="px-1 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
