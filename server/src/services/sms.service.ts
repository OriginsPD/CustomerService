import twilio from "twilio";
import { logger } from "../lib/logger.js";
import { env } from "../env.js";
import { db } from "../db/connection.js";
import { systemSettings } from "../db/schema.js";
import { eq } from "drizzle-orm";

interface TwilioConfig {
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
}

/**
 * Fetches the active Twilio configuration, prioritizing 
 * database-managed settings over environment variables.
 */
async function getTwilioConfig() {
  const dbConfig = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.id, "twilio_config"),
  });

  const config = (dbConfig?.config as TwilioConfig) || {};

  return {
    accountSid: config.accountSid || env.TWILIO_ACCOUNT_SID,
    authToken: config.authToken || env.TWILIO_AUTH_TOKEN,
    twilioNumber: config.phoneNumber || env.TWILIO_PHONE_NUMBER,
    isFromDb: !!dbConfig,
  };
}

/**
 * Normalizes a phone number to E.164 format.
 * Currently assumes a default of +1 if no country code is provided.
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // If it already starts with +, just return it (after cleaning other chars)
  if (phone.startsWith("+")) {
    return `+${cleaned}`;
  }

  // If it's 10 digits (US/Canada/Caribbean), prepend +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // If it's 11 digits and starts with 1, prepend +
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }

  // Fallback: if it doesn't have a +, add it
  return phone.startsWith("+") ? phone : `+${phone}`;
}

export async function sendQueueSms(phone: string, queuePosition: number, sessionId: string) {
  const { accountSid, authToken, twilioNumber, isFromDb } = await getTwilioConfig();
  const normalizedPhone = normalizePhoneNumber(phone);

  logger.info(`[SMS Service] Preparing SMS to ${normalizedPhone} (original: ${phone}). Source: ${isFromDb ? "Database" : "Environment"}`);

  if (!accountSid || !authToken || !twilioNumber) {
    logger.warn("[SMS Service] Twilio credentials missing from both DB and Environment. SMS skipped.", {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasTwilioNumber: !!twilioNumber,
    });
    return;
  }

  try {
    const client = twilio(accountSid, authToken);
    const baseUrl = env.PUBLIC_URL;
    const appUrl = `${baseUrl}/queue`; 
    
    const message = await client.messages.create({
      body: `VCC: You are checked in! You are currently position #${queuePosition}. We will notify you when called. Track live: ${appUrl}`,
      from: twilioNumber,
      to: normalizedPhone,
    });
    
    logger.info(`[SMS Service] Successfully dispatched SMS to ${normalizedPhone}. SID: ${message.sid}`);
  } catch (error) {
    logger.error("[SMS Service] Twilio API dispatch failed", { 
      to: normalizedPhone,
      error: (error as Error).message 
    });
  }
}
