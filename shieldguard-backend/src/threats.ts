export interface Threat {
  id: string;
  name: string;
  type: 'spyware' | 'malware' | 'adware' | 'ransomware' | 'trojan' | 'surveillance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  packageNames: string[];
  indicators: string[];
  remediation: string;
}

export interface SuspiciousDomain {
  domain: string;
  type: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
}

export const THREAT_DATABASE: Threat[] = [
  {
    id: 'pegasus',
    name: 'Pegasus Spyware',
    type: 'surveillance',
    severity: 'critical',
    description: 'NSO Group commercial spyware capable of zero-click exploits, wiretapping, and complete device compromise.',
    packageNames: ['com.pegasus', 'com.nso', 'org.pegasus'],
    indicators: ['excessive battery drain', 'unusual network activity', 'camera indicator flicker'],
    remediation: 'Immediately factory reset device. Contact security professionals.',
  },
  {
    id: 'finspy',
    name: 'FinFisher/FinSpy',
    type: 'surveillance',
    severity: 'critical',
    description: 'Gamma Group commercial surveillance tool with extensive monitoring capabilities.',
    packageNames: ['com.finspy', 'com.gamma', 'org.finspy'],
    indicators: ['hidden processes', 'encrypted connections', 'root access attempts'],
    remediation: 'Factory reset and install security updates immediately.',
  },
  {
    id: 'predator',
    name: 'Predator Spyware',
    type: 'surveillance',
    severity: 'critical',
    description: 'Intellexa commercial spyware with advanced persistence mechanisms.',
    packageNames: ['com.predator', 'com.intellexa'],
    indicators: ['system app reinstallation', 'unusual background services'],
    remediation: 'Flash stock firmware, change all passwords.',
  },
  {
    id: 'cytopia',
    name: 'Cytopia',
    type: 'spyware',
    severity: 'high',
    description: 'Android spyware withstealer capabilities for contacts, messages, and location.',
    packageNames: ['com.cytopia', 'android.cytopia'],
    indicators: ['excessive permissions', 'contacts access', 'location tracking'],
    remediation: 'Uninstall app, scan device with antivirus.',
  },
  {
    id: 'emotet',
    name: 'Emotet Malware',
    type: 'malware',
    severity: 'critical',
    description: 'Modular trojan often used as downloader for other malware, including ransomware.',
    packageNames: ['emotet', 'heodo'],
    indicators: ['suspicious email attachments', 'network connections to unknown IPs'],
    remediation: 'Disconnect from network, scan with updated antivirus.',
  },
  {
    id: 'flubot',
    name: 'FluBot',
    type: 'malware',
    severity: 'high',
    description: 'Android banking malware that steals credentials and contacts.',
    packageNames: ['com.flubot', 'flubot'],
    indicators: ['SMS forwarding', 'contact harvesting', 'banking app overlays'],
    remediation: 'Factory reset, enable Play Protect, change banking passwords.',
  },
  {
    id: 'triada',
    name: 'Triada Trojan',
    type: 'trojan',
    severity: 'high',
    description: 'Modular Android trojan with system-level privileges.',
    packageNames: ['com.triada', 'triada'],
    indicators: ['superuser access', 'system modifications', 'app injection'],
    remediation: 'Flash stock firmware, verify app sources.',
  },
  {
    id: 'xhelper',
    name: 'xHelper Malware',
    type: 'malware',
    severity: 'medium',
    description: 'Persistent Android malware that survives factory resets.',
    packageNames: ['com.xhelper', 'xhelper'],
    indicators: ['spontaneous installations', 'advertising popups'],
    remediation: 'Flash stock firmware, disable unknown sources.',
  },
  {
    id: 'stalkerware',
    name: 'Commercial Stalkerware',
    type: 'spyware',
    severity: 'high',
    description: 'Commercial apps marketed for "family monitoring" used for stalking.',
    packageNames: ['com.spymaster', 'com.trackphone', 'com.fleek', 'com.hoverwatch', 'com.spyic'],
    indicators: ['hidden app icon', 'stealth mode', 'location tracking', 'message monitoring'],
    remediation: 'Review apps, check for hidden apps in settings.',
  },
  {
    id: 'keylogger',
    name: 'Android Keylogger',
    type: 'spyware',
    severity: 'high',
    description: 'Records keystrokes to steal credentials and personal information.',
    packageNames: ['com.keylogger', 'keylog', 'keyloger'],
    indicators: ['accessibility service use', 'keyboard switching'],
    remediation: 'Remove accessibility permissions, scan device.',
  },
  {
    id: 'joker',
    name: 'Joker Malware',
    type: 'malware',
    severity: 'high',
    description: 'Premium SMS subscribing adwars that silently signs up for paid services.',
    packageNames: ['com.joker', 'joker'],
    indicators: ['premium SMS', 'unauthorized charges', 'suspicious SMS logs'],
    remediation: 'Check phone bill, contact carrier to block premium SMS.',
  },
  {
    id: 'notcompatible',
    name: 'NotCompatible Malware',
    type: 'malware',
    severity: 'medium',
    description: 'Android malware that turns devices into proxies for criminal activity.',
    packageNames: ['com.notcompatible', 'notcompatible'],
    indicators: ['suspicious proxy traffic', 'new CA certificates'],
    remediation: 'Remove unknown certificates, reset network settings.',
  },
  {
    id: 'dirtycow',
    name: 'Dirty COW Exploit',
    type: 'trojan',
    severity: 'critical',
    description: 'Linux kernel privilege escalation exploit used to gain root access.',
    packageNames: ['dirtycow'],
    indicators: ['root access', 'system file modifications'],
    remediation: 'Apply security patches, verify root integrity.',
  },
  {
    id: 'certes',
    name: 'Certes Spyware',
    type: 'surveillance',
    severity: 'critical',
    description: 'Government-developed surveillance tool for dissidents and journalists.',
    packageNames: ['com.certes', 'org.certes'],
    indicators: ['voice recording', 'document access', 'location tracking'],
    remediation: 'Factory reset, use secure communication apps.',
  },
  {
    id: 'ai_data_integration',
    name: 'AI Data Integration Platform',
    type: 'surveillance',
    severity: 'critical',
    description: 'AI and data integration platforms for mass surveillance and behavioral profiling.',
    packageNames: ['com.dataagg', 'org.profilingai', 'ai-integration-service'],
    indicators: ['behavioral profiling', 'data aggregation', 'entity relationship mapping', 'financial transaction tracking'],
    remediation: 'Block all data aggregation domain connections, encrypt behavioral metadata, use Tor.',
  },
  {
    id: 'location_tracker',
    name: 'Location Tracking Platform',
    type: 'surveillance',
    severity: 'critical',
    description: 'Location-tracking and social media monitoring software for tracking devices across geographic areas.',
    packageNames: ['com.loctracker', 'org.tracking-service', 'socialmedia-monitor'],
    indicators: ['location history upload', 'social media data collection', 'timeline correlation', 'geofence tracking'],
    remediation: 'Disable location services, use GPS spoofing, block tracking servers, encrypt social profiles.',
  },
  {
    id: 'facial_biometric_db',
    name: 'Facial Recognition Database',
    type: 'surveillance',
    severity: 'critical',
    description: 'Facial recognition and biometric databases with photos harvested from social media platforms.',
    packageNames: ['com.facialdb', 'biometric-recognition-service'],
    indicators: ['photo uploads', 'profile scraping', 'facial biometric collection', 'database queries'],
    remediation: 'Encrypt social media profiles, use facial recognition blockers, limit photo sharing.',
  },
  {
    id: 'device_forensics',
    name: 'Digital Forensics Tools',
    type: 'trojan',
    severity: 'critical',
    description: 'Digital forensics and mobile device extraction tools for unauthorized device data access.',
    packageNames: ['com.forensics', 'extraction-service', 'device-analyzer'],
    indicators: ['USB debugging enabled', 'bootloader access', 'filesystem enumeration', 'memory dumps'],
    remediation: 'Enable extraction PIN lock, disable USB debugging, use PIN authentication for all device access.',
  },
  {
    id: 'autonomous_surveillance',
    name: 'Autonomous Surveillance System',
    type: 'surveillance',
    severity: 'critical',
    description: 'Autonomous surveillance infrastructure for large-scale location tracking and monitoring.',
    packageNames: ['com.autosurv', 'surveillance-infrastructure', 'autonomous-tracker'],
    indicators: ['radar signature exposure', 'autonomous vehicle communication', 'thermal signature', 'RF monitoring'],
    remediation: 'Use thermal masking, RF signal blocking, GPS spoofing, avoid geofenced areas.',
  },
];

