// Read-only configuration doctor. Never log parsed values or error objects.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parse } from "dotenv";
import { z } from "zod";

const functionsDirectory = fileURLToPath(new URL("../", import.meta.url));
const projectIdPattern = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
const placeholderPattern = /placeholder|replace|example|your[-_ ]|emulator|(?:development|test)[-_ ]key/i;
const reservedEmailDomain = /(?:^|\.)(?:example\.com|example\.org|example\.net|invalid|test|example)$/i;

export function emailStatus(value) {
  if (typeof value !== "string" || !value.trim()) return "missing";
  if (!z.email().safeParse(value).success) return "invalid";
  if (reservedEmailDomain.test(value.split("@")[1])) return "placeholder";
  return "valid";
}

export function secretStatus(value) {
  if (typeof value !== "string" || !value.trim()) return "missing";
  if (placeholderPattern.test(value) || /^re_x+$/i.test(value)) return "placeholder";
  if (!/^re_[A-Za-z0-9_-]{16,128}$/.test(value)) return "invalid";
  return "format-valid";
}

function readEnvironment(path, readFile) {
  try {
    return { status: "loaded", values: parse(readFile(path, "utf8")) };
  } catch (error) {
    // Error messages can include sensitive input or paths; retain only a fixed status.
    return { status: error?.code === "ENOENT" ? "missing" : "unreadable", values: {} };
  }
}

function secretIsIgnored(path, directory) {
  try {
    const result = spawnSync("git", ["check-ignore", "--quiet", "--", path], {
      cwd: directory,
      stdio: "pipe",
    });
    if (result.status === 0) return "yes";
    if (result.status === 1) return "no";
  } catch {
    // Never print Git or filesystem errors, which may contain private values.
  }
  return "unknown";
}

/** Returns fixed statuses only. It never mutates files/process.env or calls a provider. */
export function checkContactConfiguration({
  directory = functionsDirectory,
  projectId,
  readFile = readFileSync,
  isIgnored = secretIsIgnored,
} = {}) {
  if (projectId !== undefined && !projectIdPattern.test(projectId)) {
    throw new Error("Invalid Firebase project identifier.");
  }
  const base = readEnvironment(resolve(directory, ".env"), readFile);
  const selected = readEnvironment(resolve(directory, projectId ? `.env.${projectId}` : ".env.local"), readFile);
  const secretPath = resolve(directory, ".secret.local");
  const secret = readEnvironment(secretPath, readFile);
  const addresses = { ...base.values, ...selected.values };
  const environmentUnreadable = base.status === "unreadable" || selected.status === "unreadable";
  const recipient = environmentUnreadable ? "unreadable" : emailStatus(addresses.CONTACT_TO_EMAIL);
  const sender = environmentUnreadable ? "unreadable" : emailStatus(addresses.CONTACT_FROM_EMAIL);
  const key = secret.status === "unreadable" ? "unreadable" : secretStatus(secret.values.RESEND_API_KEY);
  const ignored = secret.status === "missing" ? "not-present" : isIgnored(secretPath, directory);

  return {
    mode: projectId ? "project-parameters-and-local-secret" : "local-emulator",
    CONTACT_TO_EMAIL: recipient,
    CONTACT_FROM_EMAIL: sender,
    RESEND_API_KEY: key,
    localSecretIgnored: ignored,
    files: { base: base.status, selected: selected.status, localSecret: secret.status },
    complete: recipient === "valid" && sender === "valid" && key === "format-valid" && ignored === "yes",
  };
}

export function runContactDoctor({
  args = process.argv.slice(2),
  directory = functionsDirectory,
  write = (line) => console.log(line),
  readFile = readFileSync,
  isIgnored = secretIsIgnored,
} = {}) {
  const argumentsCopy = [...args];
  const json = argumentsCopy.includes("--json");
  if (json) argumentsCopy.splice(argumentsCopy.indexOf("--json"), 1);
  let projectId;
  if (argumentsCopy.length === 2 && argumentsCopy[0] === "--project" && projectIdPattern.test(argumentsCopy[1])) {
    projectId = argumentsCopy[1];
  } else if (argumentsCopy.length !== 0) {
    write("Usage: npm --prefix functions run contact:check -- [--project PROJECT_ID] [--json]");
    return 2;
  }
  const report = checkContactConfiguration({ directory, projectId, readFile, isIgnored });
  if (json) {
    write(JSON.stringify(report));
  } else {
    write(projectId ? "Project email parameters + local development secret (read-only)" : "Local emulator email configuration (read-only)");
    for (const parameter of ["CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL", "RESEND_API_KEY"]) {
      write(`${parameter}: ${report[parameter]}`);
    }
    write(`.secret.local ignored by Git: ${report.localSecretIgnored}`);
    write(report.complete ? "Local configuration appears complete." : "Local configuration is incomplete.");
    write("No provider calls made. Key authorization, sender-domain verification, Secret Manager and inbox delivery are not verified.");
  }
  return report.complete ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runContactDoctor();
}
