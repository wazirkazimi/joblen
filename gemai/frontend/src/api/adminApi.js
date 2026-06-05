const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getHeaders() {
  const token = localStorage.getItem("gemify_admin_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    let errMsg = "An error occurred";
    try {
      const data = await res.json();
      errMsg = data.error || errMsg;
    } catch (e) {}
    throw new Error(errMsg);
  }
  return res.json();
}

export const adminApi = {
  async login(username, password) {
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem("gemify_admin_token", data.token);
    }
    return data;
  },

  logout() {
    localStorage.removeItem("gemify_admin_token");
  },

  isAuthenticated() {
    return !!localStorage.getItem("gemify_admin_token");
  },

  async getDashboard() {
    const res = await fetch(`${API_URL}/api/admin/dashboard`, {
      method: "GET",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getTemplates() {
    const res = await fetch(`${API_URL}/api/admin/templates`, {
      method: "GET",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createTemplate(templateData) {
    const res = await fetch(`${API_URL}/api/admin/templates`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(templateData)
    });
    return handleResponse(res);
  },

  async updateTemplate(id, templateData) {
    const res = await fetch(`${API_URL}/api/admin/templates/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(templateData)
    });
    return handleResponse(res);
  },

  async deleteTemplate(id) {
    const res = await fetch(`${API_URL}/api/admin/templates/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getGenerations(filters = {}) {
    const params = new URLSearchParams();
    if (filters.dateRange) params.append("dateRange", filters.dateRange);
    if (filters.templateId) params.append("templateId", filters.templateId);
    if (filters.status) params.append("status", filters.status);

    const queryStr = params.toString();
    const url = `${API_URL}/api/admin/generations${queryStr ? `?${queryStr}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getAnalytics() {
    const res = await fetch(`${API_URL}/api/admin/analytics`, {
      method: "GET",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getSettings() {
    const res = await fetch(`${API_URL}/api/admin/settings`, {
      method: "GET",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async updateSettings(settings) {
    const res = await fetch(`${API_URL}/api/admin/settings`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ settings })
    });
    return handleResponse(res);
  }
};
