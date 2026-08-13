// =====================================================
// STITCH MALAWI FOUNDATION — Admin Dashboard JS
// =====================================================

const API = '';

// ─── Auth ───
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
  // Don't set Content-Type for FormData
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

// ─── Toast ───
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

// ─── Confirm dialog ───
function confirmDialog(message) {
  return confirm(message);
}

// ─── Modal ───
function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// ─── Sidebar active state ───
function initSidebar() {
  const path = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && path.endsWith(href)) link.classList.add('active');
  });

  const usernameEl = document.getElementById('sidebar-username');
  if (usernameEl) usernameEl.textContent = getUsername() || 'Admin';

  const avatarEl = document.getElementById('sidebar-avatar');
  if (avatarEl) avatarEl.textContent = (getUsername() || 'A').charAt(0).toUpperCase();

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/admin/index.html';
  });
}

// ─── Load unread count ───
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
  } catch {}
}

// ─── Format date ───
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Gallery Manager ───
async function initGalleryAdmin() {
  if (!requireAuth()) return;
  await loadGalleryAdmin();
  initUploadForm();
}

async function loadGalleryAdmin() {
  const grid = document.getElementById('admin-gallery-grid');
  if (!grid) return;

  try {
    const res = await authFetch(`${API}/api/gallery?visible_only=false`);
    const images = await res.json();

    if (!images.length) {
      grid.innerHTML = '<p style="color:var(--admin-text-muted);grid-column:1/-1;text-align:center;padding:40px">No images uploaded yet. Use the upload form above.</p>';
      return;
    }

    grid.innerHTML = images.map(img => `
      <div class="admin-gallery-item" id="img-${img.id}">
        <div class="admin-gallery-img">
          <img src="${img.url}" alt="${img.caption || 'Image'}" loading="lazy">
          <div class="admin-gallery-img-actions">
            <button class="btn-admin btn-icon-admin btn-ghost-admin" onclick="editImageModal(${img.id})" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-admin btn-icon-admin btn-danger-admin" onclick="deleteImage(${img.id})" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </div>
        <div class="admin-gallery-body">
          <p class="admin-gallery-caption" title="${img.caption || ''}">${img.caption || '<em style="opacity:0.5">No caption</em>'}</p>
          <p class="admin-gallery-meta">${img.category} • ${img.is_visible ? '👁 Visible' : '🙈 Hidden'}</p>
        </div>
      </div>
    `).join('');

    // Store images for edit modal
    window._galleryImages = images;
  } catch (err) {
    console.error(err);
    adminToast('Failed to load gallery', 'error');
  }
}

function initUploadForm() {
  const form = document.getElementById('upload-form');
  if (!form) return;

  const zone = document.getElementById('upload-zone');
  const preview = document.getElementById('upload-preview');

  // Drag & drop visual feedback
  if (zone) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', () => zone.classList.remove('drag-over'));
  }

  // File preview
  const fileInput = document.getElementById('img-file');
  if (fileInput && preview) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          preview.style.display = 'block';
          preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Uploading…';

    const formData = new FormData(form);
    try {
      const res = await authFetch(`${API}/api/gallery`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
      if (!res) return;
      const data = await res.json();
      if (res.ok) {
        adminToast('Image uploaded successfully!');
        form.reset();
        if (preview) { preview.style.display = 'none'; preview.src = ''; }
        await loadGalleryAdmin();
      } else {
        adminToast(data.error || 'Upload failed', 'error');
      }
    } catch {
      adminToast('Upload failed', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Upload Image';
    }
  });
}

function editImageModal(id) {
  const img = window._galleryImages?.find(i => i.id === id);
  if (!img) return;

  document.getElementById('edit-img-id').value = img.id;
  document.getElementById('edit-caption').value = img.caption || '';
  document.getElementById('edit-alt').value = img.alt_text || '';
  document.getElementById('edit-category').value = img.category || 'general';
  document.getElementById('edit-order').value = img.display_order || 0;
  document.getElementById('edit-visible').checked = img.is_visible;
  document.getElementById('edit-preview').src = img.url;

  openModal('edit-modal');
}

