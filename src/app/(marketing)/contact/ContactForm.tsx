"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components";

const CONTACT_ENDPOINT =
  "https://52e8sjfcp0.execute-api.ap-south-1.amazonaws.com/prod/v1/contact";

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

const initialValues: ContactPayload = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactForm() {
  const [values, setValues] = useState<ContactPayload>(initialValues);
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleChange = (
    field: keyof ContactPayload,
    value: string,
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        cache: "no-store",
      });

      if (response.ok) {
        setStatus("success");
        setValues(initialValues);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const inputClasses =
    "w-full border border-forest/20 bg-creamLight px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-forest focus:outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit} noValidate={false} className="space-y-5">
      <div>
        <label
          htmlFor="contact-name"
          className="mb-2 block font-sans text-xs uppercase tracking-[0.22em] text-forest"
        >
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Your full name"
          className={inputClasses}
        />
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="mb-2 block font-sans text-xs uppercase tracking-[0.22em] text-forest"
        >
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          value={values.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="you@example.com"
          className={inputClasses}
        />
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="mb-2 block font-sans text-xs uppercase tracking-[0.22em] text-forest"
        >
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          value={values.subject}
          onChange={(e) => handleChange("subject", e.target.value)}
          placeholder="What may we help with?"
          className={inputClasses}
        />
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="mb-2 block font-sans text-xs uppercase tracking-[0.22em] text-forest"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          value={values.message}
          onChange={(e) => handleChange("message", e.target.value)}
          placeholder="Tell us about the piece you have in mind."
          className={`${inputClasses} resize-y`}
        />
      </div>

      {status === "success" && (
        <p className="border border-forest/20 bg-creamLight px-4 py-3 text-sm leading-relaxed text-forest" role="status">
          Thank you — your note has reached the atelier. We reply within one working day.
        </p>
      )}

      {status === "error" && (
        <p className="border border-forest/20 bg-creamLight px-4 py-3 text-sm leading-relaxed text-forest" role="alert">
          Your message could not be sent. Please write to us directly at hello@aaranya.in.
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}