import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-24">
      <h1 className="text-4xl font-bold">Reputation Dashboard</h1>
      <p className="text-lg text-ink/70">
        One inbox for your Google and Facebook reviews, AI-drafted replies, and instant alerts on bad ratings.
      </p>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="w-fit rounded-md bg-accent px-5 py-2.5 text-white">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className="w-fit rounded-md bg-accent px-5 py-2.5 text-white">
          Go to dashboard
        </Link>
      </SignedIn>
    </main>
  );
}
