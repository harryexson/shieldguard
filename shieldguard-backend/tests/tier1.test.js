'use strict';

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { createApp } = require('../src/index');
const { VAULT_PATH, DECOY_PATH, PASSWORDS_PATH, SHARE_PATH, INCIDENTS_PATH } = require('../src/vault');

const DATA_FILES = [VAULT_PATH, DECOY_PATH, PASSWORDS_PATH, SHARE_PATH, INCIDENTS_PATH];

describe('Tier 1: Secure Vault / Privacy', () => {
  const { app } = createApp();
  const device = 'tier1-device-1';

  beforeAll(() => {
    for (const f of DATA_FILES) {
      try { fs.unlinkSync(f); } catch (_) {}
    }
  });

  it('creates, lists (no payload), gets (with payload), deletes a vault item', async () => {
    const create = await request(app).post('/api/vault/items').send({ deviceId: device, folder: 'Docs', name: 'secret', mimeType: 'text/plain', kind: 'note', payload: 'ENC_BLOB' });
    expect(create.status).toBe(201);
    expect(create.body.id).toBeDefined();

    const list = await request(app).get('/api/vault/items').query({ deviceId: device });
    expect(list.status).toBe(200);
    expect(list.body.items.length).toBe(1);
    expect(list.body.items[0]).not.toHaveProperty('payload');

    const get = await request(app).get(`/api/vault/items/${create.body.id}`).query({ deviceId: device });
    expect(get.status).toBe(200);
    expect(get.body.payload).toBe('ENC_BLOB');

    const del = await request(app).delete(`/api/vault/items/${create.body.id}`).send({ deviceId: device });
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });

  it('isolates decoy items from the real vault list', async () => {
    const real = await request(app).post('/api/vault/items').send({ deviceId: device, name: 'real', payload: 'REAL' });
    const decoy = await request(app).post('/api/vault/decoy/items').send({ deviceId: device, name: 'fake', payload: 'FAKE' });
    expect(real.status).toBe(201);
    expect(decoy.status).toBe(201);

    const vaultList = await request(app).get('/api/vault/items').query({ deviceId: device });
    const decoyList = await request(app).get('/api/vault/decoy/items').query({ deviceId: device });
    expect(vaultList.body.items.find((i) => i.name === 'fake')).toBeUndefined();
    expect(decoyList.body.items.find((i) => i.name === 'real')).toBeUndefined();

    await request(app).delete(`/api/vault/items/${real.body.id}`).send({ deviceId: device });
    await request(app).delete(`/api/vault/decoy/items/${decoy.body.id}`).send({ deviceId: device });
  });

  it('creates, lists, gets, deletes a password entry', async () => {
    const create = await request(app).post('/api/passwords/items').send({ deviceId: device, name: 'Bank', username: 'me', siteUrl: 'https://bank', payload: 'PW_ENC' });
    expect(create.status).toBe(201);
    expect(create.body.id).toBeDefined();

    const list = await request(app).get('/api/passwords/items').query({ deviceId: device });
    expect(list.body.items.length).toBe(1);
    expect(list.body.items[0]).not.toHaveProperty('payload');

    const get = await request(app).get(`/api/passwords/items/${create.body.id}`).query({ deviceId: device });
    expect(get.body.payload).toBe('PW_ENC');

    const del = await request(app).delete(`/api/passwords/items/${create.body.id}`).send({ deviceId: device });
    expect(del.body.success).toBe(true);
  });

  it('shares a payload, decrements views, then 404s after first view (maxViews=1)', async () => {
    const create = await request(app).post('/api/share').send({ payload: 'SHARE_ENC', name: 'file', mimeType: 'text/plain', maxViews: 1 });
    expect(create.status).toBe(201);
    expect(create.body.token.startsWith('sh_')).toBe(true);

    const first = await request(app).get(`/api/share/${create.body.token}`);
    expect(first.status).toBe(200);
    expect(first.body.payload).toBe('SHARE_ENC');
    expect(first.body.viewsRemaining).toBe(0);

    const second = await request(app).get(`/api/share/${create.body.token}`);
    expect(second.status).toBe(404);
  });

  it('expires a share after ttlSeconds', async () => {
    const create = await request(app).post('/api/share').send({ payload: 'TTL_ENC', ttlSeconds: 1 });
    expect(create.status).toBe(201);
    await new Promise((r) => setTimeout(r, 1100));
    const get = await request(app).get(`/api/share/${create.body.token}`);
    expect(get.status).toBe(404);
  });

  it('records and resolves a panic incident', async () => {
    const create = await request(app).post('/api/incidents').send({ deviceId: device, type: 'panic', location: 'home' });
    expect(create.status).toBe(201);
    expect(create.body.type).toBe('panic');
    expect(create.body.status).toBe('open');

    const list = await request(app).get('/api/incidents').query({ deviceId: device });
    expect(list.body.count).toBeGreaterThanOrEqual(1);

    const resolve = await request(app).post(`/api/incidents/${create.body.id}/resolve`).send({ resolution: 'safe' });
    expect(resolve.status).toBe(200);
    expect(resolve.body.status).toBe('resolved');
  });

  it('threat dashboard scores all-true as 100 low', async () => {
    const res = await request(app).post('/api/threat-dashboard').send({
      posture: { rooted: false, developerMode: false, vpnActive: true, screenLock: true, biometrics: true, osUpdates: true, appIntegrity: true },
    });
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(100);
    expect(res.body.riskLevel).toBe('low');
    expect(res.body.recommendations.length).toBe(0);
  });

  it('threat dashboard lowers score and recommends fixes when unsafe', async () => {
    const res = await request(app).post('/api/threat-dashboard').send({
      posture: { rooted: true, developerMode: false, vpnActive: true, screenLock: false, biometrics: true, osUpdates: true, appIntegrity: true },
    });
    expect(res.status).toBe(200);
    expect(res.body.score).toBeLessThan(100);
    expect(res.body.recommendations.length).toBeGreaterThanOrEqual(2);
    expect(res.body.recommendations.join(' ')).toMatch(/rooted/i);
    expect(res.body.recommendations.join(' ')).toMatch(/screen lock/i);
  });

  it('records an SOS and creates a corresponding incident', async () => {
    const sos = await request(app).post('/api/emergency/sos').send({ deviceId: device, message: 'help', battery: 50 });
    expect(sos.status).toBe(201);
    expect(sos.body.dispatched).toBe(false);
    expect(sos.body.note).toMatch(/mobile app dispatches/i);

    const list = await request(app).get('/api/incidents').query({ deviceId: device });
    expect(list.body.incidents.some((i) => i.type === 'sos')).toBe(true);
  });
});
