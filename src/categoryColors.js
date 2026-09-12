// One consistent color per spending/income category, used across the
// Dashboard's Top Spending widget and the Transactions view's donut charts —
// matches the fixed category list in the backend's categorize.js.
export const CATEGORY_COLORS = {
  "Rent & Utilities": "#059669",
  "Feeding & Groceries": "#0D9488",
  "Transport": "#2563EB",
  "Data & Airtime": "#7C3AED",
  "Subscriptions": "#DB2777",
  "Savings & Investments": "#D97706",
  "Shopping": "#DC2626",
  "Health": "#0891B2",
  "Entertainment": "#9333EA",
  "Cash Withdrawal": "#65A30D",
  "Income": "#059669",
  "Fees & Charges": "#71717A",
  "Transfers": "#4F46E5",
  "Other": "#9CA3AF",
};

export function colorFor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
}
