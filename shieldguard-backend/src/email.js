'use strict';

// Pluggable transactional email for ShieldGuard.
//
// Production: set EMAIL_FROM + SMTP_HOST (and SMTP_USER/SMTP_PASS) in .env and
// mail is delivered over SMTP (nodemailer). When those are absent, emails are
// written to .emails/ as .html files and logged to the console so the full
// flow is observable in local/dev without any credentials.
//
// Entry points:
//   sendSubscriptionConfirmation({ email, plan, deviceId })
//   sendEmail({ to, subject, html })

const fs = require('fs');
const path = require('path');

const { TIER_LABELS, featuresForTier, FEATURES } = require('@shieldguard/shared');

const DEV_DIR = path.join(__dirname, '..', '.emails');

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

function planLabel(plan) {
  return (TIER_LABELS && TIER_LABELS[plan]) || plan || 'Free';
}

function featureNamesForTier(tier) {
  const ids = featuresForTier(tier);
  return FEATURES.filter((f) => ids.includes(f.id)).map((f) => f.name);
}

function sendSmtp({ to, subject, html }) {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE || 'false') === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

function sendDev({ to, subject, html }) {
  try {
    fs.mkdirSync(DEV_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTo = (to || 'unknown').replace(/[^a-z0-9@._-]/gi, '_');
    const file = path.join(DEV_DIR, `to_${safeTo}_${stamp}.html`);
    fs.writeFileSync(file, `Subject: ${subject}\nTo: ${to}\n\n${html}`);
    console.log(`[email:dev] wrote email for <${to}> -> ${file}`);
  } catch (e) {
    console.error('[email:dev] failed to write email file:', e.message);
  }
}

async function sendEmail({ to, subject, html }) {
  if (!to) {
    console.warn('[email] no recipient provided; skipping');
    return null;
  }
  if (smtpConfigured()) {
    try {
      const info = await sendSmtp({ to, subject, html });
      console.log(`[email] sent to <${to}> via SMTP (${info.messageId})`);
      return info;
    } catch (e) {
      console.error(`[email] SMTP send failed (${e.message}); using dev fallback`);
    }
  }
  sendDev({ to, subject, html });
  return null;
}

function buildConfirmationHtml({ email, plan, deviceId }) {
  const label = planLabel(plan);
  const features = featureNamesForTier(plan);
  const playStore = process.env.PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.shieldguard';
  const appStore = process.env.APP_STORE_URL || 'https://apps.apple.com/app/shieldguard/id000000000';
  const dashboard = process.env.DASHBOARD_URL || 'http://localhost:3001';
  const featureList = features.map((n) => `<li>${n}</li>`).join('');

  return `<!doctype html>
<html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:600px;margin:0 auto">
  <h1 style="color:#0ea5e9">Your ShieldGuard ${label} plan is active</h1>
  <p>Hi there,</p>
  <p>Thanks for subscribing to <strong>ShieldGuard ${label}</strong>. Your protection is now active${
    deviceId ? ` on device <code>${deviceId}</code>` : ''
  }.</p>
  <h2>What you now have access to</h2>
  <ul>${featureList}</ul>
  <h2>Get the app &amp; start using your features</h2>
  <p>ShieldGuard's security features run on your phone. Install it here:</p>
  <p>
    <a href="${playStore}" style="display:inline-block;margin:4px 8px 4px 0;padding:10px 16px;background:#0ea5e9;color:#fff;border-radius:8px;text-decoration:none">Google Play</a>
    <a href="${appStore}" style="display:inline-block;margin:4px 8px 4px 0;padding:10px 16px;background:#0ea5e9;color:#fff;border-radius:8px;text-decoration:none">App Store</a>
  </p>
  <p>You can also manage your subscription from the web dashboard:
    <a href="${dashboard}">${dashboard}</a></p>
  <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0" />
  <p style="font-size:12px;color:#64748b">ShieldGuard &mdash; privacy &amp; security for everyone. If you didn't create this subscription, contact support@shieldguard.app.</p>
</body></html>`;
}

async function sendSubscriptionConfirmation({ email, plan, deviceId } = {}) {
  if (!email) {
    console.warn('[email] sendSubscriptionConfirmation called without email; skipping');
    return null;
  }
  const label = planLabel(plan);
  const subject = `Welcome to ShieldGuard ${label} — your protection is active`;
  const html = buildConfirmationHtml({ email, plan, deviceId });
  return sendEmail({ to: email, subject, html });
}

module.exports = {
  sendEmail,
  sendSubscriptionConfirmation,
  smtpConfigured,
  _DEV_DIR: DEV_DIR,
};