export const SURVEILLANCE_INFRASTRUCTURE: string[] = [
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

export const SUSPICIOUS_DOMAINS: SuspiciousDomain[] = [
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
  // Enterprise AI Data Integration Platforms
  { domain: 'enterprise-data-intel.net', type: 'surveillance', risk: 'critical' },
  { domain: 'ai-data-platform.com', type: 'surveillance', risk: 'critical' },
  { domain: 'data-aggregation.io', type: 'surveillance', risk: 'critical' },
  // Location Tracking Platforms
  { domain: 'location-tracker.net', type: 'surveillance', risk: 'critical' },
  { domain: 'phonepattern.net', type: 'surveillance', risk: 'critical' },
  { domain: 'icop-server.com', type: 'surveillance', risk: 'critical' },
  { domain: 'patterntracer.io', type: 'surveillance', risk: 'critical' },
  // Facial Recognition Databases
  { domain: 'facial-recognition-db.com', type: 'surveillance', risk: 'critical' },
  { domain: 'biometric-scraping.ai', type: 'surveillance', risk: 'critical' },
  // Mobile Forensics Extraction Tools
  { domain: 'mobile-forensics-cloud.com', type: 'forensics', risk: 'critical' },
  { domain: 'ufed-server.com', type: 'forensics', risk: 'critical' },
  { domain: 'device-extraction.io', type: 'forensics', risk: 'critical' },
  // Digital Forensics Tools
  { domain: 'magnet-forensics.com', type: 'forensics', risk: 'critical' },
  { domain: 'ief-cloud.magnet.io', type: 'forensics', risk: 'critical' },
  { domain: 'evidence-manager.magnet.com', type: 'forensics', risk: 'critical' },
  // Autonomous Surveillance Systems
  { domain: 'autonomous-surveillance.net', type: 'surveillance', risk: 'critical' },
  { domain: 'surveillance-tower.io', type: 'surveillance', risk: 'critical' },
  { domain: 'auto-tracker.com', type: 'surveillance', risk: 'critical' },
];

export function checkPackageForThreat(packageName: string): Threat | null {
  const lowerPackage = packageName.toLowerCase();
  for (const threat of THREAT_DATABASE) {
    for (const pkg of threat.packageNames) {
      if (lowerPackage.includes(pkg.toLowerCase())) {
        return threat;
      }
    }
  }
  return null;
}

export function checkDomainReputation(domain: string): { risk: string; type: string } | null {
  const lowerDomain = domain.toLowerCase();
  for (const d of SUSPICIOUS_DOMAINS) {
    if (lowerDomain.includes(d.domain)) {
      return { risk: d.risk, type: d.type };
    }
  }
  return null;
}

export function getAllThreats(): Threat[] {
  return THREAT_DATABASE;
}

export function getLatestThreatFeed(): Threat[] {
  return THREAT_DATABASE.slice(0, 10);
}