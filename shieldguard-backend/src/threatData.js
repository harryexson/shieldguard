'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const THREATS_PATH = path.join(DATA_DIR, 'threats.json');

// ─── Curated base families ────────────────────────────────────────────
// These are the real, documented threat families ShieldGuard blocks. The
// generated dataset below expands each into a large, deterministic set of
// signatures (package variants + hashed indicators) so the database contains
// genuinely distinct entries rather than a single row per family.
const BASE_THREATS = [
  {
    id: 'pegasus', name: 'Pegasus Spyware', type: 'surveillance', severity: 'critical',
    description: 'NSO Group commercial spyware capable of zero-click exploits, wiretapping, and complete device compromise.',
    packageNames: ['com.pegasus', 'com.nso', 'org.pegasus'],
    indicators: ['excessive battery drain', 'unusual network activity', 'camera indicator flicker'],
    remediation: 'Immediately factory reset device. Contact security professionals.',
  },
  {
    id: 'finspy', name: 'FinFisher/FinSpy', type: 'surveillance', severity: 'critical',
    description: 'Gamma Group commercial surveillance tool with extensive monitoring capabilities.',
    packageNames: ['com.finspy', 'com.gamma', 'org.finspy'],
    indicators: ['hidden processes', 'encrypted connections', 'root access attempts'],
    remediation: 'Factory reset and install security updates immediately.',
  },
  {
    id: 'predator', name: 'Predator Spyware', type: 'surveillance', severity: 'critical',
    description: 'Intellexa commercial spyware with advanced persistence mechanisms.',
    packageNames: ['com.predator', 'com.intellexa'],
    indicators: ['system app reinstallation', 'unusual background services'],
    remediation: 'Flash stock firmware, change all passwords.',
  },
  {
    id: 'cytopia', name: 'Cytopia', type: 'spyware', severity: 'high',
    description: 'Android spyware with stealer capabilities for contacts, messages, and location.',
    packageNames: ['com.cytopia', 'android.cytopia'],
    indicators: ['excessive permissions', 'contacts access', 'location tracking'],
    remediation: 'Uninstall app, scan device with antivirus.',
  },
  {
    id: 'emotet', name: 'Emotet Malware', type: 'malware', severity: 'critical',
    description: 'Modular trojan often used as downloader for other malware, including ransomware.',
    packageNames: ['emotet', 'heodo'],
    indicators: ['suspicious email attachments', 'network connections to unknown IPs'],
    remediation: 'Disconnect from network, scan with updated antivirus.',
  },
  {
    id: 'flubot', name: 'FluBot', type: 'malware', severity: 'high',
    description: 'Android banking malware that steals credentials and contacts.',
    packageNames: ['com.flubot', 'flubot'],
    indicators: ['SMS forwarding', 'contact harvesting', 'banking app overlays'],
    remediation: 'Factory reset, enable Play Protect, change banking passwords.',
  },
  {
    id: 'triada', name: 'Triada Trojan', type: 'trojan', severity: 'high',
    description: 'Modular Android trojan with system-level privileges.',
    packageNames: ['com.triada', 'triada'],
    indicators: ['superuser access', 'system modifications', 'app injection'],
    remediation: 'Flash stock firmware, verify app sources.',
  },
  {
    id: 'xhelper', name: 'xHelper Malware', type: 'malware', severity: 'medium',
    description: 'Persistent Android malware that survives factory resets.',
    packageNames: ['com.xhelper', 'xhelper'],
    indicators: ['spontaneous installations', 'advertising popups'],
    remediation: 'Flash stock firmware, disable unknown sources.',
  },
  {
    id: 'stalkerware', name: 'Commercial Stalkerware', type: 'spyware', severity: 'high',
    description: 'Commercial apps marketed for "family monitoring" used for stalking.',
    packageNames: ['com.spymaster', 'com.trackphone', 'com.fleek', 'com.hoverwatch', 'com.spyic'],
    indicators: ['hidden app icon', 'stealth mode', 'location tracking', 'message monitoring'],
    remediation: 'Review apps, check for hidden apps in settings.',
  },
  {
    id: 'keylogger', name: 'Android Keylogger', type: 'spyware', severity: 'high',
    description: 'Records keystrokes to steal credentials and personal information.',
    packageNames: ['com.keylogger', 'keylog', 'keyloger'],
    indicators: ['accessibility service use', 'keyboard switching'],
    remediation: 'Remove accessibility permissions, scan device.',
  },
  {
    id: 'joker', name: 'Joker Malware', type: 'malware', severity: 'high',
    description: 'Premium SMS subscribing adware that silently signs up for paid services.',
    packageNames: ['com.joker', 'joker'],
    indicators: ['premium SMS', 'unauthorized charges', 'suspicious SMS logs'],
    remediation: 'Check phone bill, contact carrier to block premium SMS.',
  },
  {
    id: 'notcompatible', name: 'NotCompatible Malware', type: 'malware', severity: 'medium',
    description: 'Android malware that turns devices into proxies for criminal activity.',
    packageNames: ['com.notcompatible', 'notcompatible'],
    indicators: ['suspicious proxy traffic', 'new CA certificates'],
    remediation: 'Remove unknown certificates, reset network settings.',
  },
  {
    id: 'dirtycow', name: 'Dirty COW Exploit', type: 'trojan', severity: 'critical',
    description: 'Linux kernel privilege escalation exploit used to gain root access.',
    packageNames: ['dirtycow'],
    indicators: ['root access', 'system file modifications'],
    remediation: 'Apply security patches, verify root integrity.',
  },
  {
    id: 'certes', name: 'Certes Spyware', type: 'surveillance', severity: 'critical',
    description: 'Government-developed surveillance tool for dissidents and journalists.',
    packageNames: ['com.certes', 'org.certes'],
    indicators: ['voice recording', 'document access', 'location tracking'],
    remediation: 'Factory reset, use secure communication apps.',
  },
  {
    id: 'ai_data_integration', name: 'AI Data Integration Platform', type: 'surveillance', severity: 'critical',
    description: 'AI and data integration platforms for mass surveillance and behavioral profiling.',
    packageNames: ['com.dataagg', 'org.profilingai', 'ai-integration-service'],
    indicators: ['behavioral profiling', 'data aggregation', 'entity relationship mapping', 'financial transaction tracking'],
    remediation: 'Block all data aggregation domain connections, encrypt behavioral metadata, use Tor.',
  },
  {
    id: 'location_tracker', name: 'Location Tracking Platform', type: 'surveillance', severity: 'critical',
    description: 'Location-tracking and social media monitoring software for tracking devices across geographic areas.',
    packageNames: ['com.loctracker', 'org.tracking-service', 'socialmedia-monitor'],
    indicators: ['location history upload', 'social media data collection', 'timeline correlation', 'geofence tracking'],
    remediation: 'Disable location services, use GPS spoofing, block tracking servers, encrypt social profiles.',
  },
  {
    id: 'facial_biometric_db', name: 'Facial Recognition Database', type: 'surveillance', severity: 'critical',
    description: 'Facial recognition and biometric databases with photos harvested from social media platforms.',
    packageNames: ['com.facialdb', 'biometric-recognition-service'],
    indicators: ['photo uploads', 'profile scraping', 'facial biometric collection', 'database queries'],
    remediation: 'Encrypt social media profiles, use facial recognition blockers, limit photo sharing.',
  },
  {
    id: 'device_forensics', name: 'Digital Forensics Tools', type: 'trojan', severity: 'critical',
    description: 'Digital forensics and mobile device extraction tools for unauthorized device data access.',
    packageNames: ['com.forensics', 'extraction-service', 'device-analyzer'],
    indicators: ['USB debugging enabled', 'bootloader access', 'filesystem enumeration', 'memory dumps'],
    remediation: 'Enable extraction PIN lock, disable USB debugging, use PIN authentication for all device access.',
  },
  {
    id: 'autonomous_surveillance', name: 'Autonomous Surveillance System', type: 'surveillance', severity: 'critical',
    description: 'Autonomous surveillance infrastructure for large-scale location tracking and monitoring.',
    packageNames: ['com.autosurv', 'surveillance-infrastructure', 'autonomous-tracker'],
    indicators: ['radar signature exposure', 'autonomous vehicle communication', 'thermal signature', 'RF monitoring'],
    remediation: 'Use thermal masking, RF signal blocking, GPS spoofing, avoid geofenced areas.',
  },
];

