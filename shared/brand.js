// Canonical brand tokens — single source of truth for the whole platform.
// Mobile, office and the landing page all derive their palette / copy from here
// so a rebrand propagates everywhere. Keep hex values in sync with the
// landing_page CSS custom properties in landing_page/styles.css :root.

const BRAND = {
  name: 'ShieldGuard',
  tagline: 'Privacy & spyware defense for everyone.',
  description:
    'ShieldGuard protects devices from spyware, malware, government surveillance tools and intrusive tracking.',
  // Shared color palette (mobile + web). Keys mirror the mobile COLORS object.
  colors: {
    primary: '#0A1628',
    secondary: '#162447',
    accent: '#1F4068',
    safe: '#00D9A5',
    warning: '#FFB800',
    danger: '#FF4757',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    card: '#1F2937',
    border: '#374151',
    tabBar: '#0D1B2A',
  },
  // Threat severity palette.
  threat: {
    safe: '#00D9A5',
    warning: '#FFB800',
    danger: '#FF4757',
    critical: '#FF4757',
  },
  fonts: {
    body: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    heading: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
};

// Mobile convenience re-export (so existing `import { COLORS }` keeps working).
const COLORS = { ...BRAND.colors, ...BRAND.threat };
const THREAT_LEVELS = BRAND.threat;

module.exports = { BRAND, COLORS, THREAT_LEVELS };
