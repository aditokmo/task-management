-- CreateEnum
CREATE TYPE "public"."BoardInviteStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('board_invite', 'board_invite_accepted');

-- AlterTable
ALTER TABLE "public"."BoardMember"
ADD COLUMN "invitedById" TEXT,
ADD COLUMN "status" "public"."BoardInviteStatus" NOT NULL DEFAULT 'accepted',
ADD COLUMN "respondedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "boardId" TEXT,
    "boardMemberId" TEXT,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardMember_userId_status_idx" ON "public"."BoardMember"("userId", "status");

-- CreateIndex
CREATE INDEX "BoardMember_invitedById_idx" ON "public"."BoardMember"("invitedById");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "public"."Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_boardMemberId_idx" ON "public"."Notification"("boardMemberId");

-- AddForeignKey
ALTER TABLE "public"."BoardMember" ADD CONSTRAINT "BoardMember_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "public"."Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_boardMemberId_fkey" FOREIGN KEY ("boardMemberId") REFERENCES "public"."BoardMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
