"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { TrendPoint, TopItem } from "@/lib/services";
import { formatMonth, formatMoney } from "@/lib/format";

type Props = {
  trend: TrendPoint[];
  topItems: TopItem[];
  currency: string;
};

const COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function InvoiceCharts({ trend, topItems, currency }: Props) {
  const trendData = trend.map((item) => ({
    month: formatMonth(item.monthStart),
    amount: item.amountSum,
  }));

  const pieData = topItems.map((item) => ({
    name: item.itemName,
    value: item.amountSum,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Monthly Revenue */}
      <div className="rounded-md border border-[var(--border-color)] bg-[var(--surface)] p-3">
        <h3 className="mb-3 text-xs font-medium">Monthly Revenue</h3>

        <div className="h-[240px] w-full">
          {trendData.length === 0 ? (
            <p className="py-10 text-center text-xs text-gray-500">
              No trend data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  width={65}
                  tickFormatter={(value) => Number(value).toLocaleString()}
                />
                <Tooltip
                  formatter={(value) => [
                    formatMoney(Number(value), currency),
                    "Revenue",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Items */}
      <div className="rounded-md border border-[var(--border-color)] bg-[var(--surface)] p-3">
        <h3 className="mb-3 text-xs font-medium">Top 5 Items</h3>

        <div className="h-[240px] w-full">
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-xs text-gray-500">
              No item data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label
                >
                  {pieData.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => [
                    formatMoney(Number(value), currency),
                    "Amount",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
