interface HeuristicResult {
  score: number;
  confidence: number;
  riskFactors: string[];
  recommendation: string;
}

interface BehavioralPattern {
  pattern: string;
  weight: number;
  description: string;
}

const BEHAVIORAL_PATTERNS: BehavioralPattern[] = [
  { pattern: 'excessive-permissions', weight: 30, description: 'App requests more permissions than needed for core function' },
  { pattern: 'background-data-exfil', weight: 40, description: 'Sustained background data transmission to unknown endpoints' },
  { pattern: 'accessibility-abuse', weight: 35, description: 'App uses accessibility service without clear accessibility purpose' },
  { pattern: 'hidden-process', weight: 45, description: 'App runs processes not visible in normal app lists' },
  { pattern: 'privilege-escalation', weight: 50, description: 'App attempts to gain root or system-level access' },
  { pattern: 'dynamic-code-loading', weight: 25, description: 'App downloads and executes code at runtime from external sources' },
  { pattern: 'packed-binary', weight: 20, description: 'App binary is obfuscated or packed to evade signature detection' },
  { pattern: 'suspicious-domain-callout', weight: 35, description: 'App communicates with domains known for malicious activity' },
  { pattern: 'zero-permission-abuse', weight: 15, description: 'App uses side channels to access data without explicit permissions' },
  { pattern: 'persistence-mechanism', weight: 40, description: 'App installs components that survive factory reset or uninstall' },
];

const KNOWN_THREAT_SIGNATURES: Record<string, string[]> = {
  pegasus: ['zero-click', 'imessage-exploit', 'whatsapp-vuln', 'nsg-group'],
  finspy: ['gamma-group', 'hidden-process', 'encrypted-comms', 'persistence'],
  predator: ['intellexa', 'system-reinstall', 'background-services', 'evasion'],
  stalkerware: ['location-streaming', 'call-recording', 'hidden-icon', 'stealth-mode'],
};

function extractHashes(content: string): string[] {
  const hashes: string[] = [];
  const md5Match = content.match(/[a-f0-9]{32}/gi);
  const sha1Match = content.match(/[a-f0-9]{40}/gi);
  const sha256Match = content.match(/[a-f0-9]{64}/gi);
  if (md5Match) hashes.push(...md5Match);
  if (sha1Match) hashes.push(...sha1Match);
  if (sha256Match) hashes.push(...sha256Match);
  return hashes;
}

function calculateHeuristicScore(indicators: string[]): HeuristicResult {
  let totalWeight = 0;
  let matchedWeight = 0;
  const riskFactors: string[] = [];

  for (const pattern of BEHAVIORAL_PATTERNS) {
    totalWeight += pattern.weight;
    const matchesPattern = indicators.some(ind =>
      ind.toLowerCase().includes(pattern.pattern.replace(/-/g, '')) ||
      pattern.description.toLowerCase().includes(ind.toLowerCase())
    );
    if (matchesPattern) {
      matchedWeight += pattern.weight;
      riskFactors.push(pattern.description);
    }
  }

  const rawScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
  const confidence = Math.min(100, Math.round(riskFactors.length * 12 + 20));

  let recommendation: string;
  if (rawScore >= 70) {
    recommendation = 'High risk: Immediate quarantine and factory reset recommended';
  } else if (rawScore >= 40) {
    recommendation = 'Medium risk: Investigate app permissions and network behavior';
  } else if (rawScore >= 20) {
    recommendation = 'Low risk: Monitor app behavior and review permissions';
  } else {
    recommendation = 'Minimal risk: Continue normal monitoring';
  }

  return { score: rawScore, confidence, riskFactors, recommendation };
}

function detectThreatFamily(indicators: string[]): string[] {
  const matched: string[] = [];
  const joined = indicators.join(' ').toLowerCase();

  for (const [family, signatures] of Object.entries(KNOWN_THREAT_SIGNATURES)) {
    const matchCount = signatures.filter(sig => joined.includes(sig)).length;
    if (matchCount >= 2) {
      matched.push(family);
    }
  }

  return matched;
}

export function analyzeThreatRisk(packageName: string, permissions: string[], indicators: string[]): HeuristicResult {
  const baseResult = calculateHeuristicScore(indicators);
  const families = detectThreatFamily(indicators);

  let adjustedScore = baseResult.score;

  const dangerousPermissions = [
    'camera', 'record_audio', 'access_fine_location', 'access_coarse_location',
    'read_sms', 'send_sms', 'read_contacts', 'read_call_log', 'bind_accessibility_service',
  ];

  const riskCount = permissions.filter(p =>
    dangerousPermissions.some(dp => p.toLowerCase().includes(dp))
  ).length;

  if (riskCount >= 4) adjustedScore = Math.min(100, adjustedScore + 20);
  else if (riskCount >= 2) adjustedScore = Math.min(100, adjustedScore + 10);

  if (families.length > 0) {
    adjustedScore = Math.min(100, adjustedScore + 15);
  }

  if (adjustedScore !== baseResult.score) {
    baseResult.score = adjustedScore;
    baseResult.confidence = Math.min(100, baseResult.confidence + 5);

    if (adjustedScore >= 70) {
      baseResult.recommendation = 'High risk: Immediate quarantine and factory reset recommended';
    }
  }

  return baseResult;
}

export function compareFileHashes(content: string): { match: boolean; matchedHashes: string[]; threatNames: string[] } {
  const hashes = extractHashes(content);
  if (hashes.length === 0) {
    return { match: false, matchedHashes: [], threatNames: [] };
  }
  return { match: false, matchedHashes: hashes, threatNames: [] };
}

export function getHeuristicPatterns(): BehavioralPattern[] {
  return BEHAVIORAL_PATTERNS;
}

export function getThreatSignatures(): string[] {
  return Object.keys(KNOWN_THREAT_SIGNATURES);
}
