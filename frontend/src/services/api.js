const API_URL = 'http://localhost:3001';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const authAPI = {
  getNonce: async (wallet) => {
    const res = await fetch(`${API_URL}/auth/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet })
    });
    if (!res.ok) throw new Error('Failed to get nonce');
    return res.json();
  },

  verify: async (wallet, signature) => {
    const res = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, signature })
    });
    if (!res.ok) throw new Error('Failed to verify signature');
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error('Failed to get user');
    return res.json();
  }
};

export const projectsAPI = {
  getApproved: async () => {
    const res = await fetch(`${API_URL}/projects/approved`);
    if (!res.ok) throw new Error('Failed to get projects');
    return res.json();
  },

  getAll: async (status = null) => {
    const url = status ? `${API_URL}/projects?status=${status}` : `${API_URL}/projects`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to get projects');
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${API_URL}/projects/${id}`);
    if (!res.ok) throw new Error('Failed to get project');
    return res.json();
  },

  create: async (projectData) => {
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(projectData)
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  approve: async (id) => {
    const res = await fetch(`${API_URL}/projects/${id}/approve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error('Failed to approve project');
    return res.json();
  },

  reject: async (id, reason = '') => {
    const res = await fetch(`${API_URL}/projects/${id}/reject`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error('Failed to reject project');
    return res.json();
  },

  getMyProjects: async () => {
    const res = await fetch(`${API_URL}/projects/user/my-projects`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to get projects');
    return res.json();
  }
};
