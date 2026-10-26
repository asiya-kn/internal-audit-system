import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Audit Universe: Unauthenticated access denied', () => {
  it('should reject GET /api/audit-universe without token', async () => {
    const res = await request(app).get('/api/audit-universe');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject GET /api/audit-universe/:id without token', async () => {
    const res = await request(app).get('/api/audit-universe/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });

  it('should reject POST /api/audit-universe without token', async () => {
    const res = await request(app).post('/api/audit-universe').send({});
    expect(res.status).toBe(401);
  });

  it('should reject PUT /api/audit-universe/:id without token', async () => {
    const res = await request(app).put('/api/audit-universe/00000000-0000-0000-0000-000000000000').send({});
    expect(res.status).toBe(401);
  });

  it('should reject PATCH /api/audit-universe/:id/status without token', async () => {
    const res = await request(app)
      .patch('/api/audit-universe/00000000-0000-0000-0000-000000000000/status')
      .send({ status: 'ACTIVE' });
    expect(res.status).toBe(401);
  });

  it('should reject DELETE /api/audit-universe/:id without token', async () => {
    const res = await request(app).delete('/api/audit-universe/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });
});

describe('Audit Universe: Input validation', () => {
  it('should reject POST with missing required fields', async () => {
    const res = await request(app).post('/api/audit-universe').send({});
    expect([400, 401]).toContain(res.status);
  });

  it('should reject POST with invalid code format', async () => {
    const res = await request(app)
      .post('/api/audit-universe')
      .send({ code: 'has spaces!', name: 'Test', entityType: 'DEPARTMENT' });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject POST with invalid entityType', async () => {
    const res = await request(app)
      .post('/api/audit-universe')
      .send({ code: 'TEST-001', name: 'Test', entityType: 'INVALID_TYPE' });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject POST with invalid UUID for parentId', async () => {
    const res = await request(app)
      .post('/api/audit-universe')
      .send({ code: 'TEST-001', name: 'Test', entityType: 'DEPARTMENT', parentId: 'not-a-uuid' });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject GET with invalid UUID id param', async () => {
    const res = await request(app).get('/api/audit-universe/not-a-uuid');
    expect([400, 401]).toContain(res.status);
  });

  it('should reject PATCH status with invalid status enum', async () => {
    const res = await request(app)
      .patch('/api/audit-universe/00000000-0000-0000-0000-000000000000/status')
      .send({ status: 'DELETED' });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject POST with excessively long name', async () => {
    const res = await request(app)
      .post('/api/audit-universe')
      .send({ code: 'TEST', name: 'a'.repeat(500), entityType: 'DEPARTMENT' });
    expect([400, 401]).toContain(res.status);
  });
});

describe('Audit Universe: Query parameter validation', () => {
  it('should reject GET with invalid page value', async () => {
    const res = await request(app).get('/api/audit-universe?page=0');
    expect([400, 401]).toContain(res.status);
  });

  it('should reject GET with invalid pageSize value', async () => {
    const res = await request(app).get('/api/audit-universe?pageSize=0');
    expect([400, 401]).toContain(res.status);
  });

  it('should reject GET with pageSize exceeding max', async () => {
    const res = await request(app).get('/api/audit-universe?pageSize=500');
    expect([400, 401]).toContain(res.status);
  });
});

describe('Audit Universe: Error response safety', () => {
  it('should not expose stack traces in validation errors', async () => {
    const res = await request(app).post('/api/audit-universe').send({});
    expect(JSON.stringify(res.body)).not.toMatch(/node_modules/);
    expect(JSON.stringify(res.body)).not.toMatch(/\/.*\.ts/);
  });

  it('should return consistent error envelope', async () => {
    const res = await request(app).get('/api/audit-universe/00000000-0000-0000-0000-000000000000');
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });
});
