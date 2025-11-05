-- CreateTable
CREATE TABLE "Duel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "playerAId" TEXT NOT NULL,
    "playerBId" TEXT,
    "state" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Duel_playerAId_idx" ON "Duel"("playerAId");

-- CreateIndex
CREATE INDEX "Duel_playerBId_idx" ON "Duel"("playerBId");
