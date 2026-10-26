"use client";

import {useEffect, useState, type FormEvent } from "react";
import { Item, itemApi } from "@/lib/services";
import { errorMessage } from "@/lib/api";

type AddItemProps = {
  onSaved: () => void | Promise<void>;
  onClose: () => void;
  initialItem?: Item | null;
};

export default function AddItem({ onSaved, onClose, initialItem = null }: AddItemProps) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [saleRate, setSaleRate] = useState("");
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const rate = Number(saleRate);
    const discountPct = Number(discount);

    if (!itemName.trim()) {
      setError("Please enter item name.");
      return;
    }

    if (saleRate.trim() === "" || !Number.isFinite(rate) || rate < 0) {
      setError("Please enter a valid sale rate.");
      return;
    }

    if (
      discount.trim() === "" ||
      !Number.isFinite(discountPct) ||
      discountPct < 0 ||
      discountPct > 100
    ) {
      setError("Discount must be between 0 and 100.");
      return;
    }

    try {
      setLoading(true);
      await itemApi.save({
        itemID: initialItem?.itemID ?? 0,
        itemName: itemName.trim(),
        description: description.trim() || null,
        salesRate: Number(saleRate),
        discountPct: Number(discount),
        updatedOn: initialItem?.updatedOn ?? null,
      });

      await onSaved();
    } catch (err) {
      setError(errorMessage(err, "Unable to save item."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setItemName(initialItem?.itemName ?? "");
    setDescription(initialItem?.description ?? "");
    setSaleRate(initialItem ? String(initialItem.salesRate) : "");
    setDiscount(initialItem ? String(initialItem.discountPct) : "0");
  }, [initialItem]);
  return (
    <div className="container w-full max-w-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-light)] px-4 py-5">
        <h2 className="text-xl font-normal">
          {initialItem ? "Edit Item" : "New Item"}
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="text-2xl text-[var(--text-muted)]"
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      {/* Form */}
      <form id="newItemForm" onSubmit={handleSubmit} className="space-y-5 p-4">
        {/* Item Picture - preview only for now */}
        <div>
          <label className="form_label mb-2 block italic">Item Picture</label>

          <label className="flex h-[87px] w-[87px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--input-border)] bg-[#e9e9e9] text-xs text-[var(--text-muted)]">
            <span className="text-xl">▧</span>
            <span>Preview</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              disabled
            />
          </label>

          <p className="mt-2 text-[11px] text-[var(--helper-color)]">
            Image upload is not connected yet.
          </p>
        </div>

        {/* Item Name */}
        <div>
          <label htmlFor="itemName" className="form_label mb-2 block">
            Item Name*
          </label>

          <input
            id="itemName"
            name="itemName"
            className="form_input"
            placeholder="Enter item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            maxLength={200}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="form_label mb-2 block">
            Description
          </label>

          <textarea
            id="description"
            name="description"
            className="form_input !h-[103px] resize-none"
            placeholder="Enter item description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />

          <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
            {description.length}/500
          </p>
        </div>

        {/* Sale Rate and Discount */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="saleRate" className="form_label mb-2 block">
              Sale Rate*
            </label>

            <input
              id="saleRate"
              name="saleRate"
              type="number"
              min="0"
              step="0.01"
              className="form_input text-right"
              placeholder="0.00"
              value={saleRate}
              onChange={(e) => setSaleRate(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="discount" className="form_label mb-2 block">
              Discount %
            </label>

            <div className="relative">
              <input
                id="discount"
                name="discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="form_input pr-8 text-right"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">
                %
              </span>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-[var(--border-light)] bg-[var(--background)] px-4 py-5">
        <button
          type="button"
          className="btn btn_bg_light"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="submit"
          form="newItemForm"
          className="btn btn_bg_primary"
          disabled={loading}
        >
          {loading ? "Saving..." : initialItem ? "Update" : "Save"}
        </button>
      </div>
    </div>
  );
}
