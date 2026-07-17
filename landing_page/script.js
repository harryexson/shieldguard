// ShieldGuard Landing Page - Interactive Features

// ─── Configuration ────────────────────────────────────────────────
// Edit these to point at your real store listings and backend.
const SHIELDGUARD = {
  // Backend API (used for live stats + Stripe checkout)
  backend: 'http://localhost:4000',

  // Store listings (replace with your real URLs)
  playStore: 'https://play.google.com/store/apps/details?id=com.shieldguard',
  appStore: 'https://apps.apple.com/app/shieldguard/id000000000',
  web: 'http://localhost:3000',   // ShieldGuard Office web dashboard

  supportEmail: 'support@shieldguard.app',
  salesEmail: 'sales@shieldguard.app',
};

// ─── Helpers ──────────────────────────────────────────────────────
function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

// ─── Stripe Checkout ──────────────────────────────────────────────
async function startCheckout(plan, btn) {
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Redirecting…';
  try {
    const emailEl = document.getElementById('emailInput');
    const body = { plan };
    if (emailEl && emailEl.value) body.email = emailEl.value;

    const res = await fetch(`${SHIELDGUARD.backend}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    window.location.href = data.url;
  } catch (err) {
    toast(err.message || 'Could not start checkout.', 'error');
    btn.disabled = false;
    btn.textContent = original;
  }
}

// ─── Event Wiring ─────────────────────────────────────────────────
function initializeActions() {
  // data-action buttons (nav, CTAs, load more, contact sales)
  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      switch (action) {
        case 'get-started':
        case 'view-plans':
          scrollToId('pricing');
          break;
        case 'download':
          scrollToId('platforms');
          break;
        case 'contact-sales':
          window.location.href = `mailto:${SHIELDGUARD.salesEmail}?subject=ShieldGuard%20Enterprise%20Inquiry`;
          break;
        case 'load-more': {
          const extra = document.getElementById('extraFeatures');
          if (!extra) return;
          const hidden = extra.hasAttribute('hidden');
          if (hidden) {
            extra.removeAttribute('hidden');
            btn.textContent = 'Show Less Features';
          } else {
            extra.setAttribute('hidden', '');
            btn.textContent = 'Load More Features';
          }
          break;
        }
      }
    });
  });

  // "Learn More" buttons → scroll to the relevant section
  document.querySelectorAll('[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => scrollToId(btn.getAttribute('data-target')));
  });

  // Platform download buttons
  document.querySelectorAll('[data-platform]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const platform = btn.getAttribute('data-platform');
      const url = SHIELDGUARD[platform];
      const labels = { android: 'Android', ios: 'iOS', web: 'Web App' };
      if (url) {
        window.open(url, '_blank', 'noopener');
      } else {
        toast(
          `ShieldGuard for ${labels[platform] || platform} is coming soon. ` +
            `Get the mobile app on Android or iOS today.`,
          'info'
        );
        scrollToId('platforms');
      }
    });
  });

  // Pricing plan buttons
  document.querySelectorAll('[data-plan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      if (plan === 'free') {
        scrollToId('platforms');
        return;
      }
      startCheckout(plan, btn);
    });
  });
}

// ─── Live Threat Intelligence Stats ───────────────────────────────
async function loadLiveStats() {
  const el = document.getElementById('liveStats');
  try {
    const res = await fetch(`${SHIELDGUARD.backend}/api/stats`);
    if (!res.ok) throw new Error();
    const s = await res.json();
    if (el) {
      el.textContent =
        `Live: ${s.totalThreats} known threats · ` +
        `${s.suspiciousDomains} surveillance domains blocked · ` +
        `${s.alertsCount} active alert(s)`;
    }
    const kt = document.getElementById('knownThreats');
    if (kt) kt.textContent = s.totalThreats;
  } catch {
    if (el) el.textContent = 'Live threat intelligence offline — showing cached figures.';
  }
}

// ─── Existing features (FAQ, smooth nav, forms) ───────────────────
function initializeFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains('active')) other.classList.remove('active');
      });
      item.classList.toggle('active');
    });
  });
}

function initializeScrollEffects() {
  const navLinks = document.querySelectorAll('a[href^="#"]');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = document.querySelector(link.getAttribute('href'));
      if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function initializeFormHandling() {
  const emailInput = document.getElementById('emailInput');
  if (emailInput) {
    emailInput.addEventListener('focus', () => {
      emailInput.style.boxShadow = '0 0 0 4px rgba(0, 51, 204, 0.2)';
    });
    emailInput.addEventListener('blur', () => {
      emailInput.style.boxShadow = 'none';
    });
  }
}

function observeElements() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.1 }
  );
  const cards = document.querySelectorAll('.protection-card, .platform-card, .pricing-card, .feature-block');
  cards.forEach((card) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeFAQ();
  initializeScrollEffects();
  initializeFormHandling();
  initializeActions();
  loadLiveStats();
});

observeElements();
console.log('ShieldGuard Landing Page loaded successfully!');
