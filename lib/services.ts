
import { apiRequest, type AuthResponse } from "./api";

// ---------------- Auth ----------------

export type LoginPayload = { email: string; password: string; rememberMe: boolean };

export const authApi = {
  login: (payload: LoginPayload) =>
    apiRequest<AuthResponse>("auth/login", { method: "POST", body: payload, auth: false }),

  signup: (form: FormData) =>
    apiRequest<AuthResponse>("auth/signup", { method: "POST", body: form, auth: false }),
};

// ---------------- Items ----------------

export type Item = {
  itemID: number;
  itemName: string;
  description: string | null;
  salesRate: number;
  discountPct: number;
  updatedOn: string | null;
};

export type LookupItem = { itemID: number; itemName: string };

export type SaveItemPayload = {
  itemID: number;
  itemName: string;
  description: string | null;
  salesRate: number;
  discountPct: number;
  updatedOn: string | null;
};

export type SaveResult = {
  primaryKeyID: number;
  updatedOn: string | null;
  additionalResponseData?: Record<string, number> | null;
};

export const itemApi = {
  getList: () => apiRequest<Item[]>("item/getlist"),
  getOne: async (itemID: number) => {
    const rows = await apiRequest<Item[]>("item/getlist", { query: { itemID } });
    return rows?.[0] ?? null;
  },
  getLookupList: () => apiRequest<LookupItem[]>("item/getlookuplist"),
  save: (payload: SaveItemPayload) =>
    apiRequest<SaveResult>("item", {
      method: payload.itemID > 0 ? "PUT" : "POST",
      body: payload,
    }),
  remove: (itemID: number) => apiRequest<unknown>(`item/${itemID}`, { method: "DELETE" }),
};

// ---------------- Invoices ----------------

export type InvoiceRow = {
  invoiceID: number;
  invoiceNo: number | string | null;
  invoiceDate: string;
  customerName: string;
  totalItems: number;
  subTotal: number;
  taxPercentage: number;
  taxAmount: number;
  invoiceAmount: number;
  updatedOn: string | null;
};

export type InvoiceLine = {
  rowNo: number;
  itemID: number | null;
  description: string | null;
  quantity: number;
  rate: number;
  discountPct: number;
};

export type InvoiceDetail = InvoiceRow & {
  address: string | null;
  city: string | null;
  notes: string | null;
  lines: InvoiceLine[];
};

export type SaveInvoicePayload = {
  invoiceID: number;
  invoiceNo: number | null;
  invoiceDate: string;
  customerName: string;
  address: string | null;
  city: string | null;
  taxPercentage: number;
  notes: string | null;
  lines: InvoiceLine[];
  updatedOn: string | null;
};

export type Metrics = { invoiceCount: number; totalAmount: number };
export type TrendPoint = { monthStart: string; invoiceCount: number; amountSum: number };
export type TopItem = { itemID: number | null; itemName: string; amountSum: number };

export type DateRange = { from?: string; to?: string };

export const invoiceApi = {
  getList: (range: DateRange = {}) =>
    apiRequest<InvoiceRow[]>("invoice/getlist", { query: range }),
  getOne: (invoiceID: number) => apiRequest<InvoiceDetail>(`invoice/${invoiceID}`),
  getMetrics: async (range: DateRange) => {
    const res = await apiRequest<Metrics[] | Metrics>("invoice/getmetrices", { query: range });
    const row = Array.isArray(res) ? res[0] : res;
    return { invoiceCount: row?.invoiceCount ?? 0, totalAmount: row?.totalAmount ?? 0 };
  },
  getTrend12m: () => apiRequest<TrendPoint[]>("invoice/gettrend12m"),
  getTopItems: (range: DateRange, topN = 5) =>
    apiRequest<TopItem[]>("invoice/topitems", { query: { ...range, topN } }),
  save: (payload: SaveInvoicePayload) =>
    apiRequest<SaveResult>("invoice", {
      method: payload.invoiceID > 0 ? "PUT" : "POST",
      body: payload,
    }),
  remove: (invoiceID: number) =>
    apiRequest<unknown>(`invoice/${invoiceID}`, { method: "DELETE" }),
};
