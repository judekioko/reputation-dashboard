import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const STATE_COOKIE = "oauth_state";
const LOCATION_COOKIE = "oauth_location_id";

// CSRF protection for OAuth redirects, plus a way to carry which internal Location
// this connection is for across the round trip to Google/Facebook and back.
export async function createOAuthState(locationId: string): Promise<string> {
  const state = randomBytes(24).toString("hex");
  const store = await cookies();
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  store.set(STATE_COOKIE, state, opts);
  store.set(LOCATION_COOKIE, locationId, opts);
  return state;
}

export async function verifyOAuthState(
  receivedState: string | null
): Promise<{ valid: boolean; locationId: string | null }> {
  const store = await cookies();
  const expectedState = store.get(STATE_COOKIE)?.value;
  const locationId = store.get(LOCATION_COOKIE)?.value ?? null;
  store.delete(STATE_COOKIE);
  store.delete(LOCATION_COOKIE);

  const valid = !!expectedState && !!receivedState && expectedState === receivedState;
  return { valid, locationId: valid ? locationId : null };
}
