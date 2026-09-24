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

describe('Activity API', () => {
    test('GET /api/activities — répond', async () => {
        const res = await request(app).get('/api/activities');
        expect([200, 401, 403]).toContain(res.statusCode);
    });

    test('POST /api/activities sans auth — bloqué', async () => {
        const res = await request(app)
            .post('/api/activities')
            .send({ title: 'Test Activity' });
        expect([400, 401, 403]).toContain(res.statusCode);
    });

    test('GET /api/activities/id-invalide — répond', async () => {
        const res = await request(app)
            .get('/api/activities/000000000000000000000000');
        expect([400, 401, 403, 404]).toContain(res.statusCode);
    });
});