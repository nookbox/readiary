CREATE TYPE "public"."reading_status" AS ENUM('want', 'reading', 'finished', 'paused', 'dropped');--> statement-breakpoint
ALTER TABLE "book_reports" DROP CONSTRAINT "book_reports_status_allowed";--> statement-breakpoint
UPDATE "book_reports" SET "status" = 'finished' WHERE "status" = 'done';--> statement-breakpoint
ALTER TABLE "book_reports" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "book_reports" ALTER COLUMN "status" SET DATA TYPE "public"."reading_status" USING "status"::"public"."reading_status";--> statement-breakpoint
ALTER TABLE "book_reports" ALTER COLUMN "status" SET DEFAULT 'want'::"public"."reading_status";
