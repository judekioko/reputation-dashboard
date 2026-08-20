import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { canUseSms } from "@/lib/plan";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findUnique({ where: { clerkUserId: userId }, include: { alertRules: true } });
  if (!account) return NextResponse.json({ error: "Complete onboarding first" }, { status: 404 });

  const { maxRating, channel } = (await req.json()) as { maxRating: number; channel: "email" | "sms" | "both" };

  if ((channel === "sms" || channel === "both") && !canUseSms(account.plan)) {
    return NextResponse.json({ error: "SMS alerts require the Growth plan" }, { status: 403 });
  }

  const rule = account.alertRules[0];
  const updated = rule
    ? await prisma.alertRule.update({ where: { id: rule.id }, data: { maxRating, channel } })
    : await prisma.alertRule.create({ data: { accountId: account.id, maxRating, channel } });

  return NextResponse.json({ rule: updated });
}
