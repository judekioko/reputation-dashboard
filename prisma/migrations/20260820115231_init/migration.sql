-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('starter', 'growth');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('google', 'facebook', 'yelp');

-- CreateEnum
CREATE TYPE "ReplyStatus" AS ENUM ('none', 'drafted', 'sent');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('email', 'sms', 'both');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'starter',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_sources" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalLocationId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "replyStatus" "ReplyStatus" NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replies" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "draftText" TEXT NOT NULL,
    "sentText" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "maxRating" INTEGER NOT NULL DEFAULT 2,
    "channel" "AlertChannel" NOT NULL DEFAULT 'email',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_clerkUserId_key" ON "accounts"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_stripeCustomerId_key" ON "accounts"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "locations_accountId_idx" ON "locations"("accountId");

-- CreateIndex
CREATE INDEX "review_sources_locationId_idx" ON "review_sources"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "review_sources_locationId_platform_key" ON "review_sources"("locationId", "platform");

-- CreateIndex
CREATE INDEX "reviews_sourceId_rating_idx" ON "reviews"("sourceId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_sourceId_externalId_key" ON "reviews"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "replies_reviewId_key" ON "replies"("reviewId");

-- CreateIndex
CREATE INDEX "alert_rules_accountId_idx" ON "alert_rules"("accountId");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_sources" ADD CONSTRAINT "review_sources_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "review_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
