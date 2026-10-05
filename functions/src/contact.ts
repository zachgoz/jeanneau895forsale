import { z } from "zod";

export const MAX_BODY_BYTES = 16 * 1024;
export const MIN_SUBMIT_TIME_MS = 3_000;
export const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1_000;

// Control characters may not enter email headers. Newlines are allowed only in
// the message, which is rendered as text and escaped HTML.
const singleLine = z
  .string()
  .trim()
  // eslint-disable-next-line no-control-regex -- This intentionally rejects header control characters.
  .regex(/^[^\u0000-\u001f\u007f]*$/u);

export const contactSchema = z
  .object({
    name: singleLine.min(2).max(100),
    email: z.string().trim().max(254).pipe(z.email()),
    message: z
      .string()
      .trim()
      .min(10)
      .max(5_000)
      // eslint-disable-next-line no-control-regex -- Reject controls while retaining message newlines and tabs.
      .regex(/^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]*$/u),
    phone: singleLine.max(40).optional(),
    preferredContactMethod: z.enum(["email", "phone", "either"]),
    inquiryType: z.enum([
      "general_question",
      "additional_photos",
      "showing",
      "sea_trial",
      "purchase_discussion",
      "service_survey_documentation",
    ]),
    activelyLooking: z.boolean().optional().default(false),
    website: z.string().max(200),
    startedAt: z.number().int().positive(),
    requestId: z.uuid(),
    // Only a relative source pathname, never a URL or query containing PII.
    sourcePage: z
      .string()
      .max(200)
      .regex(/^\/(?!\/)[a-zA-Z0-9/_-]*$/)
      .optional(),
  })
  .strict()
  .refine(
    (input) => input.preferredContactMethod !== "phone" || Boolean(input.phone),
    { path: ["phone"], message: "Enter a phone number for phone contact." },
  );

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactEmail = {
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  html: string;
  text: string;
};

export type Mailer = (
  email: ContactEmail,
  options: { idempotencyKey: string },
) => Promise<{ id: string }>;

export type ContactDependencies = {
  sendEmail: Mailer;
  getConfiguration: () => { toEmail: string; fromEmail: string };
  now?: () => number;
  allowedOrigins?: readonly string[];
  emulator?: boolean;
  logError?: (category: "configuration" | "email_delivery") => void;
};

