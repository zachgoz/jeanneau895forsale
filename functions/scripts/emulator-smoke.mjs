import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Run with Firebase Hosting + Functions emulators and empty CONTACT_* values.
// This smoke test intentionally sends no email and uses no production secrets.
const functionsDirectory = fileURLToPath(new URL("../", import.meta.url));
for (const parameter of ["CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"]) {
  assert.ok(
    !process.env[parameter],
    "Refusing a delivery smoke test with configured email parameters.",
  );
}
for (const file of [".env", ".env.local", ".env.demo-895forsale"]) {
  const path = `${functionsDirectory}${file}`;
  if (existsSync(path)) {
    for (const match of readFileSync(path, "utf8").matchAll(
      /^CONTACT_(?:TO|FROM)_EMAIL[ \t]*=[ \t]*(.*)$/gm,
    )) {
      const value = (match[1] ?? "").trim().replace(/^(["'])(.*)\1$/, "$2");
      assert.ok(
        !value,
        "Refusing a delivery smoke test with configured email parameters.",
      );
    }
  }
}
const baseUrl = process.env.CONTACT_EMULATOR_URL ?? "http://127.0.0.1:5002";
const endpoint = `${baseUrl}/api/contact`;
const validInput = {
  name: "Emulator Buyer",
  email: "buyer@example.com",
  message: "This integration request must not send an actual email.",
  preferredContactMethod: "email",
  inquiryType: "general_question",
  website: "",
  startedAt: Date.now() - 5_000,
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  sourcePage: "/",
};

const method = await fetch(endpoint);
assert.equal(
  method.status,
  405,
  "GET must reach the contact function and be rejected",
);
assert.equal(method.headers.get("allow"), "POST");

const contentType = await fetch(endpoint, { method: "POST", body: "hello" });
assert.equal(contentType.status, 415, "non-JSON must be rejected");

const validation = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...validInput, email: "invalid" }),
});
assert.equal(validation.status, 400, "invalid inquiry must be rejected");

const unavailable = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(validInput),
});
assert.equal(
  unavailable.status,
  503,
  "missing configuration must fail without claiming email success",
);
const unavailableBody = await unavailable.json();
assert.equal(unavailableBody.ok, false);
assert.equal(
  unavailableBody.code,
  "EMAIL_NOT_CONFIGURED",
  "local missing setup must be distinguishable from a retryable delivery error",
);

const missingRoute = await fetch(`${baseUrl}/api/does-not-exist`);
assert.equal(
  missingRoute.status,
  404,
  "missing API must not return the site as a fake successful response",
);

console.log(
  "Firebase emulator integration passed: method, content type, validation, unconfigured delivery, missing API.",
);
