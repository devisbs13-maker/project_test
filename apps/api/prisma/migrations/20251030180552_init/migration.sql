-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "energy" INTEGER NOT NULL DEFAULT 100
);

-- CreateTable
CREATE TABLE "WeeklyScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "weekKey" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Clan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "bank" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ClanMember" (
    "userId" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "clanId")
);

-- CreateIndex
CREATE INDEX "WeeklyScore_weekKey_score_idx" ON "WeeklyScore"("weekKey", "score");

-- CreateIndex
CREATE UNIQUE INDEX "Clan_tag_key" ON "Clan"("tag");
