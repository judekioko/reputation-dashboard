const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_APP_URL } = process.env;

const REDIRECT_URI = `${NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`;
const SCOPE = "https://www.googleapis.com/auth/business.manage";

export function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID ?? "",
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: SCOPE,
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID ?? "",
      client_secret: GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

// Business Profile accounts the authenticated user manages.
export async function listGoogleAccounts(accessToken: string) {
  const res = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to list Google accounts: ${await res.text()}`);
  const data = await res.json();
  return data.accounts as { name: string; accountName: string }[];
}

// Locations under a given Business Profile account.
export async function listGoogleLocations(accessToken: string, accountName: string) {
  const params = new URLSearchParams({ readMask: "name,title" });
  const res = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Failed to list Google locations: ${await res.text()}`);
  const data = await res.json();
  return (data.locations ?? []) as { name: string; title: string }[];
}

// `locationResourceName` is e.g. "accounts/123/locations/456".
export async function fetchGoogleReviews(accessToken: string, locationResourceName: string) {
  const res = await fetch(`https://mybusiness.googleapis.com/v4/${locationResourceName}/reviews`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch Google reviews: ${await res.text()}`);
  const data = await res.json();
  return (data.reviews ?? []) as {
    reviewId: string;
    reviewer: { displayName: string };
    starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
    comment?: string;
    createTime: string;
  }[];
}

const STAR_MAP = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as const;
export function googleStarToNumber(star: keyof typeof STAR_MAP) {
  return STAR_MAP[star];
}

export async function postGoogleReply(accessToken: string, locationResourceName: string, reviewId: string, comment: string) {
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationResourceName}/reviews/${reviewId}/reply`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    }
  );
  if (!res.ok) throw new Error(`Failed to post Google reply: ${await res.text()}`);
}
