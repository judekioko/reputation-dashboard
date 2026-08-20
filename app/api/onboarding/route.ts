import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.account.findUnique({ where: { clerkUserId: userId } });
  if (existing) return NextResponse.json({ error: "Account already exists" }, { status: 409 });

  const { businessName, contactEmail, contactPhone, locationLabel } = (await req.json()) as {
    businessName: string;
    contactEmail: string;
    contactPhone?: string;
    locationLabel: string;
  };

  if (!businessName?.trim() || !contactEmail?.trim() || !locationLabel?.trim()) {
    return NextResponse.json({ error: "businessName, contactEmail, and locationLabel are required" }, { status: 400 });
  }

  const account = await prisma.account.create({
    data: {
      clerkUserId: userId,
      businessName,
      contactEmail,
      contactPhone,
      locations: { create: { label: locationLabel } },
      alertRules: { create: { maxRating: 2, channel: "email" } },
    },
    include: { locations: true },
  });

  return NextResponse.json({ account });
}
