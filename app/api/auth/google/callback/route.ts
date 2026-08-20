import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeGoogleCode, listGoogleAccounts, listGoogleLocations } from "@/lib/google";
import { verifyOAuthState } from "@/lib/oauth-state";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", appUrl));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const { valid, locationId } = await verifyOAuthState(state);

  if (!valid || !code || !locationId) {
    return NextResponse.redirect(new URL("/dashboard/connect?error=invalid_state", appUrl));
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const accounts = await listGoogleAccounts(tokens.access_token);
    const firstAccount = accounts[0];
    if (!firstAccount) {
      return NextResponse.redirect(new URL("/dashboard/connect?error=no_google_business_account", appUrl));
    }

    const locations = await listGoogleLocations(tokens.access_token, firstAccount.name);
    const firstLocation = locations[0];
    if (!firstLocation) {
      return NextResponse.redirect(new URL("/dashboard/connect?error=no_google_locations", appUrl));
    }

    await prisma.reviewSource.upsert({
      where: { locationId_platform: { locationId, platform: "google" } },
      create: {
        locationId,
        platform: "google",
        externalLocationId: firstLocation.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      update: {
        externalLocationId: firstLocation.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return NextResponse.redirect(new URL("/dashboard/connect?connected=google", appUrl));
  } catch (err) {
    console.error("Google OAuth callback failed", err);
    return NextResponse.redirect(new URL("/dashboard/connect?error=google_connect_failed", appUrl));
  }
}
