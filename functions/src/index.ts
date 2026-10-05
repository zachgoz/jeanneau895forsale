import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { Resend } from "resend";
import { createContactHandler } from "./contact";

const resendApiKey = defineSecret("RESEND_API_KEY");
const contactToEmail = defineString("CONTACT_TO_EMAIL", { default: "" });
const contactFromEmail = defineString("CONTACT_FROM_EMAIL", { default: "" });
const projectId = process.env.GCLOUD_PROJECT;

export const contact = onRequest(
  {
    region: "us-central1",
    secrets: [resendApiKey],
    cors: false,
    invoker: "public",
    maxInstances: 2,
    concurrency: 40,
    timeoutSeconds: 15,
    memory: "256MiB",
  },
  createContactHandler({
    emulator: process.env.FUNCTIONS_EMULATOR === "true",
    allowedOrigins: [
      "https://895forsale.com",
      "https://www.895forsale.com",
      "https://895forsale.web.app",
      "https://895forsale.firebaseapp.com",
      ...(projectId
        ? [
            `https://${projectId}.web.app`,
            `https://${projectId}.firebaseapp.com`,
          ]
        : []),
    ],
    getConfiguration: () => {
      const apiKey = resendApiKey.value();
      if (!apiKey || apiKey === "emulator-placeholder") {
        throw new Error("Email secret is not configured.");
      }
      return {
        toEmail: contactToEmail.value(),
        fromEmail: contactFromEmail.value(),
      };
    },
    sendEmail: async (email, options) => {
      const apiKey = resendApiKey.value();
      if (!apiKey) {
        throw new Error("Email secret is missing.");
      }
      const result = await new Resend(apiKey).emails.send(email, options);
      if (result.error || !result.data?.id) {
        throw new Error("Email provider did not accept the message.");
      }
      return { id: result.data.id };
    },
    // Fixed categories only; no body, name, email, phone, secret, or provider
    // error object enters application logs.
    logError: (category) =>
      logger.error("Contact request failed", { category }),
  }),
);
