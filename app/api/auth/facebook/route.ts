import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getFacebookAuthUrl } from "@/lib/facebook";
import { createOAuthState } from "@/lib/oauth-state";

export async function GET(req: Request) {
  const { userId } = await auth();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!userId) return NextResponse.redirect(new URL("/sign-in", appUrl));

  const locationId = new URL(req.url).searchParams.get("locationId");
  if (!locationId) return NextResponse.redirect(new URL("/dashboard/connect?error=missing_location", appUrl));

  const state = await createOAuthState(locationId);
  return NextResponse.redirect(getFacebookAuthUrl(state));
}
