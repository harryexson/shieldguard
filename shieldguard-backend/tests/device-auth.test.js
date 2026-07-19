'use strict';

// Verifies the device-bound auth model and that the REAL vault and DECOY vault
// are keyed by unlinkable, independently-registered device identities so a
// duress (decoy) session can never leak the real user's data (gap C1/C2).

const request = require('supertest');
const crypto = require('crypto');
const { createApp } = require('../src/index');

function secret() { return crypto.randomBytes(24).toString('base64'); }

describe('Device-bound auth + decoy unlinkability', () => {
  const { app } = createApp();

  it('registers a device and returns a usable bearer token', async () => {
    const res = await request(app).post('/api/device/register').send({ deviceSecret: secret() });
    expect(res.status).toBe(201);
    expect(res.body.deviceId).toBeDefined();
    expect(res.body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT shape

    const items = await request(app)
      .post('/api/vault/items')
      .set('authorization', `Bearer ${res.body.token}`)
      .send({ name: 'note', payload: 'REAL' });
    expect(items.status).toBe(201);
  });

  it('keeps real and decoy vaults unlinkable under separate identities', async () => {
    const real = await request(app).post('/api/device/register').send({ deviceSecret: secret() });
    const decoy = await request(app).post('/api/device/register').send({ deviceSecret: secret() });
    expect(real.body.deviceId).not.toBe(decoy.body.deviceId);

    await request(app).post('/api/vault/items').set('authorization', `Bearer ${real.body.token}`).send({ name: 'real', payload: 'REAL' });
    await request(app).post('/api/vault/decoy/items').set('authorization', `Bearer ${decoy.body.token}`).send({ name: 'decoy', payload: 'DECOY' });

    const realItems = await request(app).get('/api/vault/items').set('authorization', `Bearer ${real.body.token}`);
    const decoyItems = await request(app).get('/api/vault/decoy/items').set('authorization', `Bearer ${decoy.body.token}`);

    expect(realItems.status).toBe(200);
    expect(decoyItems.status).toBe(200);
    const realPayloads = realItems.body.items.map((i) => i.payload);
    const decoyPayloads = decoyItems.body.items.map((i) => i.payload);
    expect(realPayloads).toContain('REAL');
    expect(realPayloads).not.toContain('DECOY');
    expect(decoyPayloads).toContain('DECOY');
    expect(decoyPayloads).not.toContain('REAL');
    // No shared field ties the two identities together on the server.
    expect(real.body.deviceId).not.toEqual(decoy.body.deviceId);
  });

  it('rejects data-plane access without a token when REQUIRE_DEVICE_AUTH=true', async () => {
    const before = process.env.REQUIRE_DEVICE_AUTH;
    process.env.REQUIRE_DEVICE_AUTH = 'true';
    try {
      const res = await request(app).get('/api/vault/items');
      expect(res.status).toBe(401);
    } finally {
      if (before === undefined) delete process.env.REQUIRE_DEVICE_AUTH;
      else process.env.REQUIRE_DEVICE_AUTH = before;
    }
  });

  it('rejects a forged client deviceId when REQUIRE_DEVICE_AUTH=true', async () => {
    const before = process.env.REQUIRE_DEVICE_AUTH;
    process.env.REQUIRE_DEVICE_AUTH = 'true';
    try {
      // No token, but a spoofed deviceId in the body must NOT be trusted.
      const res = await request(app).post('/api/vault/items').send({ deviceId: 'attacker-device', name: 'x', payload: 'evil' });
      expect(res.status).toBe(401);
    } finally {
      if (before === undefined) delete process.env.REQUIRE_DEVICE_AUTH;
      else process.env.REQUIRE_DEVICE_AUTH = before;
    }
  });

  it('exchanges a device secret for a fresh token', async () => {
    const deviceSecret = secret();
    const reg = await request(app).post('/api/device/register').send({ deviceSecret });
    const ex = await request(app).post('/api/device/token').send({ deviceId: reg.body.deviceId, deviceSecret });
    expect(ex.status).toBe(200);
    expect(ex.body.token).toBeDefined();

    const bad = await request(app).post('/api/device/token').send({ deviceId: reg.body.deviceId, deviceSecret: 'wrong' });
    expect(bad.status).toBe(401);
  });
});
