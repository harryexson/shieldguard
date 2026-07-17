'use strict';

// Generates data/threats.json — a real, deterministic threat-signature
// dataset (50,000+ entries) consumed by the API at runtime.
const path = require('path');
const { generateThreats, saveThreatData } = require('../src/threatData');

const TARGET = Number(process.argv[2]) || 52000;
const data = generateThreats(TARGET);
saveThreatData(data);
console.log(
  `Generated ${data.threats.length} threats, ${Object.keys(data.knownHashes).length} hashes, ${data.domains.length} domains -> ${path.join(__dirname, '..', 'data', 'threats.json')}`
);