async function saveImageEdit() {
  const id = document.getElementById('edit-img-id').value;
  const body = {
    caption: document.getElementById('edit-caption').value,
    alt_text: document.getElementById('edit-alt').value,
    category: document.getElementById('edit-category').value,
    display_order: parseInt(document.getElementById('edit-order').value) || 0,
    is_visible: document.getElementById('edit-visible').checked,
  };
  try {
    const res = await authFetch(`${API}/api/gallery/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    if (!res) return;
    if (res.ok) {
      adminToast('Image updated!');
      closeModal('edit-modal');
      await loadGalleryAdmin();
    } else {
      const d = await res.json();
      adminToast(d.error || 'Update failed', 'error');
    }
  } catch { adminToast('Update failed', 'error'); }
}

async function deleteImage(id) {
  if (!confirmDialog('Are you sure you want to delete this image? This cannot be undone.')) return;
  try {
    const res = await authFetch(`${API}/api/gallery/${id}`, { method: 'DELETE' });
    if (!res) return;
    if (res.ok) {
      adminToast('Image deleted');
      document.getElementById('img-' + id)?.remove();
    } else {
      adminToast('Delete failed', 'error');
    }
  } catch { adminToast('Delete failed', 'error'); }
}

// ─── Posts Manager ───
async function initPostsAdmin() {
  if (!requireAuth()) return;
  await loadPostsAdmin();
  initPostForm();
}

async function loadPostsAdmin() {
  const tbody = document.getElementById('posts-tbody');
  if (!tbody) return;
  try {
    const res = await authFetch(`${API}/api/posts?published_only=false`);
    const posts = await res.json();
    if (!posts.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--admin-text-muted);padding:40px">No posts yet.</td></tr>';
      return;
    }
    tbody.innerHTML = posts.map(p => `
      <tr>
        <td>
          ${p.cover_url ? `<img class="table-img" src="${p.cover_url}" alt="">` : '<div class="table-img-placeholder">📝</div>'}
        </td>
        <td>
          <div style="font-weight:600">${p.title}</div>
          <div style="font-size:0.75rem;color:var(--admin-text-muted)">${p.slug}</div>
        </td>
        <td><span class="badge-status ${p.post_type}">${p.post_type}</span></td>
        <td><span class="badge-status ${p.is_published ? 'published' : 'draft'}">${p.is_published ? 'Published' : 'Draft'}</span></td>
        <td>${fmtDate(p.created_at)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn-admin btn-icon-admin btn-ghost-admin" onclick="editPost(${p.id})" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-admin btn-icon-admin btn-danger-admin" onclick="deletePost(${p.id})" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    window._adminPosts = posts;
  } catch (err) {
    adminToast('Failed to load posts', 'error');
  }
}

function initPostForm() {
  const form = document.getElementById('post-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving…';

    const editId = form.dataset.editId;
    const body = {
      title: document.getElementById('p-title').value,
      excerpt: document.getElementById('p-excerpt').value,
      body: document.getElementById('p-body').value,
      post_type: document.getElementById('p-type').value,
      event_date: document.getElementById('p-date').value || null,
      cover_image_id: document.getElementById('p-cover-id').value || null,
      is_published: document.getElementById('p-published').checked,
    };

    try {
      const url = editId ? `${API}/api/posts/${editId}` : `${API}/api/posts`;
      const method = editId ? 'PATCH' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(body) });
      if (!res) return;
      const data = await res.json();
      if (res.ok) {
        adminToast(editId ? 'Post updated!' : 'Post created!');
        form.reset(); form.removeAttribute('data-edit-id');
        document.getElementById('form-mode-label').textContent = 'New Post';
        await loadPostsAdmin();
      } else { adminToast(data.error || 'Failed', 'error'); }
    } catch { adminToast('Error', 'error'); }
    finally { btn.disabled = false; btn.textContent = editId ? 'Update Post' : 'Publish Post'; }
  });
}

function editPost(id) {
  const post = window._adminPosts?.find(p => p.id === id);
  if (!post) return;
  const form = document.getElementById('post-form');
  form.dataset.editId = id;
  document.getElementById('form-mode-label').textContent = 'Edit Post';
  document.getElementById('p-title').value = post.title || '';
  document.getElementById('p-excerpt').value = post.excerpt || '';
  document.getElementById('p-body').value = post.body || '';
  document.getElementById('p-type').value = post.post_type || 'news';
  document.getElementById('p-date').value = post.event_date ? post.event_date.substring(0, 10) : '';
  document.getElementById('p-published').checked = post.is_published;
  form.scrollIntoView({ behavior: 'smooth' });
}

async function deletePost(id) {
  if (!confirmDialog('Delete this post?')) return;
  const res = await authFetch(`${API}/api/posts/${id}`, { method: 'DELETE' });
  if (res?.ok) { adminToast('Post deleted'); await loadPostsAdmin(); }
  else adminToast('Delete failed', 'error');
}

// ─── Team Manager ───
async function initTeamAdmin() {
  if (!requireAuth()) return;
  await loadTeamAdmin();
  initTeamForm();
}