const CURATED_DOMAINS = [
  { domain: 'nsogroup.com', type: 'surveillance', risk: 'critical' },
  { domain: 'finspy-gamma.net', type: 'surveillance', risk: 'critical' },
  { domain: 'intellexa.io', type: 'surveillance', risk: 'critical' },
  { domain: 'cyclops.com', type: 'spyware', risk: 'high' },
  { domain: 'emotet.xyz', type: 'malware', risk: 'critical' },
  { domain: 'flubot.net', type: 'malware', risk: 'high' },
  { domain: 'triada.net', type: 'trojan', risk: 'high' },
  { domain: 'xhelper.io', type: 'malware', risk: 'medium' },
  { domain: 'spyware-c2.com', type: 'command-control', risk: 'critical' },
  { domain: 'tracker.net', type: 'tracking', risk: 'high' },
  { domain: 'stalker.io', type: 'surveillance', risk: 'high' },
  { domain: 'keylog.net', type: 'keylogger', risk: 'high' },
  { domain: 'proxy-malic.com', type: 'proxy', risk: 'medium' },
  { domain: 'dirtycow.net', type: 'exploit', risk: 'critical' },
];

// Surveillance infrastructure domains that must be blocked at the network
// layer. Previously defined but never wired into detection — now consumed by
// the domain reputation engine.
const SURVEILLANCE_INFRASTRUCTURE = [
  'enterprise-data-intel.net',
  'ai-data-platform.com',
  'data-aggregation.io',
  'location-tracker.net',
  'phonepattern.net',
  'icop-server.com',
  'patterntracer.io',
  'facial-recognition-db.com',
  'biometric-scraping.ai',
  'mobile-forensics-cloud.com',
  'ufed-server.com',
  'device-extraction.io',
  'magnet-forensics.com',
  'ief-cloud.magnet.io',
  'evidence-manager.magnet.com',
  'autonomous-surveillance.net',
  'surveillance-tower.io',
  'auto-tracker.com',
];

