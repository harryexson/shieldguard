'use strict';

const { aiReportStore } = require('./tier2');

// ─── Rule-based security scoring ──────────────────────────────────────
const ADVISE_WEIGHTS = [
  { key: 'rooted', pass: (s) => !s.rooted, fail: -40, msg: 'Device is rooted — avoid storing secrets on this device' },
  { key: 'developerMode', pass: (s) => !s.developerMode, fail: -15, msg: 'Disable developer mode to reduce attack surface' },
  { key: 'vpnActive', pass: (s) => s.vpnActive, fail: -10, msg: 'Activate a VPN for network protection' },
  { key: 'screenLock', pass: (s) => s.screenLock, fail: -15, msg: 'Enable a screen lock' },
  { key: 'biometrics', pass: (s) => s.biometrics, fail: -5, msg: 'Enable biometrics (fingerprint/face) for unlock' },
  { key: 'osUpdates', pass: (s) => s.osUpdates, fail: -10, msg: 'Install the latest OS security updates' },
  { key: 'appIntegrity', pass: (s) => s.appIntegrity, fail: -30, msg: 'App integrity check failed — do not trust this installation' },
  { key: 'weakPassword', pass: (s) => !s.weakPassword, fail: -10, msg: 'Use a stronger device passcode' },
  { key: 'openWifi', pass: (s) => !s.openWifi, fail: -10, msg: 'Disconnect from open/untrusted Wi-Fi networks' },
  { key: 'unknownApps', pass: (s) => !s.unknownApps, fail: -5, msg: 'Remove unknown or unverified applications' },
];

function scoreToRisk(score) {
  return score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical';
}

function ruleBasedAdvise(signals) {
  const s = signals || {};
  let score = 100;
  const recommendations = [];
  for (const c of ADVISE_WEIGHTS) {
    if (!c.pass(s)) {
      score += c.fail;
      recommendations.push(c.msg);
    }
  }
  score = Math.max(0, Math.min(100, score));
  const riskLevel = scoreToRisk(score);
  const summary = `Security score ${score}/100 (${riskLevel} risk)${recommendations.length ? `; ${recommendations.length} issue(s) need attention` : '; no issues detected'}.`;
  return { provider: 'rule-based', riskLevel, summary, recommendations };
}

async function maybeEnhanceAdvise(ruleResult, signals) {
  if (!process.env.OPENAI_API_KEY || typeof fetch !== 'function') return ruleResult;
  try {
    const failing = ADVISE_WEIGHTS.filter((c) => !c.pass(signals || {})).map((c) => c.key);
    const prompt = `You are a mobile privacy/security advisor. The following security checks did NOT pass: ${failing.join(', ') || 'none'}. Provide a short security brief, the risk level (low/medium/high/critical), and 3-5 recommendations.`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) throw new Error('llm bad status');
    const data = await resp.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('empty llm');
    return { provider: 'llm', riskLevel: ruleResult.riskLevel, summary: content.trim().slice(0, 400), recommendations: ruleResult.recommendations };
  } catch (_) {
    return ruleResult;
  }
}

async function advise(signals) {
  const rule = ruleBasedAdvise(signals || {});
  return maybeEnhanceAdvise(rule, signals);
}

// ─── Incident summarization ───────────────────────────────────────────
function ruleBasedSummarize(events) {
  const evts = Array.isArray(events) ? events : [];
  const counts = {};
  for (const e of evts) {
    const t = (e && e.type) || 'unknown';
    counts[t] = (counts[t] || 0) + 1;
  }
  let riskLevel = 'medium';
  if (evts.some((e) => e && (e.type === 'duress' || e.type === 'sos'))) riskLevel = 'critical';
  else if (evts.some((e) => e && e.type === 'panic')) riskLevel = 'high';

  const notable = evts
    .filter((e) => e && e.type)
    .slice(0, 5)
    .map((e) => `${e.type} at ${e.at ? new Date(e.at).toISOString() : 'unknown time'}`)
    .join('; ');
  const report = `Summary of ${evts.length} event(s): ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}. Risk level: ${riskLevel}.${notable ? ' Notable: ' + notable + '.' : ''}`;
  return { report, riskLevel };
}

async function maybeEnhanceSummary(ruleResult, events) {
  if (!process.env.OPENAI_API_KEY || typeof fetch !== 'function') return ruleResult;
  try {
    const types = (events || []).map((e) => (e && e.type) || 'unknown');
    const prompt = `Summarize the following mobile safety incident event types: ${types.join(', ') || 'none'}. Provide a plain-language brief and a risk level (low/medium/high/critical).`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) throw new Error('llm bad status');
    const data = await resp.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('empty llm');
    return { report: content.trim().slice(0, 600), riskLevel: ruleResult.riskLevel, generatedAt: Date.now(), provider: 'llm' };
  } catch (_) {
    return ruleResult;
  }
}

async function summarizeIncident(events, deviceId) {
  const rule = ruleBasedSummarize(events);
  const generatedAt = Date.now();
  const base = { report: rule.report, riskLevel: rule.riskLevel, generatedAt, provider: 'rule-based' };
  const enhanced = await maybeEnhanceSummary(base, events);
  aiReportStore.add({
    riskLevel: enhanced.riskLevel,
    preview: enhanced.report.slice(0, 120),
    provider: enhanced.provider,
    deviceId: (deviceId || 'unknown'),
  });
  return enhanced;
}

module.exports = { advise, summarizeIncident, ruleBasedAdvise, ruleBasedSummarize };
