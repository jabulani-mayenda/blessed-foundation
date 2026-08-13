// =====================================================
// BLESSED FOUNDATION MALAWI — CMS Admin Control Core JS
// =====================================================

const API = '';

// Auth Helpers
function getToken() { return localStorage.getItem('bf_admin_token'); }
function getUsername() { return localStorage.getItem('bf_admin_username'); }

function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = '/admin/index.html';
    return false;
  }
  return true;
}

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (options.body instanceof FormData) delete headers['Content-Type'];

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('bf_admin_token');
    localStorage.removeItem('bf_admin_username');
    window.location.href = '/admin/index.html?expired=1';
    return null;
  }
  return res;
}

// Toast Notifications
function adminToast(message, type = 'success') {
  let container = document.querySelector('.admin-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'admin-toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span style="font-weight:700">${icons[type] || '•'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Modal Helpers
function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// Sidebar Injector & Active State
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar && !sidebar.children.length) {
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">🕊️</div>
          <div>
            <div class="sidebar-logo-name">Blessed Foundation</div>
            <div class="sidebar-logo-sub">Malawi CMS</div>
          </div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Overview</div>
        <a href="/admin/dashboard.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Dashboard
        </a>

        <div class="sidebar-section-label">Website & Content</div>
        <a href="/admin/homepage.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          Home Page Editor
        </a>
        <a href="/admin/about.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          About Page
        </a>
        <a href="/admin/programs.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Our Work & Programmes
        </a>
        <a href="/admin/projects.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          Projects
        </a>
        <a href="/admin/impact.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          Impact Numbers
        </a>
        <a href="/admin/stories.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Stories & News
        </a>
        <a href="/admin/team.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          Team Members
        </a>

        <div class="sidebar-section-label">Community & Engagement</div>
        <a href="/admin/donations.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          Donations & Paychangu
        </a>
        <a href="/admin/volunteers.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Volunteers
          <span class="badge" id="volunteers-badge" style="display:none">0</span>
        </a>
        <a href="/admin/messages.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Messages Inbox
          <span class="badge" id="unread-badge" style="display:none">0</span>
        </a>
        <a href="/admin/media.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          Media Library
        </a>
        <a href="/admin/reports.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Reports & Documents
        </a>

        <div class="sidebar-section-label">System & Settings</div>
        <a href="/admin/settings.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2m0 18v-2m10-8h-2M4 12H2"/></svg>
          Website Settings
        </a>
        <a href="/admin/admin-users.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Admin Users
        </a>
        <a href="/admin/activity.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Activity Log
        </a>
        <a href="/admin/trash.html" class="sidebar-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          Trash Bin
        </a>
        <a href="/" class="sidebar-link" target="_blank" style="margin-top:10px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          View Public Website
        </a>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar" id="sidebar-avatar">A</div>
          <div>
            <div class="sidebar-username" id="sidebar-username">Admin</div>
            <div class="sidebar-role">Administrator</div>
          </div>
        </div>
        <button id="logout-btn" class="btn-admin btn-ghost-admin" style="width:100%;justify-content:center">Sign Out</button>
      </div>
    `;
  }

  const path = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && path.endsWith(href)) link.classList.add('active');
  });

  const usernameEl = document.getElementById('sidebar-username');
  if (usernameEl) usernameEl.textContent = getUsername() || 'Admin';

  const avatarEl = document.getElementById('sidebar-avatar');
  if (avatarEl) avatarEl.textContent = (getUsername() || 'A').charAt(0).toUpperCase();

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/admin/index.html';
  });
}

// Load Unread Messages & Volunteer Badges
async function loadUnreadCount() {
  try {
    const res = await authFetch(`${API}/api/stats`);
    if (!res) return;
    const data = await res.json();
    const badge = document.getElementById('unread-badge');
    if (badge && data.unread_messages > 0) {
      badge.textContent = data.unread_messages;
      badge.style.display = 'inline';
    }
    const volBadge = document.getElementById('volunteers-badge');
    if (volBadge && data.volunteers_count > 0) {
      volBadge.textContent = data.volunteers_count;
      volBadge.style.display = 'inline';
    }
  } catch {}
}

// Date Formatter
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
