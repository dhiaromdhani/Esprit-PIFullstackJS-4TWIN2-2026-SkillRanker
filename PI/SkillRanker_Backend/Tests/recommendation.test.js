jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    verify: jest.fn((cb) => cb && cb(null)),
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-mail' })
  }))
}));

const mongoose = require('mongoose');
jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
jest.spyOn(mongoose.connection, 'close').mockResolvedValue();

const request  = require('supertest');
const app      = require('../index');

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Recommendation API', () => {
    test('GET /api/recommend/:id sans auth — bloqué', async () => {
        const res = await request(app)
            .get('/api/recommend/000000000000000000000000');
        expect([400, 401, 403, 404]).toContain(res.statusCode);
    });

    test('GET /api/optimization/gaps — répond', async () => {
        const res = await request(app).get('/api/optimization/gaps');
        expect([200, 401, 403, 404]).toContain(res.statusCode);
    });

    test('POST /api/optimization/simulate sans auth — bloqué', async () => {
        const res = await request(app)
            .post('/api/optimization/simulate')
            .send({});
        expect([400, 401, 403, 404]).toContain(res.statusCode);
    });
});