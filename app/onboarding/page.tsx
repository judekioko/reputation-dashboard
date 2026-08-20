"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, contactEmail, contactPhone, locationLabel }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    router.push("/dashboard/connect");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Set up your business</h1>
      <p className="mt-2 text-ink/60">This takes a minute — then you&apos;ll connect your Google and Facebook reviews.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Business name
          <input
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="rounded-md border border-ink/20 px-3 py-2"
            placeholder="Kilimani Plumbing Co."
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Location name
          <input
            required
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            className="rounded-md border border-ink/20 px-3 py-2"
            placeholder="Main branch"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Alert email
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="rounded-md border border-ink/20 px-3 py-2"
            placeholder="you@business.com"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Alert phone (optional, SMS is a Growth plan feature)
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="rounded-md border border-ink/20 px-3 py-2"
            placeholder="+254 7xx xxx xxx"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-accent px-5 py-2.5 text-white disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Continue"}
        </button>
      </form>
    </main>
  );
}
