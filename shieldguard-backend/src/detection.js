// Real, deterministic detection heuristics for SMS and email. These are not
// "marketing" — they run real pattern analysis and return explainable scores.

const SHORTENERS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 'cutt.ly', 'ow.ly', 't.co', 'rb.gy',
  'rebrand.ly', 'is.gd', 'buff.ly', 'mcaf.ee',
];

const URGENCY = [
  'urgent', 'immediate action', 'act now', 'account suspended', 'account locked',
  'verify now', 'verify your', 'confirm your account', 'will be closed', 'expire today',
  'final notice', 'last warning',
];

const CREDENTIAL_LURES = [
  'otp', 'one-time', 'one time password', 'password', 'your pin', 'enter your pin',
  'verify your identity', 'confirm your identity', 'login credentials', 'sign in to',
  'update your payment', 'reactivate',
];

const PRIZE_BAIT = [
  'you won', 'you have won', 'congratulations', 'claim your', 'claim now', 'reward',
  'gift card', 'free gift', 'bonus', 'lucky winner', 'prize',
];

const BANK_TERMS = [
  'bank', 'card', 'credit', 'debit', 'transaction', 'invoice', 'paypal', 'paypal',
  'refund', 'tax', 'irs', 'gov', 'dmv', 'customs', 'parcel', 'package',
];

function countUrls(text) {
  const matches = text.match(/https?:\/\/[^\s]+/gi) || [];
  return matches;
}

function analyzeSms(text) {
  const t = (text || '').toLowerCase();
  const reasons = [];
  let score = 0;

  const urls = countUrls(text);
  if (urls.length > 0) {
    score += 15;
    reasons.push(`Contains ${urls.length} link(s)`);
    const shortened = urls.filter((u) => SHORTENERS.some((s) => u.includes(s)));
    if (shortened.length > 0) {
      score += 20;
      reasons.push('Uses link shortener(s) common in scams: ' + shortened.join(', '));
    }
  }

  URGENCY.forEach((w) => {
    if (t.includes(w)) {
      score += 12;
      reasons.push(`Urgency language: "${w}"`);
    }
  });
  CREDENTIAL_LURES.forEach((w) => {
    if (t.includes(w)) {
      score += 15;
      reasons.push(`Requests credentials: "${w}"`);
    }
  });
  PRIZE_BAIT.forEach((w) => {
    if (t.includes(w)) {
      score += 10;
      reasons.push(`Prize/prize-bait language: "${w}"`);
    }
  });
  BANK_TERMS.forEach((w) => {
    if (t.includes(w)) {
      score += 6;
      reasons.push(`References sensitive service: "${w}"`);
    }
  });

  const phishing = score >= 35;
  const severity = score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low';
  return { phishing, score: Math.min(100, score), severity, reasons };
}

function parseFromHeader(fromHeader) {
  // Handles "Name <email@domain>" or just "email@domain"
  const match = String(fromHeader || '').match(/<([^>]+)>/);
  const email = (match ? match[1] : fromHeader || '').trim().toLowerCase();
  const at = email.lastIndexOf('@');
  const domain = at >= 0 ? email.slice(at + 1) : '';
  const display = String(fromHeader || '').replace(/<[^>]+>/, '').trim().toLowerCase();
  return { email, domain, display };
}

function authResult(headers) {
  // Best-effort parse of Authentication-Results for spf/dkim/dmarc
  const h = String(headers || '');
  const get = (key) => {
    const m = h.match(new RegExp(`${key}=(pass|fail|softfail|none)`, 'i'));
    return m ? m[1].toLowerCase() : null;
  };
  return { spf: get('spf'), dkim: get('dkim'), dmarc: get('dmarc') };
}

function analyzeEmail({ from, subject, body, headers }) {
  const reasons = [];
  let score = 0;
  const subj = (subject || '').toLowerCase();
  const b = (body || '').toLowerCase();
  const mail = parseFromHeader(from);

  // Sender spoofing: trusted brand name in display but unrelated domain.
  const BRANDS = ['paypal', 'microsoft', 'apple', 'google', 'amazon', 'netflix', 'bank'];
  BRANDS.forEach((brand) => {
    if (mail.display.includes(brand) && mail.domain && !mail.domain.includes(brand)) {
      score += 25;
      reasons.push(`Display name implies "${brand}" but sender domain is "${mail.domain}"`);
    }
  });

  const auth = authResult(headers);
  if (auth.spf === 'fail' || auth.spf === 'softfail') {
    score += 15;
    reasons.push('SPF check failed for sender');
  }
  if (auth.dkim === 'fail') {
    score += 15;
    reasons.push('DKIM signature failed');
  }
  if (auth.dmarc === 'fail') {
    score += 10;
    reasons.push('DMARC check failed');
  }
  if (!auth.spf && !auth.dkim && !auth.dmarc) {
    reasons.push('No authentication headers present (cannot verify sender)');
  }

  const urls = countUrls(body);
  if (urls.length > 0) {
    score += 10;
    reasons.push(`Contains ${urls.length} link(s) in body`);
    const shortened = urls.filter((u) => SHORTENERS.some((s) => u.includes(s)));
    if (shortened.length > 0) {
      score += 15;
      reasons.push('Uses link shortener(s) common in phishing');
    }
  }

  [...URGENCY, ...CREDENTIAL_LURES, ...PRIZE_BAIT].forEach((w) => {
    if (subj.includes(w) || b.includes(w)) {
      score += 8;
      reasons.push(`Phishing language: "${w}"`);
    }
  });

  const phishing = score >= 35;
  const severity = score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low';
  return { phishing, score: Math.min(100, score), severity, reasons, sender: mail };
}

module.exports = { analyzeSms, analyzeEmail, countUrls };
