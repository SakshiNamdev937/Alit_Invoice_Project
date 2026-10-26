"use client";
import { Modal, Box, Button } from "@mui/material";
import AddItem from "../component/AddItem"
import { useEffect, useState } from "react";
import { itemApi, type Item } from "@/lib/services";
import { getCurrencySymbol, errorMessage } from "@/lib/api";
import { formatMoney, downloadCsv } from "@/lib/format";
export default function ItemList() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  async function fetchItems() {
    try {
      setLoading(true);
      setError("");

      const data = await itemApi.getList();
      setItems(data ?? []);
      setCurrency(getCurrencySymbol());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter((item) =>
    item.itemName.toLowerCase().includes(search.toLowerCase()),
  );

  const totalItems = filteredItems.length;

  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + rowsPerPage,
  );
  return (
    <>
      <main className="relative h-[90vh]">
        <div className="h-[85px] bg-white border-b border-[#e5e5e5] px-[50px] pt-4">
          <h1 className="title">Items</h1>
          <p className="subtitle">Manage Your Product and serving catalog</p>
        </div>

        <div className="h-[85px] bg-white border-b border-[#e5e5e5] py-[25px] px-[50px] flex justify-between">
          <div className="form_input flex gap-2 align-items-center !w-[300px]">
            <svg
              className="w-4 h-4 text-gray-800"
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
                strokeWidth="2"
                d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="border-0"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="contained"
              onClick={() => {
                (setOpen(true), setSelectedItem(null));
              }}
              className="btn btn_bg_primary !text-[11px] !rounded-md !capitalize;"
            >
              <svg
                className="w-4 h-4 text-white"
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
                  d="M5 12h14m-7 7V5"
                />
              </svg>
              Add New Item
            </Button>

            <button
              className="btn d_flex gap-2 btn_bg_light"
              onClick={() =>
                downloadCsv(
                  "items.csv",
                  ["Item Name", "Description", "Sale Rate", "Discount %"],
                  filteredItems.map((item) => [
                    item.itemName,
                    item.description ?? "",
                    item.salesRate,
                    item.discountPct,
                  ]),
                )
              }
            >
              <svg
                className="w-6 h-6 text-[var(--primary)]"
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
          </div>
        </div>

        {/* table */}
        <div className="px-[50px] my-5">
          <table className="container mx-auto">
            <thead>
              <tr>
                <th className="text-center">Picture</th>
                <th>Item Name</th>
                <th>Description</th>
                <th>Sale Rate</th>
                <th>Discount %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    Loading items...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-red-500">
                    {error}
                    <button onClick={fetchItems} className="ml-3 underline">
                      Retry
                    </button>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    No items found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.itemID}>
                    <td className="text-center">—</td>

                    <td>{item.itemName}</td>

                    <td>{item.description || "—"}</td>

                    <td>{formatMoney(item.salesRate, currency)}</td>

                    <td>{item.discountPct.toFixed(2)} %</td>

                    <td>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          aria-label={`Edit ${item.itemName}`}
                          onClick={async () => {
                            try {
                              setError("");

                              const editItem = await itemApi.getOne(
                                Number(item.itemID),
                              );

                              if (!editItem) {
                                setError("Item not found.");
                                return;
                              }

                              setSelectedItem(editItem);
                              setOpen(true);
                            } catch (err) {
                              setError(errorMessage(err));
                            }
                          }}
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
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${item.itemName}`}
                          onClick={async () => {
                            if (!window.confirm(`Delete ${item.itemName}?`)) {
                              return;
                            }

                            try {
                              setError("");
                              await itemApi.remove(item.itemID);
                              await fetchItems();
                            } catch (err) {
                              setError(errorMessage(err));
                            }
                          }}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="absolute bottom-0 w-[100%] flex items-center justify-between border border-gray-200 rounded-md px-6 py-3 text-sm text-gray-700 px-[50px] bg-white">
          <div className="flex items-center gap-3">
            <label htmlFor="rows" className="form_label d-block w-[170px]">
              Rows per page:
            </label>
            <select
              id="rows"
              className="form_input"
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
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                ‹
              </button>

              <span className="px-2">
                {currentPage} / {Math.max(totalPages, 1)}
              </span>

              <button
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={() => setCurrentPage((page) => page + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
      </main>
      {/* -------------------modal----------- */}

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
          }}
        >
          <AddItem
            initialItem={selectedItem}
            onClose={() => {
              setOpen(false);
              setSelectedItem(null);
            }}
            onSaved={async () => {
              await fetchItems();
              setOpen(false);
              setSelectedItem(null);
            }}
          />
        </Box>
      </Modal>
    </>
  );
}
