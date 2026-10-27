ALTER TABLE "bookings" ADD COLUMN "discount" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_share_token_unique" UNIQUE("share_token");