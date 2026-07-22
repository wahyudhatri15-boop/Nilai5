// apiClient.js — Client untuk Public & Admin API

const ApiClient = {
  baseUrl: '',

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  },

  // ─── Public (murid) ───
  public: {
    async bootstrap() {
      return ApiClient.request('/api/public/bootstrap');
    },
    async getClasses() {
      return ApiClient.request('/api/public/classes');
    },
    async getStudents(className) {
      const q = className ? `?class=${encodeURIComponent(className)}` : '';
      return ApiClient.request(`/api/public/students${q}`);
    },
    async getStudent(id) {
      return ApiClient.request(`/api/public/student/${encodeURIComponent(id)}`);
    },
    async getCurriculum(className) {
      return ApiClient.request(`/api/public/curriculum?class=${encodeURIComponent(className)}`);
    },
    async submitLms(payload) {
      return ApiClient.request('/api/public/lms/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async submitAssignment(payload) {
      return ApiClient.request('/api/public/assignment/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async submitCbt(payload) {
      return ApiClient.request('/api/public/cbt/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  // ─── Teacher (guru, kunci password sesi) ───
  teacher: {
    getKey() {
      return sessionStorage.getItem('teacher_sync_key') || '';
    },
    setKey(key) {
      if (key) sessionStorage.setItem('teacher_sync_key', key);
      else sessionStorage.removeItem('teacher_sync_key');
    },
    isAuthorized() {
      return sessionStorage.getItem('teacher_authenticated') === 'true'
        && Boolean(sessionStorage.getItem('teacher_sync_key'));
    },
    async saveState(state) {
      const key = ApiClient.teacher.getKey();
      if (!key) {
        throw new Error('Kunci guru tidak tersedia di sesi ini');
      }
      return ApiClient.request('/api/teacher/state', {
        method: 'PUT',
        headers: { 'X-Teacher-Key': key },
        body: JSON.stringify(state),
      });
    },
  },

  // ─── Admin (superadmin/guru) ───
  admin: {
    getToken() {
      return sessionStorage.getItem('admin_access_token');
    },
    setToken(token) {
      if (token) sessionStorage.setItem('admin_access_token', token);
      else sessionStorage.removeItem('admin_access_token');
    },
    isAuthenticated() {
      return !!sessionStorage.getItem('admin_access_token');
    },
    async getState() {
      return ApiClient.request('/api/admin/state', { token: ApiClient.admin.getToken() });
    },
    async saveState(state) {
      return ApiClient.request('/api/admin/state', {
        method: 'PUT',
        token: ApiClient.admin.getToken(),
        body: JSON.stringify(state),
      });
    },
    async syncKeys(keys) {
      return ApiClient.request('/api/admin/sync/keys', {
        method: 'POST',
        token: ApiClient.admin.getToken(),
        body: JSON.stringify({ keys }),
      });
    },
    async me() {
      return ApiClient.request('/api/admin/me', { token: ApiClient.admin.getToken() });
    },
  },
};

window.ApiClient = ApiClient;
