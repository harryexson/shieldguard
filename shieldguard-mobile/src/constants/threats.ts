import { Threat } from '../types';

export const KNOWN_THREATS: Threat[] = [
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
    id: 'fluBot',
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
    id: 'clipboard malware',
    name: 'Clipboard Hijacker',
    type: 'malware',
    severity: 'medium',
    description: 'Monitors clipboard for cryptocurrency addresses and replaces with attacker addresses.',
    packageNames: ['clipboard', 'crypto.stealer'],
    indicators: ['clipboard access', 'crypto wallet monitoring'],
    remediation: 'Verify before paste, use hardware wallets.',
  },
  {
    id: 'stalkerware-spouse',
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
    description: 'Premium SMS_subscribing adwars that silently signs up for paid services.',
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
];

export const SUSPICIOUS_DOMAINS = [
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
  { domain: 'clipboard-crypto.com', type: 'cryptocurrency-theft', risk: 'medium' },
  { domain: 'proxy-malic.com', type: 'proxy', risk: 'medium' },
  { domain: 'dirtycow.net', type: 'exploit', risk: 'critical' },
];

export const getThreatByPackage = (packageName: string): Threat | undefined => {
  return KNOWN_THREATS.find(threat => 
    threat.packageNames.some(pkg => packageName.toLowerCase().includes(pkg.toLowerCase()))
  );
};

export const getThreatByIndicator = (indicator: string): Threat | undefined => {
  return KNOWN_THREATS.find(threat =>
    threat.indicators.some(ind => indicator.toLowerCase().includes(ind.toLowerCase()))
  );
};

export const getDomainReputation = (domain: string): { risk: string; type: string } | undefined => {
  return SUSPICIOUS_DOMAINS.find(d => domain.toLowerCase().includes(d.domain));
};