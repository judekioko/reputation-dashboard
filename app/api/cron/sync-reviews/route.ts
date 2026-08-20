import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchGoogleReviews, googleStarToNumber } from "@/lib/google";
import { fetchFacebookRatings } from "@/lib/facebook";
import { draftReply } from "@/lib/anthropic";
import { maybeSendLowRatingAlert } from "@/lib/alerts";

// Triggered on a schedule (see vercel.json) to pull new reviews from every
// connected Google/Facebook source, store them, and draft an AI reply for each.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await prisma.reviewSource.findMany({
    include: { location: { include: { account: { include: { alertRules: true } } } } },
  });

  let created = 0;

  for (const source of sources) {
    try {
      const incoming =
        source.platform === "google"
          ? (await fetchGoogleReviews(source.accessToken, source.externalLocationId)).map((r) => ({
              externalId: r.reviewId,
              authorName: r.reviewer.displayName,
              rating: googleStarToNumber(r.starRating),
              body: r.comment ?? null,
              postedAt: new Date(r.createTime),
            }))
          : source.platform === "facebook"
          ? (await fetchFacebookRatings(source.externalLocationId, source.accessToken)).map((r) => ({
              externalId: r.open_graph_story?.id ?? `${source.externalLocationId}-${r.created_time}`,
              authorName: r.reviewer?.name ?? "Facebook user",
              rating: r.rating,
              body: r.review_text ?? null,
              postedAt: new Date(r.created_time),
            }))
          : [];

      for (const item of incoming) {
        const existing = await prisma.review.findUnique({
          where: { sourceId_externalId: { sourceId: source.id, externalId: item.externalId } },
        });
        if (existing) continue;

        const review = await prisma.review.create({
          data: { sourceId: source.id, ...item },
          include: { source: { include: { location: { include: { account: { include: { alertRules: true } } } } } } },
        });
        created += 1;

        const draftText = await draftReply({
          businessName: review.source.location.account.businessName,
          authorName: review.authorName,
          rating: review.rating,
          reviewBody: review.body,
        });
        await prisma.reply.create({ data: { reviewId: review.id, draftText } });
        await prisma.review.update({ where: { id: review.id }, data: { replyStatus: "drafted" } });

        await maybeSendLowRatingAlert(review);
      }

      await prisma.reviewSource.update({ where: { id: source.id }, data: { lastSyncedAt: new Date() } });
    } catch (err) {
      console.error(`Sync failed for source ${source.id} (${source.platform})`, err);
    }
  }

  return NextResponse.json({ ok: true, reviewsCreated: created });
}
