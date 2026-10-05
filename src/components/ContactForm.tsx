"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";
const contactSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Please enter at least two characters.")
      .max(100),
    email: z
      .string()
      .trim()
      .max(254)
      .pipe(z.email("Please enter a valid email address.")),
    phone: z.string().trim().max(40),
    message: z
      .string()
      .trim()
      .min(10, "Please include a little more detail (at least 10 characters).")
      .max(5000),
    preferredContactMethod: z.enum(["email", "phone", "either"]),
    inquiryType: z.enum([
      "general_question",
      "additional_photos",
      "showing",
      "sea_trial",
      "purchase_discussion",
      "service_survey_documentation",
    ]),
    activelyLooking: z.boolean(),
    website: z.string().max(200),
  })
  .refine((v) => v.preferredContactMethod !== "phone" || v.phone.length > 0, {
    path: ["phone"],
    message: "Please add a phone number or choose email.",
  });
export default function ContactForm() {
  const started = useRef<number>(0);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  const engaged = useRef(false);
  const lastRequest = useRef<{ fingerprint: string; id: string } | null>(null);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  function start() {
    if (!started.current) started.current = Date.now();
    if (!engaged.current) {
      engaged.current = true;
      trackEvent("contact_form_start");
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const parsed = contactSchema.safeParse(
      Object.fromEntries([
        ...[
          "name",
          "email",
          "phone",
          "message",
          "preferredContactMethod",
          "inquiryType",
          "website",
        ].map((key) => [key, String(values.get(key) || "")]),
        ["activelyLooking", values.get("activelyLooking") === "on"],
      ]),
    );
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
      setErrors(next);
      setStatus("idle");
      trackEvent("contact_form_error", { error_type: "validation" });
      form
        .querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)
        ?.focus();
      return;
    }
    setErrors({});
    setStatus("sending");
    trackEvent("contact_form_submit");
    const fingerprint = JSON.stringify(parsed.data);
    if (lastRequest.current?.fingerprint !== fingerprint)
      lastRequest.current = { fingerprint, id: crypto.randomUUID() };
    try {
      if (
        !started.current ||
        Date.now() - started.current > 24 * 60 * 60 * 1000
      )
        started.current = Date.now();
      const wait = Math.max(0, 3000 - (Date.now() - started.current));
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          requestId: lastRequest.current!.id,
          startedAt: started.current || Date.now(),
          sourcePage: "/",
        }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        const localPreview = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
        throw new Error(localPreview && result?.code === "EMAIL_NOT_CONFIGURED" ? "configuration" : "server");
      }
      setStatus("success");
      trackEvent("contact_form_success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error && error.message === "configuration"
          ? "Email delivery isn’t configured for this local preview yet. Your message hasn’t been sent. Your details are still here."
          : "We couldn’t confirm your message was sent. Please try again in a moment. Your details are still here.",
      );
      trackEvent("contact_form_error", {
        error_type:
          error instanceof Error && ["server", "configuration"].includes(error.message)
            ? "server"
            : "network",
      });
    }
  }
  if (status === "success")
    return (
      <div className="contact-success" role="status">
        <span aria-hidden="true">✓</span>
        <h3>Thank you for your interest.</h3>
        <p>
          Your message has been sent to the owner. We’ll get back to you as soon
          as possible.
        </p>
      </div>
    );
  const association = (key: string) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? key + "-error" : undefined,
  });
  const feedback = (key: string) =>
    errors[key] && (
      <span id={key + "-error"} className="field-error">
        {errors[key]}
      </span>
    );
  return (
    <form className="contact-form" onSubmit={submit} onFocus={start} noValidate>
      <div className="form-row">
        <div className="field">
          <label htmlFor="name">
            Your name <span>*</span>
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            maxLength={100}
            required
            {...association("name")}
          />
          {feedback("name")}
        </div>
        <div className="field">
          <label htmlFor="email">
            Email address <span>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            {...association("email")}
          />
          {feedback("email")}
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="phone">
            Phone <small>optional</small>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            {...association("phone")}
          />
          {feedback("phone")}
        </div>
        <div className="field">
          <label htmlFor="preferredContactMethod">Preferred contact</label>
          <select
            id="preferredContactMethod"
            name="preferredContactMethod"
            defaultValue="email"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="either">Either is fine</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="inquiryType">What would you like to discuss?</label>
        <select
          id="inquiryType"
          name="inquiryType"
          defaultValue="general_question"
        >
          <option value="general_question">General question</option>
          <option value="additional_photos">Additional photos</option>
          <option value="showing">Schedule a showing</option>
          <option value="sea_trial">Discuss a sea trial</option>
          <option value="purchase_discussion">Purchase discussion</option>
          <option value="service_survey_documentation">
            Service / survey documentation
          </option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="message">
          Your message <span>*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={5000}
          placeholder="Tell us what you’d like to know about EZ Livin…"
          required
          {...association("message")}
        />
        {feedback("message")}
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="checkbox-label">
        <input type="checkbox" name="activelyLooking" />
        I’m actively looking for an NC 895 or similar cruiser.
      </label>
      {status === "error" && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}
      <button className="button" type="submit" disabled={status === "sending"}>
        {status === "sending"
          ? "Sending your message…"
          : "Send message to owner"}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="form-privacy">
        Your details are used to respond to your inquiry.{" "}
        <a href="/privacy/">Privacy information</a>.
      </p>
    </form>
  );
}
