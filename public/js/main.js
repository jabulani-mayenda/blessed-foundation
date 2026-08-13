// =====================================================
// BLESSED FOUNDATION MALAWI — Public Site JS v2
// =====================================================

const API = '';

// ─── Site Settings Loader ───
async function loadSiteSettings() {
  try {
    const res = await fetch(`${API}/api/settings`);
    if (!res.ok) return;
    const settings = await res.json();
    document.querySelectorAll('[data-setting]').forEach(el => {
      const key = el.dataset.setting;
      if (settings[key] !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = settings[key];
        } else {
          el.textContent = settings[key];
        }
      }
    });
  } catch (err) {
    // fail silently — static fallbacks remain visible
  }
}

// ─── Dynamic Navigation Loader ───
async function loadDynamicNav() {
  const menu = document.getElementById('nav-menu');
  if (!menu) return;
  try {
    const res = await fetch(`${API}/api/nav`);
    if (!res.ok) return;
    const items = await res.json();
    if (!items || !items.length) return;

    const path = window.location.pathname;
    menu.innerHTML = items.map(item => {
      const isAct = (item.href !== '/' && path.includes(item.href.replace('.html', ''))) || ((path === '/' || path === '/index.html') && (item.href === '/' || item.href === 'index.html'));
      if (item.is_cta) {
        return `<a href="${item.href}" class="nav-btn-donate">${item.label}</a>`;
      }
      return `<a href="${item.href}" class="nav-link ${isAct ? 'active' : ''}">${item.label}</a>`;
    }).join('');
  } catch {}
}

// ─── Dynamic Footer Loader ───
async function loadDynamicFooter() {
  try {
    const res = await fetch(`${API}/api/footer`);
    if (!res.ok) return;
    const f = await res.json();
    if (!f) return;

    const descEl = document.querySelector('.footer-desc');
    if (descEl && f.description) descEl.textContent = f.description;

    const copyEl = document.querySelector('.footer-copyright');
    if (copyEl && f.copyright_text) copyEl.textContent = f.copyright_text;

    const phoneEl = document.querySelector('[data-footer-phone]');
    if (phoneEl && f.phone) phoneEl.textContent = f.phone;

    const emailEl = document.querySelector('[data-footer-email]');
    if (emailEl && f.email) emailEl.textContent = f.email;

    const addrEl = document.querySelector('[data-footer-address]');
    if (addrEl && f.address) addrEl.textContent = f.address;
  } catch {}
}

// ─── Section Image Hydration ───
async function loadSectionImages() {
  const targets = document.querySelectorAll('[data-section-img]');
  if (!targets.length) return;

  const keys = [...new Set([...targets].map(el => el.dataset.sectionImg))];

  await Promise.all(keys.map(async key => {
    try {
      const res = await fetch(`${API}/api/gallery/section/${key}`);
      if (!res.ok) return;
      const img = await res.json();
      if (!img) return;

      document.querySelectorAll(`[data-section-img="${key}"]`).forEach(el => {
        if (el.tagName === 'IMG') {
          el.src = img.url;
          if (img.alt_text) el.alt = img.alt_text;
        } else {
          el.style.backgroundImage = `url('${img.url}')`;
        }
        const captionEl = el.closest('[data-section-wrap]')?.querySelector('[data-section-caption]');
        if (captionEl && img.caption) {
          captionEl.textContent = img.caption;
          captionEl.style.display = 'block';
        }
      });
    } catch { }
  }));
}

// ─── Sticky Header Shadow ───
function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ─── Fade-in on Scroll ───
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.editorial-item, .magazine-item, .help-card, .impact-box, .involve-card, .transparency-block, .outcome-box, .intro-grid > *, .story-split > *').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

// ─── Mobile Navigation ───
function initNavigation() {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.textContent = isOpen ? '✕' : '☰';
      toggle.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
        toggle.textContent = '☰';
      }
    });
  }
}

