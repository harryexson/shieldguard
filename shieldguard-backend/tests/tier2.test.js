'use strict';

const request = require('supertest');
const fs = require('fs');
const { createApp } = require('../src/index');
const { BACKUPS_PATH, DEVICE_SECURITY_PATH, AI_REPORTS_PATH } = require('../src/tier2');

const DATA_FILES = [BACKUPS_PATH, DEVICE_SECURITY_PATH, AI_REPORTS_PATH];

describe('Tier 2: Privacy / Security backend', () => {
  const { app } = createApp();
  const device = 'tier2-device-1';
  const otherDevice = 'tier2-device-2';

  beforeAll(() => {
    for (const f of DATA_FILES) {
      try { fs.unlinkSync(f); } catch (_) {}
    }
  });

  it('exports a backup and GET latest returns the SAME ciphertext', async () => {
    const ciphertext = 'CLIENT_ENC_BLOB_DO_NOT_READ';
    const name = 'My Vault 2026';
    const exp = await request(app).post('/api/backup/export').send({ deviceId: device, ciphertext, name });
    expect(exp.status).toBe(201);
    expect(exp.body.id).toBeDefined();
    expect(exp.body.name).toBe(name);

    const latest = await request(app).get('/api/backup/latest').query({ deviceId: device });
    expect(latest.status).toBe(200);
    expect(latest.body.ciphertext).toBe(ciphertext);
    expect(latest.body.name).toBe(name);

    const none = await request(app).get('/api/backup/latest').query({ deviceId: otherDevice });
    expect(none.status).toBe(404);
    expect(none.body.error).toBe('No backup found');
  });

  it('saves a device security-scan and GET returns it', async () => {
    const post = await request(app).post('/api/device/security-scan').send({ deviceId: device, posture: { rooted: false }, details: { score: 90 } });
    expect(post.status).toBe(200);
    expect(post.body.ok).toBe(true);
    expect(post.body.storedAt).toBeDefined();

    const get = await request(app).get('/api/device/security-scan').query({ deviceId: device });
    expect(get.status).toBe(200);
    expect(get.body.posture.rooted).toBe(false);
    expect(get.body.details.score).toBe(90);
  });

  it('AI advise (rule-based, no key) flags failing signals', async () => {
    const res = await request(app).post('/api/ai/advise').send({ signals: { rooted: true, screenLock: false } });
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('rule-based');
    expect(res.body.riskLevel).not.toBe('low');
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });

  it('AI summarize-incident with duress is high/critical and admin aggregate is redacted', async () => {
    const res = await request(app).post('/api/ai/summarize-incident').send({ deviceId: device, events: [{ type: 'duress', at: Date.now() }, { type: 'config_change', at: Date.now() }] });
    expect(res.status).toBe(200);
    expect(['high', 'critical']).toContain(res.body.riskLevel);

    const admin = await request(app).get('/api/ai/reports/admin');
    expect(admin.status).toBe(200);
    expect(admin.body.count).toBeGreaterThanOrEqual(1);
    const recent0 = admin.body.recent[admin.body.recent.length - 1];
    expect(recent0).toBeDefined();
    expect(recent0).not.toHaveProperty('detail');
    expect(recent0).not.toHaveProperty('events');
    expect(recent0).toHaveProperty('id');
    expect(recent0).toHaveProperty('riskLevel');
    expect(recent0).toHaveProperty('preview');
    expect(recent0).toHaveProperty('generatedAt');
    expect(recent0.deviceId.length).toBeLessThanOrEqual(6);
  });
});
