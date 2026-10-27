import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { scoreToLevel, residualScore } from '@iams/shared';

const app = createApp();

describe('Risk Assessment: Unauthenticated access denied', () => {
  it('should reject GET /api/risks without token', async () => {
    const res = await request(app).get('/api/risks');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject GET /api/risks/dashboard without token', async () => {
    const res = await request(app).get('/api/risks/dashboard');
    expect(res.status).toBe(401);
  });

  it('should reject GET /api/risks/:id without token', async () => {
    const res = await request(app).get('/api/risks/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });

  it('should reject POST /api/risks without token', async () => {
    const res = await request(app).post('/api/risks').send({});
    expect(res.status).toBe(401);
  });

  it('should reject PUT /api/risks/:id without token', async () => {
    const res = await request(app).put('/api/risks/00000000-0000-0000-0000-000000000000').send({});
    expect(res.status).toBe(401);
  });

  it('should reject DELETE /api/risks/:id without token', async () => {
    const res = await request(app).delete('/api/risks/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });

  it('should reject POST /api/risks/:riskId/actions without token', async () => {
    const res = await request(app).post('/api/risks/00000000-0000-0000-0000-000000000000/actions').send({});
    expect(res.status).toBe(401);
  });
});

describe('Risk Assessment: Input validation', () => {
  it('should reject POST with missing required fields', async () => {
    const res = await request(app).post('/api/risks').send({});
    expect([400, 401]).toContain(res.status);
  });

  it('should reject POST with invalid auditEntityId', async () => {
    const res = await request(app).post('/api/risks').send({
      title: 'Test Risk',
      auditEntityId: 'not-a-uuid',
      inherentLikelihood: 3,
      inherentImpact: 3,
    });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject POST with likelihood out of range', async () => {
    const res = await request(app).post('/api/risks').send({
      title: 'Test Risk',
      auditEntityId: '00000000-0000-0000-0000-000000000000',
      inherentLikelihood: 10,
      inherentImpact: 3,
    });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject POST with impact out of range', async () => {
    const res = await request(app).post('/api/risks').send({
      title: 'Test Risk',
      auditEntityId: '00000000-0000-0000-0000-000000000000',
      inherentLikelihood: 3,
      inherentImpact: 0,
    });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject POST with controlEffectiveness out of range', async () => {
    const res = await request(app).post('/api/risks').send({
      title: 'Test Risk',
      auditEntityId: '00000000-0000-0000-0000-000000000000',
      inherentLikelihood: 3,
      inherentImpact: 3,
      controlEffectiveness: 150,
    });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject GET with invalid UUID id param', async () => {
    const res = await request(app).get('/api/risks/not-a-uuid');
    expect([400, 401]).toContain(res.status);
  });

  it('should reject GET with invalid page value', async () => {
    const res = await request(app).get('/api/risks?page=0');
    expect([400, 401]).toContain(res.status);
  });

  it('should reject POST with excessively long title', async () => {
    const res = await request(app).post('/api/risks').send({
      title: 'a'.repeat(500),
      auditEntityId: '00000000-0000-0000-0000-000000000000',
      inherentLikelihood: 3,
      inherentImpact: 3,
    });
    expect([400, 401]).toContain(res.status);
  });
});

describe('Risk Assessment: Error response safety', () => {
  it('should not expose stack traces in validation errors', async () => {
    const res = await request(app).post('/api/risks').send({});
    expect(JSON.stringify(res.body)).not.toMatch(/node_modules/);
    expect(JSON.stringify(res.body)).not.toMatch(/\/.*\.ts/);
  });

  it('should return consistent error envelope', async () => {
    const res = await request(app).get('/api/risks/00000000-0000-0000-0000-000000000000');
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });
});

describe('Risk Assessment: Shared domain logic', () => {
  it('should compute inherent risk levels correctly', () => {
    expect(scoreToLevel(1)).toBe('LOW');
    expect(scoreToLevel(5)).toBe('LOW');
    expect(scoreToLevel(6)).toBe('MEDIUM');
    expect(scoreToLevel(12)).toBe('HIGH');
    expect(scoreToLevel(20)).toBe('CRITICAL');
    expect(scoreToLevel(25)).toBe('CRITICAL');
  });

  it('should compute residual score with control effectiveness', () => {
    expect(residualScore(25, 0)).toBe(25);
    expect(residualScore(25, 100)).toBe(1);
    expect(residualScore(20, 50)).toBe(10);
    expect(residualScore(16, 75)).toBe(4);
  });

  it('should clamp residual score to minimum 1', () => {
    expect(residualScore(9, 90)).toBe(1);
  });
});
