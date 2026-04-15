const BASE = `http://${window.location.hostname}:3001`;

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch {}
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  login: (username, password) => request(`${BASE}/login`, { method: 'POST', body: JSON.stringify({ username, password }) }),
  getUsers: () => request(`${BASE}/users`),
  createUser: (data) => request(`${BASE}/users`, { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`${BASE}/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`${BASE}/users/${id}`, { method: 'DELETE' }),

  getFindings: () => request(`${BASE}/findings`),
  getFinding: (id) => request(`${BASE}/findings/${id}`),
  createFinding: (data) => request(`${BASE}/findings`, { method: 'POST', body: JSON.stringify(data) }),
  updateFinding: (id, data) => request(`${BASE}/findings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteFinding: (id) => request(`${BASE}/findings/${id}`, { method: 'DELETE' }),

  getGuidelineDocs: () => request(`${BASE}/guidelineDocs`),
  getGuidelineDoc: (id) => request(`${BASE}/guidelineDocs/${id}`),
  createGuidelineDoc: (data) => request(`${BASE}/guidelineDocs`, { method: 'POST', body: JSON.stringify(data) }),
  updateGuidelineDoc: (id, data) => request(`${BASE}/guidelineDocs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGuidelineDoc: (id) => request(`${BASE}/guidelineDocs/${id}`, { method: 'DELETE' }),
};
