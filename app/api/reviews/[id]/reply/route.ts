import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { postGoogleReply } from "@/lib/google";
import { postFacebookReply } from "@/lib/facebook";

// The owner reviews the AI draft, optionally edits it, and sends. Replies are
// never posted automatically — this route is the only path that sends one.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { text } = (await req.json()) as { text: string };
  if (!text?.trim()) return NextResponse.json({ error: "Reply text is required" }, { status: 400 });

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      reply: true,
      source: { include: { location: { include: { account: true } } } },
    },
  });

  if (!review || review.source.location.account.clerkUserId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (review.source.platform === "google") {
    await postGoogleReply(review.source.accessToken, review.source.externalLocationId, review.externalId, text);
  } else if (review.source.platform === "facebook") {
    await postFacebookReply(review.externalId, review.source.accessToken, text);
  } else {
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  await prisma.reply.upsert({
    where: { reviewId: review.id },
    create: { reviewId: review.id, draftText: text, sentText: text, sentAt: new Date() },
    update: { sentText: text, sentAt: new Date() },
  });
  await prisma.review.update({ where: { id: review.id }, data: { replyStatus: "sent" } });

  return NextResponse.json({ ok: true });
}
