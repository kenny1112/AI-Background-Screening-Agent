/* ── auth.js — Frontend auth logic (localStorage session) ── */

const DEMO_USERS = [
    { email: 'admin@screening.com', password: 'admin123', name: 'Kenny Chung', role: 'Lead Investigator' }
  ];
  
  const AUTH_KEY = 'screening_session';
  
  /* ── Session ── */
  function getSession() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
    catch { return null; }
  }
  
  function setSession(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }
  
  function clearSession() {
    localStorage.removeItem(AUTH_KEY);
  }
  
  function isLoggedIn() {
    return !!getSession();
  }
  
  function getUser() {
    return getSession();
  }
  
  /* ── Auth check — call at top of every protected page ── */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = '/login.html';
    }
  }
  
  /* ── Login ── */
  function login(email, password) {
    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, error: 'Invalid credentials. Try admin@screening.com / admin123' };
    const session = { email: user.email, name: user.name, role: user.role, loginAt: Date.now() };
    setSession(session);
    return { success: true, user: session };
  }
  
  /* ── Register (demo — stores in localStorage) ── */
  function register(data) {
    const existing = JSON.parse(localStorage.getItem('screening_users') || '[]');
    if (existing.find(u => u.email === data.email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const newUser = { ...data, createdAt: Date.now() };
    existing.push(newUser);
    localStorage.setItem('screening_users', JSON.stringify(existing));
    return { success: true };
  }
  
  /* ── Logout ── */
  function logout() {
    clearSession();
    window.location.href = '/login.html';
  }
  
  /* ── Init sidebar user info ── */
  function initSidebarUser() {
    const user = getUser();
    if (!user) return;
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-avatar');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role;
    if (avatarEl) avatarEl.textContent = (user.name || 'A').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const topbarAvatar = document.getElementById('topbar-avatar');
    if (topbarAvatar) topbarAvatar.textContent = (user.name || 'A').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  }