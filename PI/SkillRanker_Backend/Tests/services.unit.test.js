describe('Services unit tests', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('emailService sends email with nodemailer transporter', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: '1' });
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn(() => ({ sendMail }))
    }));

    const sendEmail = require('../services/emailService');
    await sendEmail('test@example.com', 'Subject', 'Body');
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@example.com',
      subject: 'Subject'
    }));
  });

  test('emailService throws when nodemailer fails', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('smtp error'));
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn(() => ({ sendMail }))
    }));

    const sendEmail = require('../services/emailService');
    await expect(sendEmail('bad@example.com', 'Subject', 'Body')).rejects.toThrow('smtp error');
  });
});
