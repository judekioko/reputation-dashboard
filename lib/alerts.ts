import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { sendSms } from "@/lib/twilio";
import { canUseSms } from "@/lib/plan";
import type { Review, ReviewSource, Location, Account, AlertRule } from "@prisma/client";

type ReviewWithContext = Review & {
  source: ReviewSource & {
    location: Location & { account: Account & { alertRules: AlertRule[] } };
  };
};

export async function maybeSendLowRatingAlert(review: ReviewWithContext) {
  const account = review.source.location.account;
  const rule = account.alertRules[0];
  if (!rule || review.rating > rule.maxRating) return;

  const subject = `${review.rating}★ review from ${review.authorName} needs a reply`;
  const html = `
    <p><strong>${review.authorName}</strong> left a ${review.rating}-star review on ${review.source.platform}:</p>
    <blockquote>${review.body ?? "(no written text)"}</blockquote>
    <p><a href="https://reputationdashboard.app/dashboard">Open the inbox to respond</a></p>
  `;

  const wantsEmail = rule.channel === "email" || rule.channel === "both";
  const wantsSms = (rule.channel === "sms" || rule.channel === "both") && canUseSms(account.plan);

  if (wantsEmail) {
    await sendEmail({ to: account.contactEmail, subject, html });
  }
  if (wantsSms && account.contactPhone) {
    await sendSms(
      account.contactPhone,
      `${review.rating}★ review from ${review.authorName} on ${review.source.platform}. Reply: https://reputationdashboard.app/dashboard`
    );
  }
}

export async function sendWeeklySummaries() {
  const accounts = await prisma.account.findMany({
    include: { locations: { include: { sources: { include: { reviews: true } } } } },
  });

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const account of accounts) {
    const reviews = account.locations.flatMap((l) => l.sources.flatMap((s) => s.reviews));
    const recent = reviews.filter((r) => r.postedAt >= oneWeekAgo);
    if (recent.length === 0) continue;

    const avg = (recent.reduce((sum, r) => sum + r.rating, 0) / recent.length).toFixed(1);

    await sendEmail({
      to: account.contactEmail,
      subject: `Your week in reviews: ${recent.length} new, ${avg}★ average`,
      html: `
        <p>${recent.length} new review${recent.length === 1 ? "" : "s"} this week, averaging ${avg} stars.</p>
        <p><a href="https://reputationdashboard.app/dashboard">Open your inbox</a></p>
      `,
    });
  }
}
