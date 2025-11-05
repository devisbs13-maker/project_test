-- CreateTable
CREATE TABLE "FactionMember" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "factionId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
