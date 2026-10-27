ALTER TABLE "bookings" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "fare_rules" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "partner_applications" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
-- "Bikes & Scooters" splits into Bike and Scooter. Existing rows become "bike";
-- the bike fare rule is copied to "scooter" so scooter fares keep showing until the owner changes them.
UPDATE "bookings" SET "category" = 'bike' WHERE "category" = 'bikes-scooters';--> statement-breakpoint
UPDATE "partner_applications" SET "category" = 'bike' WHERE "category" = 'bikes-scooters';--> statement-breakpoint
UPDATE "vehicles" SET "category" = 'bike' WHERE "category" = 'bikes-scooters';--> statement-breakpoint
UPDATE "fare_rules" SET "category" = 'bike' WHERE "category" = 'bikes-scooters';--> statement-breakpoint
INSERT INTO "fare_rules" ("city", "category", "base_fare", "per_km", "per_minute", "minimum_fare", "booking_fee", "active")
  SELECT "city", 'scooter', "base_fare", "per_km", "per_minute", "minimum_fare", "booking_fee", "active" FROM "fare_rules" WHERE "category" = 'bike';--> statement-breakpoint
DROP TYPE "public"."category";--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('cars', 'auto-rickshaw', 'bike', 'scooter');--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";--> statement-breakpoint
ALTER TABLE "fare_rules" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";--> statement-breakpoint
ALTER TABLE "partner_applications" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";