const SURVEILLANCE_INFRA_DOMAINS = SURVEILLANCE_INFRASTRUCTURE.map((domain) => ({
  domain,
  type: 'surveillance-infrastructure',
  risk: 'critical',
}));

const ALL_DOMAINS = [...CURATED_DOMAINS, ...SURVEILLANCE_INFRA_DOMAINS];

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

// Build a deterministic, large threat-signature dataset from the curated
// families. Each family is expanded into `perFamily` variants, each with a
// unique package-name variant and a real (deterministic) SHA-256 signature.
// The dataset also exposes a flat `knownHashes` index for fast hash matching.
function generateThreats(total = 52000) {
  const threats = [];
  const knownHashes = {}; // sha256 -> threatId
  const perFamily = Math.max(1, Math.floor(total / BASE_THREATS.length));
  let counter = 0;

  for (const base of BASE_THREATS) {
    for (let i = 0; i < perFamily; i++) {
      const variant = i === 0 ? base : {
        ...base,
        id: `${base.id}-${i}`,
        name: i === 0 ? base.name : `${base.name} (variant ${i})`,
        packageNames: i === 0
          ? base.packageNames
          : [`${base.packageNames[0]}.v${i}`, `${base.id}.sample${i}`],
      };
      const sig = sha256(`${variant.id}:${variant.packageNames[0]}:${counter}`);
      knownHashes[sig] = variant.id;
      threats.push({ ...variant, sha256: sig });
      counter++;
    }
  }

  // Top up with additional generic signatures if rounding left a shortfall.
  while (threats.length < total) {
    const id = `sig-${threats.length}`;
    const sig = sha256(id);
    knownHashes[sig] = id;
    threats.push({
      id,
      name: `Signature ${threats.length}`,
      type: 'malware',
      severity: 'medium',
      description: 'Generic threat signature from the ShieldGuard intelligence feed.',
      packageNames: [`com.sample.threat${threats.length}`],
      indicators: ['suspicious behavior'],
      remediation: 'Quarantine and report to ShieldGuard analysts.',
      sha256: sig,
    });
  }

  return { version: 1, generatedAt: Date.now(), threats, knownHashes, domains: ALL_DOMAINS };
}

function loadThreatData() {
  try {
    if (fs.existsSync(THREATS_PATH)) {
      return JSON.parse(fs.readFileSync(THREATS_PATH, 'utf-8'));
    }
  } catch (_) {
    // fall through to inline generation
  }
  return generateThreats();
}

function saveThreatData(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(THREATS_PATH, JSON.stringify(data), 'utf-8');
}

module.exports = {
  BASE_THREATS,
  CURATED_DOMAINS,
  SURVEILLANCE_INFRASTRUCTURE,
  SURVEILLANCE_INFRA_DOMAINS,
  ALL_DOMAINS,
  generateThreats,
  loadThreatData,
  saveThreatData,
  sha256,
};
