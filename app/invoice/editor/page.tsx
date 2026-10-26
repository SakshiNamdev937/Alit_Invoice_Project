"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  invoiceApi,
  itemApi,
  type LookupItem,
  type InvoiceLine,
} from "@/lib/services";
import { errorMessage, getCurrencySymbol } from "@/lib/api";
import { formatMoney, toIsoDate } from "@/lib/format";

type DraftLine = {
  itemID: number | null;
  description: string;
  quantity: string;
  rate: string;
  discountPct: string;
};

const emptyLine = (): DraftLine => ({
  itemID: null,
  description: "",
  quantity: "1",
  rate: "0",
  discountPct: "0",
});

export default function InvoiceEditor() {
  const router = useRouter();

  const [invoiceDate, setInvoiceDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);

  const [availableItems, setAvailableItems] = useState<LookupItem[]>([]);
  const [currency, setCurrency] = useState("");
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
     setInvoiceDate(toIsoDate(new Date()));
    let active = true;

    async function loadItems() {
      try {
        const data = await itemApi.getLookupList();

        if (active) {
          setAvailableItems(data ?? []);
          setCurrency(getCurrencySymbol());
        }
      } catch (err) {
        if (active) setError(errorMessage(err));
      } finally {
        if (active) setLoadingItems(false);
      }
    }

    loadItems();

    return () => {
      active = false;
    };
  }, []);

  const lineAmounts = lines.map((line) => {
    const quantity = Number(line.quantity) || 0;
    const rate = Number(line.rate) || 0;
    const discount = Number(line.discountPct) || 0;

    return quantity * rate * (1 - discount / 100);
  });

  const subtotal = lineAmounts.reduce((sum, amount) => sum + amount, 0);
  const taxRate = Number(taxPercentage) || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const invoiceAmount = subtotal + taxAmount;

  function updateLine(index: number, changes: Partial<DraftLine>) {
    setLines((previous) =>
      previous.map((line, i) => (i === index ? { ...line, ...changes } : line)),
    );
  }

  async function handleItemChange(index: number, value: string) {
    const itemID = value ? Number(value) : null;

    updateLine(index, {
      itemID,
      description: "",
      rate: "0",
    });

    if (itemID === null) return;

    try {
      setError("");
      const item = await itemApi.getOne(itemID);

      if (item) {
        updateLine(index, {
          itemID,
          description: item.description ?? "",
          rate: String(item.salesRate),
          discountPct: String(item.discountPct),
        });
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!customerName.trim()) {
      setError("Please enter customer name.");
      return;
    }

    if (!lines.length || lines.some((line) => !line.itemID)) {
      setError("Please select an item for every row.");
      return;
    }

    const invalidLine = lines.some((line) => {
      const qty = Number(line.quantity);
      const rate = Number(line.rate);
      const discount = Number(line.discountPct);

      return (
        !line.quantity.trim() ||
        !line.rate.trim() ||
        !Number.isFinite(qty) ||
        qty <= 0 ||
        !Number.isFinite(rate) ||
        rate < 0 ||
        !Number.isFinite(discount) ||
        discount < 0 ||
        discount > 100
      );
    });

    if (invalidLine) {
      setError("Check quantity, rate and discount values.");
      return;
    }

    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      setError("Tax must be between 0 and 100.");
      return;
    }

    const invoiceLines: InvoiceLine[] = lines.map((line, index) => ({
      rowNo: index + 1,
      itemID: line.itemID,
      description: line.description.trim() || null,
      quantity: Number(line.quantity),
      rate: Number(line.rate),
      discountPct: Number(line.discountPct),
    }));

    try {
      setSaving(true);

      await invoiceApi.save({
        invoiceID: 0,
        invoiceNo: null,
        invoiceDate,
        customerName: customerName.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        taxPercentage: taxRate,
        notes: notes.trim() || null,
        lines: invoiceLines,
        updatedOn: null,
      });

      router.push("/invoices");
    } catch (err) {
      setError(errorMessage(err, "Unable to save invoice."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="flex items-center justify-between border border-[var(--border-color)] bg-[var(--surface)] px-4 py-2">
        <h1 className="text-sm font-normal">New Invoice</h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-xs text-[var(--text-secondary)]"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="invoiceForm"
            disabled={saving || loadingItems}
            className="rounded bg-[var(--button-bg)] px-4 py-1.5 text-xs text-[var(--button-text)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <form id="invoiceForm" onSubmit={handleSubmit}>
        <main className="mx-auto max-w-[800px] space-y-3 px-4 py-4">
          <section className="container !p-3">
            <h2 className="mb-4 text-xs font-normal">Invoice Details</h2>

            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <label className="form_label mb-1 block">Invoice No</label>
                <input
                  className="form_input"
                  placeholder="Auto-generated"
                  readOnly
                />
                <p className="mt-1 text-[9px] text-[var(--text-muted)]">
                  Number assigned by the backend
                </p>
              </div>

              <div>
                <label className="form_label mb-1 block">Invoice Date *</label>
                <input
                  className="form_input"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form_label mb-1 block">Customer Name *</label>
                <input
                  className="form_input"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form_label mb-1 block">City</label>
                <input
                  className="form_input"
                  placeholder="Enter city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="form_label mb-1 block">Address</label>
                <textarea
                  className="form_input !h-[54px] resize-none"
                  placeholder="Enter address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="form_label mb-1 block">Notes</label>
                <textarea
                  className="form_input !h-[54px] resize-none"
                  placeholder="Additional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="container !min-h-[230px] !p-3">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-normal">Line Items</h2>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="rounded border border-[var(--border-color)] px-2 py-1.5 text-[10px]"
                  onClick={() => setLines((prev) => [...prev, emptyLine()])}
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
              </svg> Add Row
                </button>

                <button
                  type="button"
                  className="rounded border border-[var(--border-color)] px-2 py-1.5 text-[10px]"
                  onClick={() =>
                    setLines((prev) => [...prev, { ...prev[prev.length - 1] }])
                  }
                  disabled={lines.length === 0}
                >
                  ▣ Copy
                </button>

                <button
                  type="button"
                  className="rounded border border-[var(--border-color)] px-2 py-1.5 text-[10px]"
                  onClick={() =>
                    setLines((prev) =>
                      prev.length > 1 ? prev.slice(0, -1) : [emptyLine()],
                    )
                  }
                >
                  ▤ Remove Last
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse">
                <thead>
                  <tr>
                    <th className="px-1">S.No</th>
                    <th className="px-1">Item *</th>
                    <th className="px-1">Description</th>
                    <th className="px-1 text-center">Qty *</th>
                    <th className="px-1 text-center">Rate *</th>
                    <th className="px-1 text-center">Disc %</th>
                    <th className="px-1 text-right">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className="px-1">{index + 1}</td>

                      <td className="px-1">
                        <select
                          className="form_input !h-[27px] !px-1 !text-[10px]"
                          value={line.itemID ?? ""}
                          onChange={(e) =>
                            handleItemChange(index, e.target.value)
                          }
                          required
                        >
                          <option value="">
                            {loadingItems ? "Loading..." : "Select item..."}
                          </option>
                          {availableItems.map((item) => (
                            <option key={item.itemID} value={item.itemID}>
                              {item.itemName}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-1">
                        <input
                          className="form_input !h-[27px] !px-1 !text-[10px]"
                          placeholder="Description"
                          value={line.description}
                          onChange={(e) =>
                            updateLine(index, { description: e.target.value })
                          }
                        />
                      </td>

                      <td className="px-1">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          className="form_input !h-[27px] !px-1 !text-right !text-[10px]"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(index, { quantity: e.target.value })
                          }
                          required
                        />
                      </td>

                      <td className="px-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form_input !h-[27px] !px-1 !text-right !text-[10px]"
                          value={line.rate}
                          onChange={(e) =>
                            updateLine(index, { rate: e.target.value })
                          }
                          required
                        />
                      </td>

                      <td className="px-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="form_input !h-[27px] !px-1 !text-right !text-[10px]"
                          value={line.discountPct}
                          onChange={(e) =>
                            updateLine(index, { discountPct: e.target.value })
                          }
                        />
                      </td>

                      <td className="px-1 text-right">
                        {formatMoney(lineAmounts[index], currency)}
                      </td>
                    </tr>
                  ))}

                  <tr>
                    <td
                      colSpan={6}
                      className="bg-[var(--background)] px-2 text-right"
                    >
                      Subtotal:
                    </td>
                    <td className="bg-[var(--background)] px-1 text-right">
                      {formatMoney(subtotal, currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="container !p-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <h2 className="text-xs font-normal">Invoice Totals</h2>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="form_label">Sub Total</label>
                  <span className="w-24 rounded bg-[var(--background)] px-2 py-1 text-right text-[10px]">
                    {formatMoney(subtotal, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="form_label">Tax</label>
                  <div className="flex gap-1">
                    <div className="relative w-[75px]">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="form_input !h-[27px] !pr-5 !text-right !text-[10px]"
                        value={taxPercentage}
                        onChange={(e) => setTaxPercentage(e.target.value)}
                      />
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-muted)]">
                        %
                      </span>
                    </div>

                    <span className="form_input !h-[27px] !w-[100px] !text-right !text-[10px]">
                      {formatMoney(taxAmount, currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded bg-[var(--background)] px-2 py-3">
                  <span className="text-xs">Invoice Amount</span>
                  <span className="text-base">
                    {formatMoney(invoiceAmount, currency)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </main>
      </form>
    </div>
  );
}
