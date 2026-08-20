import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeFacebookCode, listFacebookPages } from "@/lib/facebook";
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
    const tokens = await exchangeFacebookCode(code);
    const pages = await listFacebookPages(tokens.access_token);
    const firstPage = pages[0];
    if (!firstPage) {
      return NextResponse.redirect(new URL("/dashboard/connect?error=no_facebook_pages", appUrl));
    }

    // Facebook page access tokens for pages_show_list apps don't expire on the same
    // clock as user tokens; store without an expiry and refresh the page list on failure.
    await prisma.reviewSource.upsert({
      where: { locationId_platform: { locationId, platform: "facebook" } },
      create: {
        locationId,
        platform: "facebook",
        externalLocationId: firstPage.id,
        accessToken: firstPage.access_token,
      },
      update: {
        externalLocationId: firstPage.id,
        accessToken: firstPage.access_token,
      },
    });

    return NextResponse.redirect(new URL("/dashboard/connect?connected=facebook", appUrl));
  } catch (err) {
    console.error("Facebook OAuth callback failed", err);
    return NextResponse.redirect(new URL("/dashboard/connect?error=facebook_connect_failed", appUrl));
  }
}
