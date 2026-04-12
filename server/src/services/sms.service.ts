import { createRequire } from "node:module";
import { logger } from "../lib/logger.js";

const require = createRequire(import.meta.url);
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendQueueSms(phone: string, queuePosition: number, sessionId: string) {
  logger.info(`[SMS Service] Simulated or preparing SMS to ${phone}. Position: ${queuePosition}.`);

  if (!client || !twilioNumber) {
    logger.warn("[SMS Service] Twilio credentials missing from .env. SMS was simulated but not actually dispatched.");
    return;
  }

  try {
    // PUBLIC_URL should point to the domain where the kiosk is hosted (or localhost in dev)
    const baseUrl = process.env.PUBLIC_URL || "http://localhost:5173";
    const appUrl = `${baseUrl}/queue`; 
    
    await client.messages.create({
      body: `VCC: You are checked in! You are currently position #${queuePosition}. We will notify you when called. Track live: ${appUrl}`,
      from: twilioNumber,
      to: phone,
    });
    
    logger.info(`[SMS Service] Successfully dispatched SMS to ${phone}`);
  } catch (error) {
    logger.error("[SMS Service] Twilio API dispatch failed", { error: (error as Error).message });
  }
}
