import { basename } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  checkContactConfiguration,
  emailStatus,
  runContactDoctor,
  secretStatus,
} from "../scripts/contact-config.mjs";

const fakeKey = "re_SyntheticDoctorFixture123456789";
const fixture = {
  ".env.local": 'CONTACT_TO_EMAIL="recipient@boat-owner.net"\nCONTACT_FROM_EMAIL="inquiries@895forsale.com"\n',
  ".secret.local": `RESEND_API_KEY="${fakeKey}"\n`,
};

function reader(files) {
  return (path) => {
    const value = files[basename(path)];
    if (value === undefined) throw Object.assign(new Error("Private filesystem detail"), { code: "ENOENT" });
    return value;
  };
}

function check(files = fixture, options = {}) {
  return checkContactConfiguration({
    directory: "/synthetic-functions-fixture",
    readFile: reader(files),
    isIgnored: () => "yes",
    ...options,
  });
}

describe("read-only contact configuration doctor", () => {
  it("recognizes complete syntactic local configuration without returning values", () => {
    const report = check();
    expect(report).toMatchObject({
      CONTACT_TO_EMAIL: "valid",
      CONTACT_FROM_EMAIL: "valid",
      RESEND_API_KEY: "format-valid",
      localSecretIgnored: "yes",
      complete: true,
    });
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("recipient@boat-owner.net");
    expect(serialized).not.toContain("inquiries@895forsale.com");
    expect(serialized).not.toContain(fakeKey);
  });

  it("treats quoted empty values, including whitespace-only values, as missing", () => {
    expect(check({
      ".env.local": `CONTACT_TO_EMAIL=""\nCONTACT_FROM_EMAIL='  '\n`,
      ".secret.local": 'RESEND_API_KEY=""\n',
    })).toMatchObject({
      CONTACT_TO_EMAIL: "missing", CONTACT_FROM_EMAIL: "missing", RESEND_API_KEY: "missing", complete: false,
    });
  });

  it("handles absent .secret.local safely", () => {
    expect(check({ ".env.local": fixture[".env.local"] })).toMatchObject({
      RESEND_API_KEY: "missing", localSecretIgnored: "not-present", complete: false,
    });
  });

  it.each(["emulator-placeholder", "replace-with-a-development-key", "re_xxxxxxxxx", "re_emulator-placeholder", "your-api-key"])(
    "rejects a development/example placeholder", (value) => expect(secretStatus(value)).toBe("placeholder"),
  );

  it.each(["bad-key", "re_short", " re_SyntheticDoctorFixture123456789", "re_SyntheticDoctorFixture123456789\n"])(
    "rejects invalid secret format", (value) => expect(secretStatus(value)).toBe("invalid"),
  );

  it("validates both email addresses with the same plain-address requirement as the handler", () => {
    expect(emailStatus("broken-address")).toBe("invalid");
    expect(emailStatus("Owner <owner@boat-owner.net>")).toBe("invalid");
    expect(emailStatus(" owner@boat-owner.net ")).toBe("invalid");
    expect(emailStatus("owner@example.com")).toBe("placeholder");
    expect(emailStatus("owner@example.test")).toBe("placeholder");
  });

  it("applies selected local values over base values without changing process.env", () => {
    const before = { ...process.env };
    expect(check({
      ...fixture,
      ".env": "CONTACT_TO_EMAIL=base@boat-owner.net\nCONTACT_FROM_EMAIL=inquiries@895forsale.com\n",
      ".env.local": 'CONTACT_TO_EMAIL=""\n',
    })).toMatchObject({ CONTACT_TO_EMAIL: "missing", CONTACT_FROM_EMAIL: "valid", complete: false });
    expect(process.env).toEqual(before);
  });

  it("selects an explicit project file without accepting local overrides for that check", () => {
    expect(check({
      ...fixture,
      ".env.local": "CONTACT_TO_EMAIL=bad\nCONTACT_FROM_EMAIL=bad\n",
      ".env.selected-project": fixture[".env.local"],
    }, { projectId: "selected-project" })).toMatchObject({
      mode: "project-parameters-and-local-secret", CONTACT_TO_EMAIL: "valid", CONTACT_FROM_EMAIL: "valid", complete: true,
    });
  });

  it("fails closed for unreadable files without leaking error messages", () => {
    const report = check(undefined, {
      readFile: () => { throw Object.assign(new Error(`Sensitive text ${fakeKey}`), { code: "EACCES" }); },
    });
    expect(report).toMatchObject({
      CONTACT_TO_EMAIL: "unreadable", CONTACT_FROM_EMAIL: "unreadable", RESEND_API_KEY: "unreadable", complete: false,
    });
    expect(JSON.stringify(report)).not.toContain(fakeKey);
  });

  it("requires the local secret file to be ignored before reporting configuration complete", () => {
    expect(check(undefined, { isIgnored: () => "no" })).toMatchObject({ localSecretIgnored: "no", complete: false });
    expect(check(undefined, { isIgnored: () => "unknown" })).toMatchObject({ localSecretIgnored: "unknown", complete: false });
  });

  it("prints only statuses and never prints addresses or the key in normal or JSON output", () => {
    for (const args of [[], ["--json"]]) {
      const output = [];
      const code = runContactDoctor({
        args, directory: "/synthetic-functions-fixture", readFile: reader(fixture), isIgnored: () => "yes", write: (line) => output.push(line),
      });
      expect(code).toBe(0);
      expect(output.join("\n")).not.toContain("recipient@boat-owner.net");
      expect(output.join("\n")).not.toContain("inquiries@895forsale.com");
      expect(output.join("\n")).not.toContain(fakeKey);
    }
  });

  it("does not call network APIs or mutate configuration files", () => {
    const paths = [];
    const files = { ...fixture };
    const network = vi.spyOn(globalThis, "fetch").mockImplementation(() => { throw new Error("Doctor must not call a provider."); });
    try {
      const report = checkContactConfiguration({
        directory: "/synthetic-functions-fixture",
        readFile: (path) => { paths.push(basename(path)); return reader(files)(path); },
        isIgnored: () => "yes",
      });
      expect(report.complete).toBe(true);
      expect(paths).toEqual([".env", ".env.local", ".secret.local"]);
      expect(files).toEqual(fixture);
      expect(network).not.toHaveBeenCalled();
    } finally {
      network.mockRestore();
    }
  });

  it("returns failure for missing configuration and rejects untrusted CLI arguments without echoing them", () => {
    const output = [];
    expect(runContactDoctor({ args: [], readFile: reader({}), write: (line) => output.push(line) })).toBe(1);
    expect(runContactDoctor({ args: ["--project", `../${fakeKey}`], write: (line) => output.push(line) })).toBe(2);
    expect(output.join("\n")).not.toContain(fakeKey);
    expect(() => check({ ...fixture }, { projectId: "../private" })).toThrow("Invalid Firebase project identifier.");
  });
});
