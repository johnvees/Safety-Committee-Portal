// Base URL for the backend API server.
// Uses window.location.hostname so the app works on any device connected to the same LAN.
const BASE = `http://${window.location.hostname}:3001`;

/**
 * Generic HTTP helper that wraps fetch with JSON headers and error handling.
 * All API functions below call this instead of fetch directly.
 *
 * @param {string} url - Full request URL
 * @param {RequestInit} options - fetch options (method, body, etc.)
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} with .status set to the HTTP status code on failure
 */
async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    // Try to read the server's error message; fall back to a generic one
    let body = {};
    try { body = await res.json(); } catch {}
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.status = res.status; // Attach status so callers can branch on 401, etc.
    throw err;
  }
  return res.json();
}

/**
 * Centralized API client object.
 * Every method corresponds to one backend endpoint.
 * Import this object and call e.g. api.getFindings() instead of writing fetch() calls inline.
 */
export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  /** Authenticate a user. Returns the full user object (id, name, role, etc.) */
  login: (username, password) => request(`${BASE}/login`, { method: 'POST', body: JSON.stringify({ username, password }) }),

  // ── Users ─────────────────────────────────────────────────────────────────
  /** Fetch all registered users (admin only in the UI, but no server guard here) */
  getUsers: () => request(`${BASE}/users`),
  /** Create a new user account */
  createUser: (data) => request(`${BASE}/users`, { method: 'POST', body: JSON.stringify(data) }),
  /** Update an existing user's details (name, role, password, etc.) */
  updateUser: (id, data) => request(`${BASE}/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  /** Permanently delete a user account */
  deleteUser: (id) => request(`${BASE}/users/${id}`, { method: 'DELETE' }),

  // ── Findings ──────────────────────────────────────────────────────────────
  /** Fetch the full list of findings (photos stripped server-side for performance) */
  getFindings: () => request(`${BASE}/findings`),
  /** Fetch a single finding by ID — includes photos */
  getFinding: (id) => request(`${BASE}/findings/${id}`),
  /** Create a new finding record */
  createFinding: (data) => request(`${BASE}/findings`, { method: 'POST', body: JSON.stringify(data) }),
  /** Partially update a finding (PATCH merges only the provided fields) */
  updateFinding: (id, data) => request(`${BASE}/findings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  /** Permanently delete a finding and all its associated data */
  deleteFinding: (id) => request(`${BASE}/findings/${id}`, { method: 'DELETE' }),

  // ── Deletion Log ──────────────────────────────────────────────────────────
  /** Fetch the audit log of deleted findings (shown in Notifications) */
  getDeletionLog: () => request(`${BASE}/deletionLog`),
  /** Append one deletion entry to the audit log */
  addDeletionLog: (data) => request(`${BASE}/deletionLog`, { method: 'POST', body: JSON.stringify(data) }),

  // ── Guideline Documents ───────────────────────────────────────────────────
  /** Fetch all uploaded guideline / SOP documents */
  getGuidelineDocs: () => request(`${BASE}/guidelineDocs`),
  /** Fetch a single guideline document by ID */
  getGuidelineDoc: (id) => request(`${BASE}/guidelineDocs/${id}`),
  /** Upload / create a new guideline document record */
  createGuidelineDoc: (data) => request(`${BASE}/guidelineDocs`, { method: 'POST', body: JSON.stringify(data) }),
  /** Replace an existing guideline document (full PUT replacement) */
  updateGuidelineDoc: (id, data) => request(`${BASE}/guidelineDocs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  /** Delete a guideline document */
  deleteGuidelineDoc: (id) => request(`${BASE}/guidelineDocs/${id}`, { method: 'DELETE' }),
};
