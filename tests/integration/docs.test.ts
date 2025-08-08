import request from 'supertest';

import app from '../../src/app';

describe('Documentation Endpoints', () => {
  describe('GET /api-docs.json', () => {
    it('should return OpenAPI spec as JSON', async () => {
      const res = await request(app).get('/api-docs.json');
      
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      
      // Verify it's a valid OpenAPI spec
      expect(res.body).toHaveProperty('openapi');
      expect(res.body).toHaveProperty('info');
      expect(res.body).toHaveProperty('paths');
      expect(res.body.openapi).toBe('3.0.0');
      expect(res.body.info).toHaveProperty('title');
      expect(res.body.info).toHaveProperty('version');
    });

    it('should include API endpoints in the spec', async () => {
      const res = await request(app).get('/api-docs.json');
      
      expect(res.status).toBe(200);
      
      // Verify some key API paths are documented
      expect(res.body.paths).toHaveProperty('/api/v1/auth/register');
      expect(res.body.paths).toHaveProperty('/api/v1/auth/login');
      expect(res.body.paths).toHaveProperty('/api/v1/eth/address/{address}/transactions');
      expect(res.body.paths).toHaveProperty('/api/v1/eth/address/{address}/balance');
    });

    it('should include component schemas', async () => {
      const res = await request(app).get('/api-docs.json');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('components');
      expect(res.body.components).toHaveProperty('schemas');
      
      // Verify some key schemas are defined
      const schemas = res.body.components.schemas;
      expect(schemas).toHaveProperty('Error');
      expect(schemas).toHaveProperty('Transaction');
      expect(schemas).toHaveProperty('AuthResponse');
    });
  });

  describe('GET /api-docs', () => {
    it('should return Swagger UI HTML page', async () => {
      const res = await request(app).get('/api-docs/');
      
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      
      // Verify it contains Swagger UI elements
      expect(res.text).toContain('swagger-ui');
      expect(res.text).toContain('Swagger UI');
    });

    it('should redirect /api-docs to /api-docs/', async () => {
      const res = await request(app).get('/api-docs');
      
      // Swagger UI typically redirects to add trailing slash
      expect([200, 301, 302]).toContain(res.status);
    });
  });

  describe('Documentation Integration', () => {
    it('should have consistent API info between endpoints', async () => {
      const jsonRes = await request(app).get('/api-docs.json');
      const htmlRes = await request(app).get('/api-docs/');
      
      expect(jsonRes.status).toBe(200);
      expect(htmlRes.status).toBe(200);
      
      // Both endpoints should be accessible
      expect(jsonRes.body.info.title).toBeDefined();
      expect(htmlRes.text).toContain('swagger-ui');
    });

    it('should serve docs without requiring authentication', async () => {
      // Docs should be publicly accessible
      const jsonRes = await request(app).get('/api-docs.json');
      const htmlRes = await request(app).get('/api-docs/');
      
      expect(jsonRes.status).toBe(200);
      expect(htmlRes.status).toBe(200);
      
      // Should not return 401 Unauthorized
      expect(jsonRes.status).not.toBe(401);
      expect(htmlRes.status).not.toBe(401);
    });
  });

  describe('API Documentation Content', () => {
    it('should document security schemes', async () => {
      const res = await request(app).get('/api-docs.json');
      
      expect(res.status).toBe(200);
      expect(res.body.components).toHaveProperty('securitySchemes');
      expect(res.body.components.securitySchemes).toHaveProperty('bearerAuth');
    });

    it('should have proper API metadata', async () => {
      const res = await request(app).get('/api-docs.json');
      
      expect(res.status).toBe(200);
      expect(res.body.info.title).toBe('Blockchain API');
      expect(res.body.info.version).toBe('1.0.0');
      expect(res.body.info.description).toContain('blockchain');
    });
  });
});
