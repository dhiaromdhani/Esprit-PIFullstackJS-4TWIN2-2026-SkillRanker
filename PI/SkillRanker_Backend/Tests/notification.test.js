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

describe('Notification API', () => {
    test('GET /api/notifications/my-notifications sans token — bloqué', async () => {
        const res = await request(app)
            .get('/api/notifications/my-notifications');
        expect([401, 403]).toContain(res.statusCode);
    });

    test('POST /api/notifications/send-activity sans body — bloqué', async () => {
        const res = await request(app)
            .post('/api/notifications/send-activity')
            .send({});
        expect([400, 401, 403, 404]).toContain(res.statusCode);
    });

    test('PUT /api/notifications/read-all sans token — bloqué', async () => {
        const res = await request(app)
            .put('/api/notifications/read-all');
        expect([401, 403]).toContain(res.statusCode);
    });

    test('GET /api/notifications/my-activities sans token — bloqué', async () => {
        const res = await request(app)
            .get('/api/notifications/my-activities');
        expect([401, 403]).toContain(res.statusCode);
    });
});