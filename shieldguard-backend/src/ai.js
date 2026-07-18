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

// ─── Privacy Coach ──────────────────────────────────────────────────
const PRIVACY_TIPS = [
  { key: 'vpnActive', pass: (s) => s.vpnActive, tip: 'Use a VPN to protect network traffic from interception' },
  { key: 'screenLock', pass: (s) => s.screenLock, tip: 'Enable a screen lock on this device' },
  { key: 'weakPassword', pass: (s) => !s.weakPassword, tip: 'Use a 14+ character password for stronger protection' },
  { key: 'biometrics', pass: (s) => s.biometrics, tip: 'Enable biometrics (fingerprint/face) for faster secure unlock' },
  { key: 'osUpdates', pass: (s) => s.osUpdates, tip: 'Install the latest OS security updates' },
  { key: 'appIntegrity', pass: (s) => s.appIntegrity, tip: 'Reinstall the app from an official store — integrity check failed' },
  { key: 'openWifi', pass: (s) => !s.openWifi, tip: 'Avoid open or untrusted Wi-Fi networks' },
];

function ruleBasedPrivacyCoach(signals) {
  const s = signals || {};
  let score = 100;
  const tips = [];
  for (const c of PRIVACY_TIPS) {
    if (!c.pass(s)) { score -= 10; tips.push(c.tip); }
  }
  score = Math.max(0, Math.min(100, score));
  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical';
  return { provider: 'rule-based', tips, riskLevel };
}

async function maybeEnhanceCoach(ruleResult, signals) {
  if (!process.env.OPENAI_API_KEY || typeof fetch !== 'function') return ruleResult;
  try {
    const prompt = `You are a mobile privacy coach. These privacy checks did NOT pass: ${PRIVACY_TIPS.filter((c) => !c.pass(signals || {})).map((c) => c.key).join(', ') || 'none'}. Provide a short privacy brief and concrete tips.`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) throw new Error('llm bad status');
    const data = await resp.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('empty llm');
    return { provider: 'llm', riskLevel: ruleResult.riskLevel, tips: ruleResult.tips.concat(content.trim().slice(0, 300)) };
  } catch (_) {
    return ruleResult;
  }
}

async function privacyCoach(signals) {
  const rule = ruleBasedPrivacyCoach(signals || {});
  return maybeEnhanceCoach(rule, signals);
}

// ─── Threat Explanations ────────────────────────────────────────────
function ruleBasedThreatExplain(warning) {
  const w = String(warning || '').toLowerCase();
  let explanation = 'No specific threat detected. Maintain good security hygiene and keep your apps updated.';
  let severity = 'low';
  if (w.includes('root')) {
    explanation = 'A rooted device bypasses OS protections, letting malicious apps read other apps data and stored secrets. Avoid storing sensitive data on a rooted device.';
    severity = 'high';
  } else if (w.includes('open wifi') || w.includes('open network') || w.includes('untrusted wifi')) {
    explanation = 'Open Wi-Fi allows attackers on the same network to intercept traffic (MITM). Use a VPN or cellular data for sensitive activity.';
    severity = 'medium';
  } else if (w.includes('duress')) {
    explanation = 'A duress PIN lets you open a decoy vault under coercion while quietly alerting trusted contacts. Set one up in case you are forced to unlock.';
    severity = 'high';
  } else if (w.includes('phish') || w.includes('scam')) {
    explanation = 'Phishing attempts trick you into revealing credentials or installing malware. Verify senders and never enter secrets via links.';
    severity = 'medium';
  } else if (w.includes('malware') || w.includes('spyware')) {
    explanation = 'Malware/spyware can exfiltrate data, record audio, and track location. Run a scan, revoke permissions, and remove the offending app.';
    severity = 'high';
  } else if (w) {
    explanation = `Detected concern: "${warning}". Review the affected setting, update the app/OS, and follow the recommended remediation.`;
    severity = 'medium';
  }
  return { provider: 'rule-based', explanation, severity };
}

async function maybeEnhanceThreat(ruleResult, warning) {
  if (!process.env.OPENAI_API_KEY || typeof fetch !== 'function') return ruleResult;
  try {
    const prompt = `Explain this mobile security warning in plain language and give its severity (low/medium/high): "${warning}".`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) throw new Error('llm bad status');
    const data = await resp.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('empty llm');
    return { provider: 'llm', explanation: content.trim().slice(0, 400), severity: ruleResult.severity };
  } catch (_) {
    return ruleResult;
  }
}

async function threatExplain(warning) {
  const rule = ruleBasedThreatExplain(warning || '');
  return maybeEnhanceThreat(rule, warning);
}

// ─── Emergency Assistant ────────────────────────────────────────────
function ruleBasedEmergencyAssist(context) {
  const c = context || {};
  const steps = [
    'Move to a safe location away from immediate danger',
    'Activate Panic Lock to secure your device and data',
    'Notify your trusted contacts with your status',
    'Call your local emergency services number',
    'Preserve evidence (screenshots, logs) if it is safe to do so',
  ];
  if (c.duress) steps.unshift('If coerced, use your duress PIN to open the decoy vault');
  const contactsNote = 'Contact your local emergency number (e.g. 112/911/999 depending on region) and your pre-configured trusted contacts. No personal data is transmitted by the server.';
  return { provider: 'rule-based', steps, contactsNote };
}

async function maybeEnhanceEmergency(ruleResult, _context) {
  if (!process.env.OPENAI_API_KEY || typeof fetch !== 'function') return ruleResult;
  try {
    const prompt = `Provide ordered emergency safety steps for a mobile user in distress. No PII.`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) throw new Error('llm bad status');
    const data = await resp.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('empty llm');
    return { provider: 'llm', steps: ruleResult.steps, contactsNote: ruleResult.contactsNote };
  } catch (_) {
    return ruleResult;
  }
}

async function emergencyAssist(context) {
  const rule = ruleBasedEmergencyAssist(context || {});
  return maybeEnhanceEmergency(rule, context);
}

module.exports = {
  advise,
  summarizeIncident,
  privacyCoach,
  threatExplain,
  emergencyAssist,
  ruleBasedAdvise,
  ruleBasedSummarize,
};
