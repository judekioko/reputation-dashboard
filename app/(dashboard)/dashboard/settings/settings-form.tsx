"use client";

import { useState } from "react";

export function SettingsForm(props: {
  plan: "starter" | "growth";
  initialMaxRating: number;
  initialChannel: "email" | "sms" | "both";
  hasBilling: boolean;
}) {
  const [maxRating, setMaxRating] = useState(props.initialMaxRating);
  const [channel, setChannel] = useState(props.initialChannel);
  const [saved, setSaved] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function saveAlertRule() {
    setSaved(false);
    const res = await fetch("/api/settings/alert-rule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxRating, channel }),
    });
    if (res.ok) setSaved(true);
  }

  async function openBilling(path: "/api/billing/checkout" | "/api/billing/portal") {
    setRedirecting(true);
    const res = await fetch(path, { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setRedirecting(false);
  }

  return (
    <>
      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-wide text-ink/50">Alerts</h2>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Alert me when a review is at or below
            <select
              value={maxRating}
              onChange={(e) => setMaxRating(Number(e.target.value))}
              className="w-fit rounded-md border border-ink/20 px-3 py-2"
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Channel
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as typeof channel)}
              className="w-fit rounded-md border border-ink/20 px-3 py-2"
            >
              <option value="email">Email</option>
              <option value="sms" disabled={props.plan === "starter"}>
                SMS {props.plan === "starter" ? "(Growth plan)" : ""}
              </option>
              <option value="both" disabled={props.plan === "starter"}>
                Email + SMS {props.plan === "starter" ? "(Growth plan)" : ""}
              </option>
            </select>
          </label>

          <button
            onClick={saveAlertRule}
            className="w-fit rounded-md bg-accent px-4 py-2 text-sm text-white"
          >
            Save
          </button>
          {saved && <p className="text-sm text-accent">Saved.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-wide text-ink/50">Billing</h2>
        <div className="mt-3">
          {props.plan === "starter" ? (
            <button
              onClick={() => openBilling("/api/billing/checkout")}
              disabled={redirecting}
              className="rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {redirecting ? "Redirecting..." : "Upgrade to Growth — $49/mo"}
            </button>
          ) : (
            <button
              onClick={() => openBilling("/api/billing/portal")}
              disabled={redirecting}
              className="rounded-md border border-ink/20 px-4 py-2 text-sm disabled:opacity-50"
            >
              {redirecting ? "Redirecting..." : "Manage billing"}
            </button>
          )}
        </div>
      </section>
    </>
  );
}
