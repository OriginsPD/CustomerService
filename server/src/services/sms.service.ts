import twilio from "twilio";
import { logger } from "../lib/logger.js";
import { env } from "../env.js";

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const twilioNumber = env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Debug initialization
console.log(`[SMS Service] Twilio Client initialized: ${!!client}. Number: ${!!twilioNumber}`);

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
  console.log(`[SMS Service] sendQueueSms called for ${phone}, Position: ${queuePosition}`);
  const normalizedPhone = normalizePhoneNumber(phone);
  logger.info(`[SMS Service] Preparing SMS to ${normalizedPhone} (original: ${phone}). Position: ${queuePosition}.`);
  if (!client || !twilioNumber) {
    logger.warn("[SMS Service] Twilio credentials missing from environment. SMS was simulated but not dispatched.", {
      hasClient: !!client,
      hasNumber: !!twilioNumber,
      accountSid: accountSid ? "PRESENT" : "MISSING",
      twilioNumber: twilioNumber ? "PRESENT" : "MISSING"
    });
    return;
  }

  try {
    // PUBLIC_URL should point to the domain where the kiosk is hosted (or localhost in dev)
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