// ─── Load Latest Stories ───
async function loadStories(containerId, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    let url = `${API}/api/posts`;
    if (limit) url += `?limit=${limit}`;
    const res = await fetch(url);
    const stories = await res.json();

    if (!stories || !stories.length) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 0;">
          <h3 style="font-family:var(--font-serif);color:var(--charcoal);margin-bottom:8px">Stories coming soon</h3>
          <p style="color:var(--text-muted)">We're documenting the communities behind our work. Check back soon.</p>
        </div>`;
      return;
    }

    container.innerHTML = stories.map((s, i) => {
      const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      return `
        <article class="magazine-item fade-in">
          <div class="magazine-img">
            <img src="${s.cover_url || 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&q=80'}" alt="${s.title}" loading="lazy">
          </div>
          <div class="magazine-content">
            <span class="magazine-tag">${s.category || 'COMMUNITY'}</span>
            <h3 class="magazine-title">${s.title}</h3>
            <p class="magazine-excerpt">${s.excerpt || ''}</p>
            ${date ? `<p class="magazine-meta">${date} &bull; ${s.author || 'Blessed Foundation'}</p>` : ''}
            <a href="/stories.html?slug=${s.slug}" class="link-arrow">Read story →</a>
          </div>
        </article>`;
    }).join('');

    requestAnimationFrame(() => initScrollAnimations());
  } catch (err) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px 0;">
        <p style="color:var(--text-muted)">Could not load stories at this time.</p>
      </div>`;
  }
}

// ─── Stories Page ───
async function initStoriesPage() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (slug) {
    const container = document.getElementById('story-detail');
    if (!container) return;
    try {
      const res = await fetch(`${API}/api/posts/${slug}`);
      if (!res.ok) throw new Error('Not found');
      const s = await res.json();
      const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      document.title = `${s.title} — Blessed Foundation Malawi`;
      container.innerHTML = `
        <div style="max-width:720px;margin:0 auto">
          <div class="text-meta" style="margin-bottom:8px">${s.category || 'COMMUNITY'} ${date ? '· ' + date : ''}</div>
          <h1 style="margin-bottom:8px">${s.title}</h1>
          <p style="color:var(--text-muted);margin-bottom:32px;font-size:0.9rem">${s.author || 'Blessed Foundation Team'}</p>
          ${s.cover_url ? `<img src="${s.cover_url}" alt="${s.title}" style="width:100%;border-radius:var(--radius-md);margin-bottom:36px;max-height:480px;object-fit:cover">` : ''}
          <div class="story-body body-lead" style="color:var(--charcoal)">${s.body || s.excerpt || ''}</div>
          <div style="margin-top:40px;padding-top:24px;border-top:1px solid var(--border-light)">
            <a href="/stories.html" class="link-arrow">← Back to all stories</a>
          </div>
        </div>`;
    } catch {
      container.innerHTML = `<p style="color:var(--text-muted)">Story not found. <a href="/stories.html" class="link-arrow">← Return to stories</a></p>`;
    }
    return;
  }

  const grid = document.getElementById('stories-grid');
  if (!grid) return;

  try {
    const res = await fetch(`${API}/api/posts`);
    const stories = await res.json();

    function renderStories(filter) {
      const filtered = filter === 'all' ? stories : stories.filter(s => (s.category || '').toLowerCase() === filter.toLowerCase());
      if (!filtered.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0"><p style="color:var(--text-muted)">No stories in this category yet.</p></div>`;
        return;
      }
      grid.innerHTML = filtered.map((s) => {
        const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        return `
          <article class="magazine-item fade-in">
            <div class="magazine-img">
              <img src="${s.cover_url || 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&q=80'}" alt="${s.title}" loading="lazy">
            </div>
            <div class="magazine-content">
              <span class="magazine-tag">${s.category || 'COMMUNITY'}</span>
              <h3 class="magazine-title">${s.title}</h3>
              <p class="magazine-excerpt">${s.excerpt || ''}</p>
              ${date ? `<p class="magazine-meta">${date} · ${s.author || 'Blessed Foundation'}</p>` : ''}
              <a href="/stories.html?slug=${s.slug}" class="link-arrow">Read story →</a>
            </div>
          </article>`;
      }).join('');
      requestAnimationFrame(() => initScrollAnimations());
    }

    renderStories('all');

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderStories(btn.dataset.filter || 'all');
      });
    });
  } catch {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 0"><p style="color:var(--text-muted)">Could not load stories right now.</p></div>`;
  }
}

