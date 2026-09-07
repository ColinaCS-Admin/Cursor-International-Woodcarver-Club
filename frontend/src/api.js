const TOKEN_KEY = "iwc_token";

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export const api = {
  login: (identifier, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (identifier) =>
    request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),
  resetPassword: (token, password) =>
    request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
  me: () => request("/api/auth/me"),
  members: () => request("/api/members"),
  updateStatus: (id, active_ind) =>
    request(`/api/members/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ active_ind }),
    }),
  countries: () => request("/api/countries"),
  states: (country_code) => request(`/api/states?country_code=${encodeURIComponent(country_code)}`),
  craftSkills: () => request("/api/craft-skills"),
  tiers: () => request("/api/tiers"),
  genders: () => request("/api/genders"),
  languages: () => request("/api/languages"),
};
