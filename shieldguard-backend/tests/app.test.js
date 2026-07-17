'use strict';

const request = require('supertest');
const { createApp } = require('../src/index');
const { analyzeSms, analyzeEmail } = require('../src/detection');
const { generateThreats, loadThreatData, SURVEILLANCE_INFRASTRUCTURE } = require('../src/threatData');

describe('threatData generator', () => {
  it('produces a large, deterministic dataset', () => {
    const data = generateThreats(1000);
    expect(data.threats.length).toBeGreaterThanOrEqual(1000);
    expect(Object.keys(data.knownHashes).length).toBe(data.threats.length);
  });

  it('includes surveillance infrastructure domains', () => {
    const data = loadThreatData();
    const domains = data.domains.map((d) => d.domain);
    for (const s of SURVEILLANCE_INFRASTRUCTURE) {
      expect(domains).toContain(s);
    }
  });
});

describe('detection heuristics', () => {
  it('flags a phishing SMS', () => {
    const r = analyzeSms('Urgent: verify your bank password now via bit.ly/abc or your account is locked');
    expect(r.phishing).toBe(true);
    expect(r.score).toBeGreaterThan(35);
  });

  it('does not flag a benign SMS', () => {
    const r = analyzeSms('Hey, are we still on for lunch at 1?');
    expect(r.phishing).toBe(false);
  });

  it('detects email sender spoofing', () => {
    const r = analyzeEmail({ from: 'PayPal Security <noreply@evil.example>', subject: 'verify your account', body: '' });
    expect(r.phishing).toBe(true);
    expect(r.reasons.join(' ')).toMatch(/PayPal/i);
  });
});

describe('API', () => {
  const { app } = createApp();

  it('health check reports dataset size', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.threats).toBeGreaterThan(1000);
    expect(res.body.hashes).toBeGreaterThan(1000);
  });

  it('checks a known threat package', async () => {
    const res = await request(app).get('/api/threats/check/com.pegasus.fake');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('pegasus');
  });

  it('flags surveillance infrastructure domains', async () => {
    const res = await request(app).get(`/api/network/check/${SURVEILLANCE_INFRASTRUCTURE[0]}`);
    expect(res.body.risk).toBe('critical');
  });

  it('scans apps and returns threats', async () => {
    const res = await request(app).post('/api/scan').send({ apps: [{ packageName: 'com.nso.agent' }, { packageName: 'com innocent.app' }] });
    expect(res.status).toBe(200);
    expect(res.body.threatsFound).toBe(1);
  });

  it('matches known hashes', async () => {
    const data = loadThreatData();
    const known = Object.keys(data.knownHashes)[0];
    const res = await request(app).post('/api/ai/analyze-hashes').send({ hashes: [known, 'deadbeef'] });
    expect(res.status).toBe(200);
    expect(res.body.match).toBe(true);
    expect(res.body.matchedCount).toBe(1);
  });

  it('returns 402 for gated feature on free tier', async () => {
    const res = await request(app).post('/api/scan/sms').send({ text: 'hi', deviceId: 'free-device-123' });
    expect(res.status).toBe(402);
  });

  it('rejects invalid input with 400', async () => {
    const res = await request(app).post('/api/ai/analyze').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