async function loadTeamAdmin() {
  const tbody = document.getElementById('team-tbody');
  if (!tbody) return;
  try {
    const res = await authFetch(`${API}/api/team/all`);
    const team = await res.json();
    if (!team.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--admin-text-muted);padding:40px">No team members yet.</td></tr>';
      return;
    }
    tbody.innerHTML = team.map(m => `
      <tr>
        <td>${m.photo_url ? `<img class="table-img" src="${m.photo_url}" style="border-radius:50%;width:40px;height:40px">` : '<div class="table-img-placeholder" style="border-radius:50%;width:40px;height:40px">👤</div>'}</td>
        <td><div style="font-weight:600">${m.name}</div></td>
        <td>${m.role || '—'}</td>
        <td><span class="badge-status ${m.is_visible ? 'visible' : 'hidden'}">${m.is_visible ? 'Visible' : 'Hidden'}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn-admin btn-icon-admin btn-ghost-admin" onclick="editTeamModal(${m.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-admin btn-icon-admin btn-danger-admin" onclick="deleteTeamMember(${m.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    window._adminTeam = team;
  } catch { adminToast('Failed to load team', 'error'); }
}

function initTeamForm() {
  const form = document.getElementById('team-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving…';
    const editId = form.dataset.editId;
    const body = {
      name: document.getElementById('t-name').value,
      role: document.getElementById('t-role').value,
      bio: document.getElementById('t-bio').value,
      photo_id: document.getElementById('t-photo-id').value || null,
      display_order: parseInt(document.getElementById('t-order').value) || 0,
    };
    try {
      const url = editId ? `${API}/api/team/${editId}` : `${API}/api/team`;
      const method = editId ? 'PATCH' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(body) });
      if (res?.ok) {
        adminToast(editId ? 'Member updated!' : 'Member added!');
        form.reset(); form.removeAttribute('data-edit-id');
        await loadTeamAdmin();
      } else { adminToast('Failed', 'error'); }
    } catch { adminToast('Error', 'error'); }
    finally { btn.disabled = false; btn.textContent = editId ? 'Update Member' : 'Add Member'; }
  });
}

function editTeamModal(id) {
  const m = window._adminTeam?.find(x => x.id === id);
  if (!m) return;
  const form = document.getElementById('team-form');
  form.dataset.editId = id;
  document.getElementById('t-name').value = m.name || '';
  document.getElementById('t-role').value = m.role || '';
  document.getElementById('t-bio').value = m.bio || '';
  document.getElementById('t-photo-id').value = m.photo_id || '';
  document.getElementById('t-order').value = m.display_order || 0;
  form.scrollIntoView({ behavior: 'smooth' });
}

async function deleteTeamMember(id) {
  if (!confirmDialog('Delete this team member?')) return;
  const res = await authFetch(`${API}/api/team/${id}`, { method: 'DELETE' });
  if (res?.ok) { adminToast('Deleted'); await loadTeamAdmin(); }
  else adminToast('Delete failed', 'error');
}

// ─── Messages ───
async function initMessagesAdmin() {
  if (!requireAuth()) return;
  await loadMessages();
}

async function loadMessages() {
  const tbody = document.getElementById('messages-tbody');
  if (!tbody) return;
  try {
    const res = await authFetch(`${API}/api/contact`);
    const msgs = await res.json();
    if (!msgs.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--admin-text-muted);padding:40px">No messages yet.</td></tr>';
      return;
    }
    tbody.innerHTML = msgs.map(m => `
      <tr id="msg-${m.id}" style="${!m.is_read ? 'background:rgba(59,130,246,0.04)' : ''}">
        <td><span class="badge-status ${m.is_read ? '' : 'unread'}">${m.is_read ? 'Read' : 'Unread'}</span></td>
        <td><div style="font-weight:600">${m.name}</div><div style="font-size:0.75rem;color:var(--admin-text-muted)">${m.email}</div></td>
        <td>${m.subject || '—'}</td>
        <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.message}</td>
        <td>${fmtDate(m.received_at)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn-admin btn-icon-admin btn-ghost-admin" onclick="viewMessage(${m.id})" title="View">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-admin btn-icon-admin btn-danger-admin" onclick="deleteMessage(${m.id})" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    window._adminMessages = msgs;
  } catch { adminToast('Failed to load messages', 'error'); }
}

async function viewMessage(id) {
  const m = window._adminMessages?.find(x => x.id === id);
  if (!m) return;
  document.getElementById('view-msg-from').textContent = `${m.name} <${m.email}>`;
  document.getElementById('view-msg-subject').textContent = m.subject || '(No subject)';
  document.getElementById('view-msg-date').textContent = fmtDate(m.received_at);
  document.getElementById('view-msg-body').textContent = m.message;
  openModal('view-message-modal');

  if (!m.is_read) {
    await authFetch(`${API}/api/contact/${id}/read`, { method: 'PATCH' });
    m.is_read = true;
    const row = document.getElementById('msg-' + id);
    if (row) row.style.background = '';
    const badge = row?.querySelector('.badge-status');
    if (badge) { badge.className = 'badge-status'; badge.textContent = 'Read'; }
  }
}

