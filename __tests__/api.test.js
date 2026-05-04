const request = require('supertest');

jest.mock('../services/dbService', () => ({
  getHistory: jest.fn(),
  saveScreening: jest.fn(),
  updateScreening: jest.fn(),
  deleteScreening: jest.fn(),
}));

jest.mock('../services/aiService', () => ({
  analyzeCandidate: jest.fn(),
  checkRisk: jest.fn(),
}));

const dbService = require('../services/dbService');
const aiService = require('../services/aiService');
const app = require('../index');

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/history', () => {
  it('returns screenings from dbService.getHistory', async () => {
    const rows = [{ id: 1, candidate_name: 'A', type: 'analyze' }];
    dbService.getHistory.mockResolvedValueOnce(rows);

    const res = await request(app).get('/api/history');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: rows });
    expect(dbService.getHistory).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when getHistory throws', async () => {
    dbService.getHistory.mockRejectedValueOnce(new Error('db down'));

    const res = await request(app).get('/api/history');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch history');
  });
});

describe('PUT /api/screenings/:id', () => {
  it('returns 400 when body has no updatable fields', async () => {
    const res = await request(app).put('/api/screenings/1').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/At least one field/);
    expect(dbService.updateScreening).not.toHaveBeenCalled();
  });

  it('returns 404 when screening missing', async () => {
    dbService.updateScreening.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/screenings/999')
      .send({ risk_level: 'Low' });

    expect(res.status).toBe(404);
  });

  it('returns 200 with updated row', async () => {
    const updated = { id: 2, risk_level: 'Medium', summary: 'x' };
    dbService.updateScreening.mockResolvedValueOnce(updated);

    const res = await request(app)
      .put('/api/screenings/2')
      .send({ risk_level: 'Medium', summary: 'x' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: updated });
    expect(dbService.updateScreening).toHaveBeenCalledWith(
      '2',
      expect.objectContaining({ risk_level: 'Medium', summary: 'x' })
    );
  });
});

describe('DELETE /api/screenings/:id', () => {
  it('returns 404 when not found', async () => {
    dbService.deleteScreening.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/screenings/404');
    expect(res.status).toBe(404);
  });

  it('returns 200 when deleted', async () => {
    const row = { id: 3, candidate_name: 'Z' };
    dbService.deleteScreening.mockResolvedValueOnce(row);

    const res = await request(app).delete('/api/screenings/3');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(row);
  });
});

describe('POST /api/analyze-candidate', () => {
  it('returns 400 without name or role', async () => {
    const res = await request(app)
      .post('/api/analyze-candidate')
      .send({ name: 'Only' });
    expect(res.status).toBe(400);
    expect(aiService.analyzeCandidate).not.toHaveBeenCalled();
  });

  it('returns AI result and saves screening', async () => {
    const payload = {
      name: 'Jamie',
      role: 'CFO',
      experience: 10,
      education: 'MBA',
      employment_history: 'x',
      notes: 'y',
    };
    const aiResult = {
      risk_level: 'Low',
      summary: 'ok',
      flags: [],
      scores: {},
      recommendations: [],
    };
    aiService.analyzeCandidate.mockResolvedValueOnce(aiResult);
    dbService.saveScreening.mockResolvedValueOnce({ id: 1 });

    const res = await request(app).post('/api/analyze-candidate').send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: aiResult });
    expect(aiService.analyzeCandidate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jamie', role: 'CFO' })
    );
    expect(dbService.saveScreening).toHaveBeenCalledWith(
      'analyze',
      'Jamie',
      payload,
      aiResult
    );
  });
});

describe('POST /api/check-risk', () => {
  it('returns 400 without name or concern', async () => {
    const res = await request(app).post('/api/check-risk').send({ name: 'A' });
    expect(res.status).toBe(400);
  });

  it('returns risk result and saves', async () => {
    const body = {
      name: 'Sam',
      concern: 'gap',
      industry: 'Finance',
      seniority: 'Senior',
    };
    const aiResult = {
      risk_level: 'High',
      summary: 'careful',
      flags: ['gap'],
      scores: { a: 1 },
      recommendations: ['verify'],
    };
    aiService.checkRisk.mockResolvedValueOnce(aiResult);
    dbService.saveScreening.mockResolvedValueOnce({ id: 2 });

    const res = await request(app).post('/api/check-risk').send(body);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(aiResult);
    expect(dbService.saveScreening).toHaveBeenCalledWith(
      'risk',
      'Sam',
      body,
      aiResult
    );
  });
});
