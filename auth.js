// auth.js — Public murid (tanpa login) + Admin superadmin (Supabase login)

window.__skipLoadDataOnBoot = true;

document.addEventListener('DOMContentLoaded', async () => {
  const loginContainer = document.getElementById('login-container');
  const appLayout = document.querySelector('.app-layout');

  if (appLayout) appLayout.style.display = 'flex';
  if (loginContainer) loginContainer.style.display = 'none';

  window.__adminAuthenticated = ApiClient.admin.isAuthenticated();

  try {
    if (ApiClient.admin.isAuthenticated()) {
      const serverState = await ApiClient.admin.getState();
      applyServerStateToLocal(serverState);
      if (typeof window.hydrateAppStateFromServer === 'function') {
        window.hydrateAppStateFromServer(serverState);
      }
    } else if (typeof window.loadDataFromApi === 'function') {
      const loaded = await window.loadDataFromApi();
      if (!loaded && typeof window.loadData === 'function') {
        window.loadData();
      }
    } else if (typeof window.loadData === 'function') {
      window.loadData();
    }
  } catch (err) {
    console.warn('Gagal load dari API, fallback localStorage:', err.message);
    if (typeof window.loadData === 'function') window.loadData();
  }

  setupAdminLogin();
});

function setupAdminLogin() {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginErrorText = document.getElementById('login-error-text');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit-btn');
  const spinner = document.getElementById('login-spinner');
  const submitText = document.querySelector('.admin-login-submit-text');
  const togglePwBtn = document.getElementById('login-toggle-pw');
  const togglePwIcon = document.getElementById('login-toggle-pw-icon');
  const loginContainer = document.getElementById('login-container');

  if (!loginForm) return;

  if (togglePwBtn && passwordInput) {
    togglePwBtn.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      if (togglePwIcon) {
        togglePwIcon.textContent = isHidden ? 'visibility_off' : 'visibility';
      }
      togglePwBtn.setAttribute('aria-label', isHidden ? 'Sembunyikan password' : 'Tampilkan password');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && loginContainer?.classList.contains('is-open')) {
      cancelAdminLogin();
    }
  });

  function showLoginError(msg) {
    if (loginError && loginErrorText) {
      loginErrorText.textContent = msg;
      loginError.style.display = 'flex';
    }
  }

  function hideLoginError() {
    if (loginError) loginError.style.display = 'none';
  }

  function setLoginLoading(loading) {
    if (submitBtn) submitBtn.disabled = loading;
    if (spinner) spinner.style.display = loading ? 'block' : 'none';
    if (submitText) submitText.style.opacity = loading ? '0.7' : '1';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideLoginError();

    const email = emailInput?.value?.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      showLoginError('Harap isi email dan password.');
      return;
    }

    if (!window.SUPABASE_IS_CONFIGURED || !window.supabaseClient) {
      showLoginError('Supabase belum dikonfigurasi. Buka file supabaseClient.js.');
      return;
    }

    setLoginLoading(true);

    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

      if (error) {
        showLoginError(error.message);
        return;
      }

      if (data?.session?.access_token) {
        ApiClient.admin.setToken(data.session.access_token);
        window.__adminAuthenticated = true;

        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';

        hideAdminLogin();
        await syncAdminDataFromServer();

        if (typeof window.onAdminAuthenticated === 'function') {
          window.onAdminAuthenticated();
        }
      }
    } catch (err) {
      showLoginError(err.message || 'Gagal masuk. Coba lagi.');
    } finally {
      setLoginLoading(false);
    }
  });
}

async function syncAdminDataFromServer() {
  try {
    const serverState = await ApiClient.admin.getState();
    if (serverState && (serverState.subjects?.length > 0 || serverState.students?.length > 0)) {
      applyServerStateToLocal(serverState);
      if (typeof window.hydrateAppStateFromServer === 'function') {
        window.hydrateAppStateFromServer(serverState);
      }
      return;
    }
  } catch (err) {
    console.warn('Gagal ambil state admin dari server:', err.message);
  }

  await pushLocalStorageToServer();
}

function applyServerStateToLocal(state) {
  window.__isSyncing = true;
  const suffix = getTermSuffixFromState(state);

  localStorage.setItem('sigrade_active_term', JSON.stringify({
    academicYear: state.academicYear,
    semester: state.semester,
  }));
  localStorage.setItem('sigrade_publish_grades', String(state.publishGrades !== false));
  localStorage.setItem(`sigrade_teachers_${suffix}`, JSON.stringify(state.teachers || []));
  localStorage.setItem(`sigrade_subjects_${suffix}`, JSON.stringify(state.subjects || []));
  localStorage.setItem(`sigrade_students_${suffix}`, JSON.stringify(state.students || []));
  localStorage.setItem(`sigrade_classes_${suffix}`, JSON.stringify(state.classes || []));
  window.__isSyncing = false;
}

