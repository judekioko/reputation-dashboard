import { prisma } from "@/lib/prisma";

export async function getAccountForUser(clerkUserId: string) {
  return prisma.account.findUnique({
    where: { clerkUserId },
    include: { locations: { include: { sources: true } }, alertRules: true },
  });
}

export function requireAccount<T>(account: T | null): T {
  if (!account) {
    throw new Error("No account found for this user — complete onboarding first.");
  }
  return account;
}
