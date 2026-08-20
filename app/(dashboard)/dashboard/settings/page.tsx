import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAccountForUser } from "@/lib/account";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const account = await getAccountForUser(userId);
  if (!account) redirect("/onboarding");

  const rule = account.alertRules[0];

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-wide text-ink/50">Plan</h2>
        <p className="mt-2 capitalize">
          {account.plan} plan &middot; {account.locations.length}/{account.plan === "starter" ? 1 : 3} locations used
        </p>
      </section>

      <SettingsForm
        plan={account.plan}
        initialMaxRating={rule?.maxRating ?? 2}
        initialChannel={rule?.channel ?? "email"}
        hasBilling={!!account.stripeCustomerId}
      />
    </main>
  );
}
