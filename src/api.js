const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

/**
 * Stand-in for real auth. Generates a random ID once per browser and keeps
 * reusing it, so the same "user" comes back across sessions during
 * development. Swap this whole function for real login before this goes
 * anywhere near actual users — anyone with the ID could read that user's
 * accounts, since the backend has no real auth check yet either
 * (see requireUser in routes/mono.js and routes/finance.js).
 */
function getUserId() {
  let id = localStorage.getItem("nv_user_id");
  if (!id) {
    id = `user_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("nv_user_id", id);
  }
  return id;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": getUserId(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  getUserId,
  getNetWorth: (rate = "parallel") => request(`/api/finance/networth?rate=${rate}`),
  getLinkedAccounts: () => request(`/api/mono/accounts`),
  unlinkAccount: (accountId) =>
    request(`/api/mono/accounts/${accountId}`, { method: "DELETE" }),
  getManualAccounts: () => request(`/api/finance/manual-accounts`),
  addManualAccount: (payload) =>
    request(`/api/finance/manual-accounts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  removeManualAccount: (id) =>
    request(`/api/finance/manual-accounts/${id}`, { method: "DELETE" }),
  getBudgetSummary: (accountId) => request(`/api/finance/budget-summary/${accountId}`),
  seedDemo: () => request(`/api/finance/demo/seed`, { method: "POST" }),
  exchangeToken: (code) =>
    request(`/api/mono/exchange-token`, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};
