import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAccountForUser } from "@/lib/account";
import { canAddLocation } from "@/lib/plan";

const ERROR_MESSAGES: Record<string, string> = {
  missing_location: "No location was specified. Start the connection from the button below.",
  invalid_state: "That connection link expired. Try connecting again.",
  no_google_business_account: "No Google Business Profile account was found for that Google login.",
  no_google_locations: "That Google Business Profile account has no locations to connect.",
  no_facebook_pages: "No Facebook Pages were found for that Facebook login.",
  google_connect_failed: "Connecting Google didn't work. Try again.",
  facebook_connect_failed: "Connecting Facebook didn't work. Try again.",
};

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const account = await getAccountForUser(userId);
  if (!account) redirect("/onboarding");

  const { connected, error } = await searchParams;
  const canAddMore = canAddLocation(account.plan, account.locations.length);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Connect your review sources</h1>
      <p className="mt-2 text-ink/60">Reviews start syncing within a few minutes of connecting.</p>

      {connected && (
        <p className="mt-4 rounded-md bg-accent/10 px-4 py-2 text-sm text-accent">
          {connected === "google" ? "Google" : "Facebook"} connected.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
          {ERROR_MESSAGES[error] ?? "Something went wrong."}
        </p>
      )}

      <ul className="mt-8 flex flex-col gap-4">
        {account.locations.map((location) => {
          const google = location.sources.find((s) => s.platform === "google");
          const facebook = location.sources.find((s) => s.platform === "facebook");
          return (
            <li key={location.id} className="rounded-lg border border-ink/10 bg-white p-4">
              <div className="font-medium">{location.label}</div>
              <div className="mt-3 flex gap-3">
                <a
                  href={`/api/auth/google?locationId=${location.id}`}
                  className="rounded-md border border-ink/20 px-4 py-2 text-sm"
                >
                  {google ? "Reconnect Google" : "Connect Google"}
                </a>
                <a
                  href={`/api/auth/facebook?locationId=${location.id}`}
                  className="rounded-md border border-ink/20 px-4 py-2 text-sm"
                >
                  {facebook ? "Reconnect Facebook" : "Connect Facebook"}
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      {!canAddMore && account.plan === "starter" && (
        <p className="mt-6 text-sm text-ink/60">
          Starter includes 1 location. <a href="/dashboard/settings" className="text-accent underline">Upgrade to Growth</a> for up to 3.
        </p>
      )}
    </main>
  );
}
