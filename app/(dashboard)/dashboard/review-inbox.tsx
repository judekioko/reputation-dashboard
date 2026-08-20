"use client";

import { useState } from "react";

type ReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  body: string | null;
  platform: string;
  replyStatus: "none" | "drafted" | "sent";
  draftText: string;
  sentText: string | null;
};

export function ReviewInbox({ reviews }: { reviews: ReviewItem[] }) {
  return (
    <ul className="mt-6 flex flex-col gap-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </ul>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  const [text, setText] = useState(review.sentText ?? review.draftText);
  const [status, setStatus] = useState(review.replyStatus);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setSending(true);
    setError(null);
    const res = await fetch(`/api/reviews/${review.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setSending(false);
    if (!res.ok) {
      setError("Couldn't send that reply. Try again.");
      return;
    }
    setStatus("sent");
  }

  return (
    <li className="rounded-lg border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">{review.authorName}</span>
        <span className="text-sm text-ink/50 capitalize">{review.platform}</span>
      </div>
      <div className="mt-1" aria-label={`${review.rating} out of 5 stars`}>
        {"★".repeat(review.rating)}
        {"☆".repeat(5 - review.rating)}
      </div>
      {review.body && <p className="mt-2 text-sm text-ink/70">{review.body}</p>}

      <div className="mt-4 border-t border-ink/10 pt-4">
        {status === "sent" ? (
          <p className="text-sm text-ink/60">
            Reply sent: <span className="text-ink">{text}</span>
          </p>
        ) : (
          <>
            <label className="text-xs uppercase tracking-wide text-ink/50">AI-drafted reply — edit before sending</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-sm"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              className="mt-2 rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send reply"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