function getTermSuffixFromState(state) {
  const yearStr = (state.academicYear || '2023/2024').replace(/\//g, '-');
  const semStr = (state.semester || 'Ganjil (I)').toLowerCase();
  return `${yearStr}_${semStr}`;
}

async function pushLocalStorageToServer() {
  if (!ApiClient.admin.isAuthenticated()) return;

  const suffix = typeof window.getTermSuffix === 'function' ? window.getTermSuffix() : '2023-2024_ganjil';
  const keys = {
    sigrade_active_term: localStorage.getItem('sigrade_active_term') || JSON.stringify({ academicYear: '2023/2024', semester: 'Ganjil' }),
    sigrade_publish_grades: localStorage.getItem('sigrade_publish_grades') || 'true',
    [`sigrade_teachers_${suffix}`]: localStorage.getItem(`sigrade_teachers_${suffix}`) || '[]',
    [`sigrade_subjects_${suffix}`]: localStorage.getItem(`sigrade_subjects_${suffix}`) || '[]',
    [`sigrade_students_${suffix}`]: localStorage.getItem(`sigrade_students_${suffix}`) || '[]',
    [`sigrade_classes_${suffix}`]: localStorage.getItem(`sigrade_classes_${suffix}`) || '[]',
  };

  try {
    await ApiClient.admin.syncKeys(keys);
  } catch (err) {
    console.warn('Gagal push data ke server:', err.message);
  }
}

function showAdminLogin() {
  const loginContainer = document.getElementById('login-container');
  const emailInput = document.getElementById('login-email');
  const loginError = document.getElementById('login-error');

  if (loginContainer) {
    loginContainer.style.display = 'flex';
    loginContainer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  if (loginError) loginError.style.display = 'none';

  setTimeout(() => {
    if (emailInput) emailInput.focus();
  }, 200);
}

function hideAdminLogin() {
  const loginContainer = document.getElementById('login-container');
  if (loginContainer) {
    loginContainer.classList.remove('is-open');
    loginContainer.style.display = 'none';
    document.body.style.overflow = '';
  }
}

window.requireAdminAuth = async function requireAdminAuth() {
  if (ApiClient.admin.isAuthenticated()) {
    window.__adminAuthenticated = true;
    return true;
  }
  showAdminLogin();
  return false;
};

window.onAdminAuthenticated = function onAdminAuthenticated() {
  hideAdminLogin();
  if (typeof window.switchView === 'function') {
    window.switchView('guru');
  } else if (typeof window.openRoleSelectionModal === 'function') {
    window.openRoleSelectionModal();
  }
};

window.cancelAdminLogin = function cancelAdminLogin() {
  hideAdminLogin();
  if (typeof window.syncModeToggleActive === 'function') {
    window.syncModeToggleActive('siswa');
  }
  if (typeof window.actualSwitchView === 'function') {
    window.actualSwitchView('siswa');
  }
};

async function handleLogout() {
  ApiClient.admin.setToken(null);
  ApiClient.teacher.setKey(null);
  window.__adminAuthenticated = false;
  sessionStorage.removeItem('teacher_authenticated');
  sessionStorage.removeItem('active_teacher_role');

  if (window.supabaseClient) {
    await window.supabaseClient.auth.signOut();
  }

  if (typeof window.syncModeToggleActive === 'function') {
    window.syncModeToggleActive('siswa');
  }
  if (typeof window.actualSwitchView === 'function') {
    window.actualSwitchView('siswa');
  }
  hideAdminLogin();
}

window.handleLogout = handleLogout;

const originalSetItem = localStorage.setItem;
localStorage.setItem = function localStorageSetItem(key, value) {
  originalSetItem.apply(this, arguments);

  if (!window.__isSyncing && key.startsWith('sigrade_')) {
    if (ApiClient.admin.isAuthenticated()) {
      ApiClient.admin.syncKeys({ [key]: value }).catch((err) => {
        console.warn('Gagal sync ke server:', err.message);
      });
    } else if (typeof window.scheduleServerSync === 'function') {
      window.scheduleServerSync();
    }
  }
};
