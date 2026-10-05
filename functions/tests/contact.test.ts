import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  buildContactEmail,
  contactSchema,
  createContactHandler,
  MAX_BODY_BYTES,
  type ContactDependencies,
} from "../src/contact";

const NOW = 1_800_000_000_000;
const validInput = {
  name: "Alex Buyer",
  email: "buyer@example.com",
  message: "I would like to schedule a showing of EZ Livin.",
  phone: "919-555-0100",
  preferredContactMethod: "email",
  inquiryType: "showing",
  activelyLooking: true,
  website: "",
  startedAt: NOW - 10_000,
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  sourcePage: "/",
};

function setup(overrides: Partial<ContactDependencies> = {}) {
  const mailer = vi.fn().mockResolvedValue({ id: "accepted-provider-id" });
  const logError = vi.fn();
  const app = express();
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buffer) => {
        Object.assign(req, { rawBody: buffer });
      },
    }),
  );
  app.use(
    createContactHandler({
      sendEmail: mailer,
      getConfiguration: () => ({
        toEmail: "owner@example.com",
        fromEmail: "inquiries@895forsale.com",
      }),
      now: () => NOW,
      logError,
      ...overrides,
    }),
  );
  return { app, mailer, logError };
}

describe("contact request validation and delivery acceptance", () => {
  it("accepts a valid inquiry only after the mailer accepts it, with Reply-To and idempotency", async () => {
    const { app, mailer } = setup();
    const response = await request(app).post("/api/contact").send(validInput);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(mailer).toHaveBeenCalledOnce();
    expect(mailer).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["owner@example.com"],
        from: "inquiries@895forsale.com",
        replyTo: "buyer@example.com",
        subject: "[895ForSale.com] New inquiry from Alex Buyer",
        text: expect.stringContaining("Inquiry Type: Showing"),
      }),
      { idempotencyKey: `boat-contact/${validInput.requestId}` },
    );
  });

  it("flags survey request in subject and body when requestSurvey is true", async () => {
    const { app, mailer } = setup();
    const surveyInput = {
      ...validInput,
      requestId: "550e8400-e29b-41d4-a716-446655440001",
      requestSurvey: true,
    };
    const response = await request(app).post("/api/contact").send(surveyInput);
    expect(response.status).toBe(200);
    expect(mailer).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "[895ForSale.com] [Survey Requested] New inquiry from Alex Buyer",
        text: expect.stringContaining("Survey & Records Requested: Yes"),
        html: expect.stringContaining("Survey &amp; Records Requested</strong></dt><dd>Yes</dd>"),
      }),
      { idempotencyKey: `boat-contact/${surveyInput.requestId}` },
    );
  });

  it("flags survey request in subject and body when inquiryType is service_survey_documentation", async () => {
    const { app, mailer } = setup();
    const surveyInput = {
      ...validInput,
      requestId: "550e8400-e29b-41d4-a716-446655440002",
      inquiryType: "service_survey_documentation",
    };
    const response = await request(app).post("/api/contact").send(surveyInput);
    expect(response.status).toBe(200);
    expect(mailer).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "[895ForSale.com] [Survey Requested] New inquiry from Alex Buyer",
        text: expect.stringContaining("Survey & Records Requested: Yes"),
      }),
      { idempotencyKey: `boat-contact/${surveyInput.requestId}` },
    );
  });

  it("keeps the same idempotency key and email on retry", async () => {
    const { app, mailer } = setup();
    await request(app).post("/api/contact").send(validInput);
    await request(app).post("/api/contact").send(validInput);
    expect(mailer.mock.calls[1]).toEqual(mailer.mock.calls[0]);
    // These two SDK calls are deduplicated by Resend, not a local memory cache.
  });

  it.each(["get", "put", "patch", "delete", "options"] as const)(
    "rejects %s without sending mail",
    async (method) => {
      const { app, mailer } = setup();
      const response = await request(app)[method]("/api/contact");
      expect(response.status).toBe(405);
      expect(response.headers.allow).toBe("POST");
      expect(mailer).not.toHaveBeenCalled();
    },
  );

  it("rejects unsupported paths", async () => {
    const { app, mailer } = setup();
    const response = await request(app).post("/api/unknown").send(validInput);
    expect(response.status).toBe(404);
    expect(mailer).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON content type", async () => {
    const { app, mailer } = setup();
    const response = await request(app)
      .post("/api/contact")
      .type("form")
      .send(validInput);
    expect(response.status).toBe(415);
    expect(mailer).not.toHaveBeenCalled();
  });

  it("accepts JSON with an explicit charset", async () => {
    const { app } = setup();
    const response = await request(app)
      .post("/api/contact")
      .set("Content-Type", "application/json; charset=utf-8")
      .send(JSON.stringify(validInput));
    expect(response.status).toBe(200);
  });

  it("limits actual UTF-8 byte size, including unrecognized fields", async () => {
    const { app, mailer } = setup();
    const response = await request(app)
      .post("/api/contact")
      .send({ ...validInput, extra: "🚢".repeat(MAX_BODY_BYTES / 4) });
    expect(response.status).toBe(413);
    expect(mailer).not.toHaveBeenCalled();
  });

  it.each([
    { name: "A" },
    { name: "A".repeat(101) },
    { name: "Buyer\r\nBcc: attacker@example.com" },
    { email: "not-an-email" },
    { email: "buyer@example.com\r\nBcc: attacker@example.com" },
    { message: "short" },
    { message: "m".repeat(5_001) },
    { message: "Message with\u0000 a null byte" },
    { phone: "1".repeat(41) },
    { preferredContactMethod: "carrier-pigeon" },
    { inquiryType: "unsupported" },
    { preferredContactMethod: "phone", phone: "" },
    { activelyLooking: "yes" },
    { website: "https://bot.example" },
    { website: undefined },
    { startedAt: NOW - 2_999 },
    { startedAt: NOW + 60_000 },
    { startedAt: NOW - 86_400_001 },
    { startedAt: "not-a-timestamp" },
    { requestId: "not-a-uuid" },
    { sourcePage: "https://attacker.example" },
    { sourcePage: "//attacker.example" },
    { sourcePage: "/?email=buyer@example.com" },
    { unexpected: true },
  ])(
    "rejects invalid data without contacting the provider: %j",
    async (changes) => {
      const { app, mailer } = setup();
      const response = await request(app)
        .post("/api/contact")
        .send({ ...validInput, ...changes });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        ok: false,
        error: "Please check your information and try again.",
      });
      expect(mailer).not.toHaveBeenCalled();
    },
  );

  it("rejects a third-party browser origin", async () => {
    const { app, mailer } = setup();
    const response = await request(app)
      .post("/api/contact")
      .set("Origin", "https://attacker.example")
      .send(validInput);
    expect(response.status).toBe(403);
    expect(mailer).not.toHaveBeenCalled();
  });

  it.each(["https://895forsale.com", "https://www.895forsale.com"])(
    "accepts production origin %s",
    async (origin) => {
      const { app } = setup();
      const response = await request(app)
        .post("/api/contact")
        .set("Origin", origin)
        .send(validInput);
      expect(response.status).toBe(200);
    },
  );

  it("accepts localhost only in emulator mode", async () => {
    const production = setup();
    const local = setup({ emulator: true });
    const productionResponse = await request(production.app)
      .post("/api/contact")
      .set("Origin", "http://localhost:5000")
      .send(validInput);
    const localResponse = await request(local.app)
      .post("/api/contact")
      .set("Origin", "http://localhost:5000")
      .send(validInput);
    expect(productionResponse.status).toBe(403);
    expect(localResponse.status).toBe(200);
  });

  it("escapes all submitted values in HTML while retaining readable plain text", () => {
    const input = contactSchema.parse({
      ...validInput,
      name: "<img src=x onerror=alert(1)>",
      message: '<script>alert("unsafe")</script>\nFish & boat',
    });
    const email = buildContactEmail(input, {
      toEmail: "owner@example.com",
      fromEmail: "inquiries@895forsale.com",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img");
    expect(email.html).toContain(
      "&lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt;<br>Fish &amp; boat",
    );
    expect(email.text).toContain(input.message);
  });

  it("normalizes whitespace before building the email", async () => {
    const { app, mailer } = setup();
    const response = await request(app)
      .post("/api/contact")
      .send({
        ...validInput,
        name: "  Alex Buyer  ",
        email: "  buyer@example.com  ",
        message: "  Please send service documentation.  ",
      });
    expect(response.status).toBe(200);
    expect(mailer.mock.calls[0]?.[0].replyTo).toBe("buyer@example.com");
  });

  it("returns a generic 503 for missing configuration without sending email", async () => {
    const { app, mailer, logError } = setup({
      getConfiguration: () => ({ toEmail: "", fromEmail: "" }),
    });
    const response = await request(app).post("/api/contact").send(validInput);
    expect(response.status).toBe(503);
    expect(mailer).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith("configuration");
    expect(response.body.error).not.toMatch(/configuration|secret|api key/i);
    expect(response.body).not.toHaveProperty("code");
  });

  it("identifies incomplete setup only for the local emulator without sending email", async () => {
    const { app, mailer, logError } = setup({
      emulator: true,
      getConfiguration: () => ({ toEmail: "", fromEmail: "" }),
    });
    const response = await request(app).post("/api/contact").send(validInput);
    expect(response.status).toBe(503);
    expect(response.body.code).toBe("EMAIL_NOT_CONFIGURED");
    expect(response.body.ok).toBe(false);
    expect(mailer).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledExactlyOnceWith("configuration");
  });

  it("handles missing secrets as configuration failure without contacting the mailer", async () => {
    const { app, mailer, logError } = setup({
      emulator: true,
      getConfiguration: () => { throw new Error("Secret is not configured"); },
    });
    const response = await request(app).post("/api/contact").send(validInput);
    expect(response.status).toBe(503);
    expect(response.body.code).toBe("EMAIL_NOT_CONFIGURED");
    expect(response.body.error).not.toMatch(/configuration|secret|api key/i);
    expect(mailer).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledExactlyOnceWith("configuration");
  });

  it("returns a generic 503 when the mailer fails and logs only its category", async () => {
    const { app, logError } = setup({
      sendEmail: async () => {
        throw new Error("Internal sensitive detail from provider");
      },
    });
    const response = await request(app).post("/api/contact").send(validInput);
    expect(response.status).toBe(503);
    expect(response.body.error).not.toContain("sensitive");
    expect(logError).toHaveBeenCalledExactlyOnceWith("email_delivery");
  });

  it("never claims success without a provider acceptance id", async () => {
    const { app } = setup({ sendEmail: async () => ({ id: "" }) });
    const response = await request(app).post("/api/contact").send(validInput);
    expect(response.status).toBe(503);
    expect(response.body.ok).toBe(false);
  });
});
