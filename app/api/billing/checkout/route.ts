import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe, PLAN_PRICE_IDS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findUnique({ where: { clerkUserId: userId } });
  if (!account) return NextResponse.json({ error: "Complete onboarding first" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: account.stripeCustomerId ?? undefined,
    customer_email: account.stripeCustomerId ? undefined : account.contactEmail,
    client_reference_id: account.id,
    line_items: [{ price: PLAN_PRICE_IDS.growth, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings?upgraded=1`,
    cancel_url: `${appUrl}/dashboard/settings`,
  });

  if (!account.stripeCustomerId && session.customer) {
    await prisma.account.update({
      where: { id: account.id },
      data: { stripeCustomerId: session.customer as string },
    });
  }

  return NextResponse.json({ url: session.url });
}
