/**
 * =============================================================================
 * HEALTH.TEST.TS - Integration Tests cho Health Check Endpoint
 * =============================================================================
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './app.js';

const app = createTestApp();

describe('Health Check', () => {
  describe('GET /api/health', () => {
    it('should return OK status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('OK');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown-route');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });
  });
});
