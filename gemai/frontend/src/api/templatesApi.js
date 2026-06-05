const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const templatesApi = {
  async getTemplates() {
    const res = await fetch(`${API_URL}/api/templates`);
    if (!res.ok) {
      let errMsg = "Failed to load templates";
      try {
        const data = await res.json();
        errMsg = data.error || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json();
  }
};