async function deleteMessage(id) {
  if (!confirmDialog('Delete this message?')) return;
  const res = await authFetch(`${API}/api/contact/${id}`, { method: 'DELETE' });
  if (res?.ok) { adminToast('Message deleted'); document.getElementById('msg-' + id)?.remove(); }
  else adminToast('Delete failed', 'error');
}

// ─── Settings ───
async function initSettingsAdmin() {
  if (!requireAuth()) return;
  await loadSettingsAdmin();
  initSettingsForm();
}

async function loadSettingsAdmin() {
  try {
    const res = await fetch(`${API}/api/settings`);
    const settings = await res.json();
    document.querySelectorAll('[data-setting-key]').forEach(el => {
      const key = el.dataset.settingKey;
      if (settings[key] !== undefined) el.value = settings[key];
    });
  } catch { adminToast('Failed to load settings', 'error'); }
}

function initSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving…';
    const settings = {};
    form.querySelectorAll('[data-setting-key]').forEach(el => {
      settings[el.dataset.settingKey] = el.value;
    });
    try {
      const res = await authFetch(`${API}/api/settings`, { method: 'PUT', body: JSON.stringify(settings) });
      if (res?.ok) adminToast('Settings saved!');
      else adminToast('Save failed', 'error');
    } catch { adminToast('Error', 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Save Settings'; }
  });
}

// ─── Dashboard Stats ───
async function initDashboard() {
  if (!requireAuth()) return;
  try {
    const res = await authFetch(`${API}/api/stats`);
    if (!res) return;
    const stats = await res.json();
    const map = {
      'stat-gallery': stats.gallery,
      'stat-posts': stats.posts,
      'stat-team': stats.team,
      'stat-programs': stats.programs,
      'stat-messages': stats.messages,
      'stat-unread': stats.unread_messages,
    };
    for (const [id, val] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }
  } catch { }
}

// Programs admin
async function initProgramsAdmin() {
  if (!requireAuth()) return;
  await loadProgramsAdmin();
  initProgramForm();
}

async function loadProgramsAdmin() {
  const tbody = document.getElementById('programs-tbody');
  if (!tbody) return;
  try {
    const res = await authFetch(`${API}/api/programs/all`);
    const programs = await res.json();
    if (!programs.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--admin-text-muted);padding:40px">No programs yet.</td></tr>';
      return;
    }
    tbody.innerHTML = programs.map(p => `
      <tr>
        <td><div style="font-weight:600">${p.title}</div></td>
        <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--admin-text-muted)">${p.description || '—'}</td>
        <td>${p.icon || '—'}</td>
        <td><span class="badge-status ${p.is_visible ? 'visible' : 'hidden'}">${p.is_visible ? 'Visible' : 'Hidden'}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn-admin btn-icon-admin btn-ghost-admin" onclick="editProgram(${p.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-admin btn-icon-admin btn-danger-admin" onclick="deleteProgram(${p.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    window._adminPrograms = programs;
  } catch { adminToast('Failed', 'error'); }
}

function initProgramForm() {
  const form = document.getElementById('program-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving…';
    const editId = form.dataset.editId;
    const body = {
      title: document.getElementById('prog-title').value,
      description: document.getElementById('prog-desc').value,
      icon: document.getElementById('prog-icon').value || 'star',
      cover_image_id: document.getElementById('prog-img-id').value || null,
      display_order: parseInt(document.getElementById('prog-order').value) || 0,
    };
    try {
      const url = editId ? `${API}/api/programs/${editId}` : `${API}/api/programs`;
      const method = editId ? 'PATCH' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(body) });
      if (res?.ok) {
        adminToast(editId ? 'Program updated!' : 'Program created!');
        form.reset(); form.removeAttribute('data-edit-id');
        await loadProgramsAdmin();
      } else adminToast('Failed', 'error');
    } catch { adminToast('Error', 'error'); }
    finally { btn.disabled = false; btn.textContent = editId ? 'Update' : 'Create Program'; }
  });
}

function editProgram(id) {
  const p = window._adminPrograms?.find(x => x.id === id);
  if (!p) return;
  const form = document.getElementById('program-form');
  form.dataset.editId = id;
  document.getElementById('prog-title').value = p.title || '';
  document.getElementById('prog-desc').value = p.description || '';
  document.getElementById('prog-icon').value = p.icon || '';
  document.getElementById('prog-img-id').value = p.cover_image_id || '';
  document.getElementById('prog-order').value = p.display_order || 0;
  form.scrollIntoView({ behavior: 'smooth' });
}

async function deleteProgram(id) {
  if (!confirmDialog('Delete this program?')) return;
  const res = await authFetch(`${API}/api/programs/${id}`, { method: 'DELETE' });
  if (res?.ok) { adminToast('Deleted'); await loadProgramsAdmin(); }
  else adminToast('Delete failed', 'error');
}
