import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../lib/logger.js';

vi.mock('../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SMS Service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should successfully dispatch SMS when credentials are provided', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ sid: '123' });
    const mockTwilioClient = {
      messages: {
        create: mockCreate,
      },
    };
    const mockTwilio = vi.fn().mockReturnValue(mockTwilioClient);

    vi.doMock('twilio', () => ({
      default: mockTwilio,
    }));

    vi.doMock('../env.js', () => ({
      env: {
        TWILIO_ACCOUNT_SID: 'AC123',
        TWILIO_AUTH_TOKEN: 'secret',
        TWILIO_PHONE_NUMBER: '+1234567890',
        PUBLIC_URL: 'https://test.vcc.com',
      },
    }));

    const { sendQueueSms } = await import('../services/sms.service.js');
    await sendQueueSms('+1987654321', 1, 'session-abc');

    expect(mockCreate).toHaveBeenCalledWith({
      body: expect.stringContaining('VCC: You are checked in! You are currently position #1.'),
      from: '+1234567890',
      to: '+1987654321',
    });
    expect(mockCreate).toHaveBeenCalledWith({
      body: expect.stringContaining('https://test.vcc.com/queue'),
      from: '+1234567890',
      to: '+1987654321',
    });
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Successfully dispatched SMS'));
  });

  it('should log a warning and not throw when credentials are missing', async () => {
    vi.doMock('../env.js', () => ({
      env: {
        TWILIO_ACCOUNT_SID: undefined,
        TWILIO_AUTH_TOKEN: undefined,
        TWILIO_PHONE_NUMBER: undefined,
        PUBLIC_URL: 'https://test.vcc.com',
      },
    }));

    const { sendQueueSms } = await import('../services/sms.service.js');
    await sendQueueSms('+1987654321', 1, 'session-abc');

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Twilio credentials missing'));
  });

  it('should handle Twilio API errors gracefully', async () => {
    const mockCreate = vi.fn().mockRejectedValue(new Error('Twilio error'));
    const mockTwilioClient = {
      messages: {
        create: mockCreate,
      },
    };
    const mockTwilio = vi.fn().mockReturnValue(mockTwilioClient);

    vi.doMock('twilio', () => ({
      default: mockTwilio,
    }));

    vi.doMock('../env.js', () => ({
      env: {
        TWILIO_ACCOUNT_SID: 'AC123',
        TWILIO_AUTH_TOKEN: 'secret',
        TWILIO_PHONE_NUMBER: '+1234567890',
        PUBLIC_URL: 'https://test.vcc.com',
      },
    }));

    const { sendQueueSms } = await import('../services/sms.service.js');
    await sendQueueSms('+1987654321', 1, 'session-abc');

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('[SMS Service] Twilio API dispatch failed'),
      expect.objectContaining({ error: 'Twilio error' })
    );
  });
});
