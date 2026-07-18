'use strict';

const request = require('supertest');
const fs = require('fs');
const { createApp } = require('../src/index');
const { SYNC_PATH, COMMANDS_PATH, AUDIT_PATH } = require('../src/tier3');
const { createFamily, joinFamily } = require('../src/family');

const DATA_FILES = [SYNC_PATH, COMMANDS_PATH, AUDIT_PATH];

describe('Tier 3: Privacy / Security backend', () => {
  const { app } = createApp();
  const owner = 'tier3-owner-1';
  const member = 'tier3-member-1';
  const stranger = 'tier3-stranger-1';

  beforeAll(() => {
    for (const f of DATA_FILES) {
      try { fs.unlinkSync(f); } catch (_) {}
    }
    const group = createFamily(owner, 'Tier3 Family');
    joinFamily(group.inviteCode, member, 'Member');
  });

  it('sync: push then pull returns the ciphertext (no decryption); other channel empty; since filters', async () => {
    const ct = 'CLIENT_ENC_MSG_BLOB';
    const push = await request(app).post('/api/sync/push').send({ deviceId: owner, channel: 'c1', ciphertext: ct, kind: 'message' });
    expect(push.status).toBe(201);
    expect(push.body.id).toBeDefined();

    const pull = await request(app).get('/api/sync/pull').query({ channel: 'c1' });
    expect(pull.status).toBe(200);
    expect(pull.body.items.length).toBe(1);
    expect(pull.body.items[0].ciphertext).toBe(ct);

    const other = await request(app).get('/api/sync/pull').query({ channel: 'c2' });
    expect(other.body.items.length).toBe(0);

    const since = await request(app).get('/api/sync/pull').query({ channel: 'c1', since: Date.now() + 1000 });
    expect(since.body.items.length).toBe(0);
  });

  it('sync: pull requires channel', async () => {
    const res = await request(app).get('/api/sync/pull');
    expect(res.status).toBe(400);
  });

  it('commands: owner issues to member (201), stranger 403, member sees + acks', async () => {
    const issue = await request(app).post('/api/device/command').send({ deviceId: owner, targetDeviceId: member, type: 'wipe' });
    expect(issue.status).toBe(201);
    expect(issue.body.status).toBe('pending');
    const cmdId = issue.body.id;

    const bad = await request(app).post('/api/device/command').send({ deviceId: stranger, targetDeviceId: member, type: 'lock' });
    expect(bad.status).toBe(403);

    const list = await request(app).get('/api/device/commands').query({ deviceId: member });
    expect(list.status).toBe(200);
    expect(list.body.commands.some((c) => c.id === cmdId)).toBe(true);

    const ack = await request(app).post(`/api/device/command/${cmdId}/ack`).send({ deviceId: member });
    expect(ack.status).toBe(200);
    expect(ack.body.status).toBe('acked');
  });

  it('admin command: no API key required when REQUIRE_API_KEY unset → 201', async () => {
    const res = await request(app).post('/api/admin/device/command').send({ targetDeviceId: 'tier3-any-device', type: 'wipe' });
    expect(res.status).toBe(201);
    expect(res.body.ownerDeviceId).toBe('<admin>');
  });

  it('audit: append then list returns it; admin aggregate redacted', async () => {
    const post = await request(app).post('/api/audit').send({ deviceId: owner, type: 'panic' });
    expect(post.status).toBe(201);
    expect(post.body.id).toBeDefined();

    const list = await request(app).get('/api/audit').query({ deviceId: owner });
    expect(list.status).toBe(200);
    expect(list.body.events.length).toBeGreaterThanOrEqual(1);

    const admin = await request(app).get('/api/audit/admin');
    expect(admin.status).toBe(200);
    expect(admin.body.count).toBeGreaterThanOrEqual(1);
    const recent0 = admin.body.recent[admin.body.recent.length - 1];
    expect(recent0).toBeDefined();
    expect(recent0).not.toHaveProperty('detail');
    expect(recent0).not.toHaveProperty('events');
    expect(recent0).toHaveProperty('type');
    expect(recent0).toHaveProperty('at');
    expect(recent0.deviceId.length).toBeLessThanOrEqual(6);
  });

  it('AI: privacy-coach tips, threat-explain explanation, emergency-assist steps', async () => {
    const coach = await request(app).post('/api/ai/privacy-coach').send({ signals: { vpnActive: false } });
    expect(coach.status).toBe(200);
    expect(Array.isArray(coach.body.tips)).toBe(true);
    expect(coach.body.tips.length).toBeGreaterThan(0);

    const threat = await request(app).post('/api/ai/threat-explain').send({ warning: 'device is rooted' });
    expect(threat.status).toBe(200);
    expect(typeof threat.body.explanation).toBe('string');
    expect(threat.body.explanation.length).toBeGreaterThan(0);

    const em = await request(app).post('/api/ai/emergency-assist').send({ context: {} });
    expect(em.status).toBe(200);
    expect(Array.isArray(em.body.steps)).toBe(true);
    expect(em.body.steps.length).toBeGreaterThan(0);
  });
});
