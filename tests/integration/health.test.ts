import request from 'supertest';

import app from '../../src/app';

describe('GET /health', () => {
  it('should return 200 and app status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.mode).toBe('test');
  });
});