// ─── Contact Form Handler ───
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const statusBox = document.getElementById('form-status');

    btn.disabled = true;
    btn.textContent = 'Sending message…';

    const payload = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok) {
        form.reset();
        if (statusBox) {
          statusBox.style.display = 'block';
          statusBox.style.color = 'var(--army-green)';
          statusBox.textContent = "Thank you \u2014 we've received your message and will be in touch shortly.";
        }
      } else {
        if (statusBox) {
          statusBox.style.display = 'block';
          statusBox.style.color = '#991B1B';
          statusBox.textContent = json.error || 'Unable to send message. Please try again.';
        }
      }
    } catch {
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.style.color = '#991B1B';
        statusBox.textContent = 'Network issue. Please check your connection and try again.';
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Message';
    }
  });
}

// ─── Donation Component ───
function initDonationComponent() {
  const form = document.getElementById('donation-form');
  if (!form) return;

  const amountBtns = form.querySelectorAll('.amount-btn');
  const customInput = document.getElementById('custom-amount');
  const freqInput = document.getElementById('donation-frequency');

  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (customInput) customInput.value = btn.dataset.amount;
    });
  });

  form.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      form.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (freqInput) freqInput.value = tab.dataset.freq;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const resultBox = document.getElementById('donation-result');
    const amountVal = customInput ? customInput.value : 10000;

    btn.disabled = true;
    btn.textContent = 'Processing your donation…';

    const data = {
      donor_name: document.getElementById('donor-name')?.value || 'Anonymous',
      donor_email: document.getElementById('donor-email')?.value,
      donor_phone: document.getElementById('donor-phone')?.value,
      amount: parseFloat(amountVal),
      frequency: freqInput ? freqInput.value : 'one-time',
      designation: document.getElementById('donation-designation')?.value || 'Where needed most',
      payment_method: document.getElementById('payment-method')?.value || 'Paychangu Mobile Money',
    };

    try {
      const res = await fetch(`${API}/api/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (res.ok) {
        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.innerHTML = `
            <div style="padding:28px;background:var(--warm-offwhite);border:1px solid var(--muted-beige);border-radius:var(--radius-md);margin-top:20px;text-align:center">
              <h3 style="font-family:var(--font-serif);margin-bottom:8px">Thank you for your support.</h3>
              <p style="color:var(--text-muted);font-size:0.95rem">${json.message || 'Your contribution has been received.'}</p>
              <p style="font-size:0.82rem;color:var(--earthy-brown);margin-top:12px">Reference: ${json.donation?.reference || 'BFM-DON'}</p>
            </div>`;
        }
        form.reset();
      } else {
        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.innerHTML = `<p style="color:#991B1B;margin-top:16px">${json.error || 'Could not complete donation.'}</p>`;
        }
      }
    } catch {
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = '<p style="color:#991B1B;margin-top:16px">We could not complete your donation. Please try again.</p>';
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Complete Contribution';
    }
  });
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  loadSiteSettings();
  loadDynamicNav();
  loadDynamicFooter();
  loadSectionImages();
  initNavigation();
  initScrollHeader();
  initContactForm();
  initDonationComponent();
  initStoriesPage();
  setTimeout(initScrollAnimations, 100);
});