const inquiryLabels: Record<ContactInput["inquiryType"], string> = {
  general_question: "General Question",
  additional_photos: "Additional Photos",
  showing: "Showing",
  sea_trial: "Sea Trial",
  purchase_discussion: "Purchase Discussion",
  service_survey_documentation: "Service / Survey Documentation",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

export function buildContactEmail(
  input: ContactInput,
  configuration: { toEmail: string; fromEmail: string },
): ContactEmail {
  const fields = [
    ["Name", input.name],
    ["Email", input.email],
    ["Phone", input.phone || "Not supplied"],
    ["Inquiry Type", inquiryLabels[input.inquiryType]],
    ["Preferred Contact Method", input.preferredContactMethod],
    ["Actively Looking", input.activelyLooking ? "Yes" : "Not indicated"],
    ["Source Page", input.sourcePage ?? "/"],
  ];

  return {
    from: configuration.fromEmail,
    to: [configuration.toEmail],
    replyTo: input.email,
    subject: `[895ForSale.com] New inquiry from ${input.name}`,
    html: `<h1>New inquiry about EZ Livin</h1><dl>${fields
      .map(
        ([label = "", value = ""]) =>
          `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${escapeHtml(value)}</dd>`,
      )
      .join(
        "",
      )}</dl><h2>Message</h2><p>${escapeHtml(input.message).replace(/\r?\n/g, "<br>")}</p>`,
    text: `New inquiry about EZ Livin\n\n${fields
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n")}\n\nMessage:\n${input.message}`,
  };
}

function originIsAllowed(
  origin: string,
  dependencies: ContactDependencies,
): boolean {
  if (
    (
      dependencies.allowedOrigins ?? [
        "https://895forsale.com",
        "https://www.895forsale.com",
      ]
    ).includes(origin)
  ) {
    return true;
  }

  if (dependencies.emulator) {
    try {
      const url = new URL(origin);
      return (
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      );
    } catch {
      return false;
    }
  }

  return false;
}

const INVALID_REQUEST = "Please check your information and try again.";
const DELIVERY_UNAVAILABLE =
  "Your message could not be sent. Please try again shortly.";

// A small HTTP interface keeps the injected handler compatible with the
// Firebase SDK and the equivalent Express test server across Express versions.
type ContactRequest = {
  path: string;
  method: string;
  body: unknown;
  get: (name: string) => string | undefined;
  rawBody?: Buffer;
};

type ContactResponse = {
  set: (name: string, value: string) => ContactResponse;
  status: (status: number) => ContactResponse;
  json: (body: unknown) => unknown;
};

/** Pure injected handler: tests exercise validation and acceptance without sending email. */
export function createContactHandler(dependencies: ContactDependencies) {
  return async (
    request: ContactRequest,
    response: ContactResponse,
  ): Promise<void> => {
    response.set("Cache-Control", "no-store");
    response.set("X-Content-Type-Options", "nosniff");

    if (request.path !== "/api/contact" && request.path !== "/") {
      response.status(404).json({ ok: false, error: "Not found." });
      return;
    }

    if (request.method !== "POST") {
      response
        .set("Allow", "POST")
        .status(405)
        .json({ ok: false, error: "Method not allowed." });
      return;
    }

    if (
      request.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !==
      "application/json"
    ) {
      response.status(415).json({ ok: false, error: INVALID_REQUEST });
      return;
    }

    const origin = request.get("origin");
    if (origin && !originIsAllowed(origin, dependencies)) {
      response.status(403).json({ ok: false, error: INVALID_REQUEST });
      return;
    }

    const rawBody = request.rawBody;
    const contentLength = Number(request.get("content-length") ?? 0);
    const serializedBytes =
      rawBody?.byteLength ??
      Buffer.byteLength(JSON.stringify(request.body ?? {}));
    if (contentLength > MAX_BODY_BYTES || serializedBytes > MAX_BODY_BYTES) {
      response.status(413).json({ ok: false, error: INVALID_REQUEST });
      return;
    }

    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ ok: false, error: INVALID_REQUEST });
      return;
    }

    const age = (dependencies.now ?? Date.now)() - parsed.data.startedAt;
    if (
      parsed.data.website !== "" ||
      age < MIN_SUBMIT_TIME_MS ||
      age > MAX_FORM_AGE_MS
    ) {
      response.status(400).json({ ok: false, error: INVALID_REQUEST });
      return;
    }

    let configuration: { toEmail: string; fromEmail: string };
    try {
      configuration = dependencies.getConfiguration();
      if (
        !z.email().safeParse(configuration.toEmail).success ||
        !z.email().safeParse(configuration.fromEmail).success
      ) {
        throw new Error("Contact email configuration is missing or invalid.");
      }
    } catch {
      dependencies.logError?.("configuration");
      response.status(503).json({
        ok: false,
        error: DELIVERY_UNAVAILABLE,
        ...(dependencies.emulator ? { code: "EMAIL_NOT_CONFIGURED" } : {}),
      });
      return;
    }

    try {
      const result = await dependencies.sendEmail(
        buildContactEmail(parsed.data, configuration),
        {
          idempotencyKey: `boat-contact/${parsed.data.requestId}`,
        },
      );
      if (!result.id) {
        throw new Error("No provider acceptance identifier.");
      }
      // This confirms Resend accepted the email. Inbox delivery needs provider
      // delivery events; no delivery claim is inferred from HTTP acceptance.
      response.status(200).json({ ok: true });
    } catch {
      dependencies.logError?.("email_delivery");
      response.status(503).json({ ok: false, error: DELIVERY_UNAVAILABLE });
    }
  };
}
