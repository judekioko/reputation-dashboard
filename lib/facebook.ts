const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, NEXT_PUBLIC_APP_URL } = process.env;

const GRAPH_VERSION = "v21.0";
const REDIRECT_URI = `${NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/facebook/callback`;
const SCOPE = "pages_show_list,pages_read_engagement,pages_read_user_content";

export function getFacebookAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID ?? "",
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    state,
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeFacebookCode(code: string) {
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID ?? "",
    client_secret: FACEBOOK_APP_SECRET ?? "",
    redirect_uri: REDIRECT_URI,
    code,
  });
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`Facebook token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

// Pages the authenticated user manages, each with its own page-scoped access token.
export async function listFacebookPages(userAccessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts?access_token=${userAccessToken}`
  );
  if (!res.ok) throw new Error(`Failed to list Facebook pages: ${await res.text()}`);
  const data = await res.json();
  return data.data as { id: string; name: string; access_token: string }[];
}

export async function fetchFacebookRatings(pageId: string, pageAccessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/ratings?fields=reviewer,rating,review_text,created_time,open_graph_story&access_token=${pageAccessToken}`
  );
  if (!res.ok) throw new Error(`Failed to fetch Facebook ratings: ${await res.text()}`);
  const data = await res.json();
  return (data.data ?? []) as {
    reviewer?: { name: string };
    rating: number;
    review_text?: string;
    created_time: string;
    open_graph_story?: { id: string };
  }[];
}

// Facebook has no first-party "reply to rating" endpoint; the accepted workaround is
// commenting on the rating's underlying open_graph_story. Requires that story id.
export async function postFacebookReply(storyId: string, pageAccessToken: string, message: string) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${storyId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: pageAccessToken }),
  });
  if (!res.ok) throw new Error(`Failed to post Facebook reply: ${await res.text()}`);
}
