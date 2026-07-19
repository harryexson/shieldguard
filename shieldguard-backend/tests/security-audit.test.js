'use strict';

const request = require('supertest');
const { createApp, analyzeThreatRisk } = require('../src/index');
const { requireApiKey } = require('../src/middleware');

describe('Security audit regressions', () => {
  describe('AI threat analysis — honest classification (no fabricated confidence)', () => {
    it('marks a known threat signature as confirmed', () => {
      const r = analyzeThreatRisk('com.pegasus', [], []);
      expect(r.verification).toBe('confirmed');
      expect(r.basis).toBe('signature');
      expect(r.knownThreatId).toBe('pegasus');
      expect(r).not.toHaveProperty('confidence');
    });

    it('marks heuristic-only signals as likely, never confirmed', () => {
      const r = analyzeThreatRisk('com.some.random.app', ['camera', 'read_sms'], ['accessibility-abuse']);
      expect(r.verification).toBe('likely');
      expect(r.basis).toBe('heuristic');
      expect(r.knownThreatId).toBeNull();
      expect(r).not.toHaveProperty('confidence');
    });

    it('marks unknown packages as unknown', () => {
      const r = analyzeThreatRisk('com.benign.app', [], []);
      expect(r.verification).toBe('unknown');
      expect(r).not.toHaveProperty('confidence');
    });

    it('marks empty input as unable_to_verify', () => {
      const r = analyzeThreatRisk('', [], []);
      expect(r.verification).toBe('unable_to_verify');
      expect(r).not.toHaveProperty('confidence');
    });
  });

  describe('requireApiKey — length-safe and header-only', () => {
    const saved = {};
    beforeAll(() => {
      saved.REQUIRE_API_KEY = process.env.REQUIRE_API_KEY;
      saved.API_KEY = process.env.API_KEY;
      process.env.REQUIRE_API_KEY = 'true';
      process.env.API_KEY = 'strong-prod-key-xyz';
    });
    afterAll(() => {
      process.env.REQUIRE_API_KEY = saved.REQUIRE_API_KEY;
      process.env.API_KEY = saved.API_KEY;
    });

    it('rejects a missing key with 401', () => {
      const { app } = createApp();
      return request(app).post('/api/vault/items').send({ deviceId: 'd1', name: 'x', payload: 'y' })
        .expect(401);
    });

    it('accepts the correct header key', () => {
      const { app } = createApp();
      return request(app).post('/api/vault/items')
        .set('x-api-key', 'strong-prod-key-xyz')
        .send({ deviceId: 'd1', name: 'x', payload: 'y' })
        .expect(201);
    });

    it('rejects a wrong-length key without throwing (500)', () => {
      const { app } = createApp();
      return request(app).post('/api/vault/items')
        .set('x-api-key', 'short')
        .send({ deviceId: 'd1', name: 'x', payload: 'y' })
        .expect(401);
    });

    it('ignores a key passed via query string', () => {
      const { app } = createApp();
      return request(app).post('/api/vault/items')
        .query({ apiKey: 'strong-prod-key-xyz' })
        .send({ deviceId: 'd1', name: 'x', payload: 'y' })
        .expect(401);
    });

    it('requireApiKey middleware is a no-op when REQUIRE_API_KEY is off', (done) => {
      const prev = process.env.REQUIRE_API_KEY;
      process.env.REQUIRE_API_KEY = 'false';
      let called = false;
      requireApiKey({}, { status() {} }, () => { called = true; });
      process.env.REQUIRE_API_KEY = prev;
      expect(called).toBe(true);
      done();
    });
  });

  describe('sync pull requires deviceId', () => {
    it('returns 400 when deviceId is missing', () => {
      const { app } = createApp();
      return request(app).get('/api/sync/pull').query({ channel: 'c1' }).expect(400);
    });
  });
});
