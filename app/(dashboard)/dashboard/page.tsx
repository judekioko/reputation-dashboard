import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAccountForUser } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { ReviewInbox } from "./review-inbox";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const account = await getAccountForUser(userId);
  if (!account) redirect("/onboarding");

  const reviews = await prisma.review.findMany({
    where: { source: { location: { accountId: account.id } } },
    include: { reply: true, source: true },
    orderBy: [{ rating: "asc" }, { postedAt: "desc" }],
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Review inbox</h1>
        <a href="/dashboard/connect" className="text-sm text-accent underline">
          Manage connections
        </a>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 text-ink/60">
          No reviews yet. <a href="/dashboard/connect" className="text-accent underline">Connect a review source</a> to
          start pulling reviews in.
        </p>
      ) : (
        <ReviewInbox
          reviews={reviews.map((r) => ({
            id: r.id,
            authorName: r.authorName,
            rating: r.rating,
            body: r.body,
            platform: r.source.platform,
            replyStatus: r.replyStatus,
            draftText: r.reply?.draftText ?? "",
            sentText: r.reply?.sentText ?? null,
          }))}
        />
      )}
    </main>
  );
}
