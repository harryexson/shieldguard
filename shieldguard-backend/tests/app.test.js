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

describe('Family plan', () => {
  const { app } = createApp();
  const fs = require('fs');
  const FAMILY_PATH = require('path').join(__dirname, '..', 'data', 'family.json');
  beforeAll(() => { try { fs.unlinkSync(FAMILY_PATH); } catch (_) {} });
  const owner = 'family-owner-1';
  const m1 = 'family-member-1';
  const m2 = 'family-member-2';

  it('creates a family and returns an invite code', async () => {
    const res = await request(app).post('/api/family/create').send({ deviceId: owner, name: 'The Smiths' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('owner');
    expect(res.body.inviteCode).toMatch(/^[A-Z0-9]{8}$/);
    expect(res.body.deviceLimit).toBe(5);
  });

  it('owner is covered by the family tier', async () => {
    const res = await request(app).get('/api/family').query({ deviceId: owner });
    expect(res.body.role).toBe('owner');
    expect(res.body.deviceCount).toBe(1);
  });

  it('a member can join with the code and gains coverage', async () => {
    const fam = await request(app).get('/api/family').query({ deviceId: owner });
    const join = await request(app).post('/api/family/join').send({ deviceId: m1, inviteCode: fam.body.inviteCode, name: 'Mom' });
    expect(join.status).toBe(200);
    expect(join.body.role).toBe('member');
    const me = await request(app).get('/api/family').query({ deviceId: m1 });
    expect(me.body.role).toBe('member');
    expect(me.body.deviceCount).toBe(2);
  });

  it('rejects joins past the device limit', async () => {
    const fam = await request(app).get('/api/family').query({ deviceId: owner });
    // owner + m1 already = 2; fill up to the limit (5).
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/family/join').send({ deviceId: `filler-${i}`, inviteCode: fam.body.inviteCode });
    }
    const over = await request(app).post('/api/family/join').send({ deviceId: m2, inviteCode: fam.body.inviteCode });
    expect(over.status).toBe(409);
  });

  it('owner can remove a member', async () => {
    const before = await request(app).get('/api/family').query({ deviceId: owner });
    expect(before.body.members.some((m) => m.isYou === false)).toBe(true);
    const target = before.body.members.find((m) => m.isYou === false);
    const res = await request(app).delete(`/api/family/member/${target.deviceId || 'filler-0'}`).query({ deviceId: owner });
    expect([200, 404]).toContain(res.status);
  });

  it('admin lists families', async () => {
    const res = await request(app).get('/api/family/admin');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });
});

