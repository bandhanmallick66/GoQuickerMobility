CREATE TABLE "captain_locations" (
	"captain_id" uuid PRIMARY KEY NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"heading" double precision,
	"speed" double precision,
	"accuracy" double precision,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "captain_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"captain_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "captain_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "pickup_lat" double precision;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "pickup_lng" double precision;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "drop_lat" double precision;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "drop_lng" double precision;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "route_polyline" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "captains" ADD COLUMN "online" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "otp_challenges" ADD COLUMN "audience" text DEFAULT 'rider' NOT NULL;--> statement-breakpoint
ALTER TABLE "captain_locations" ADD CONSTRAINT "captain_locations_captain_id_captains_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."captains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captain_sessions" ADD CONSTRAINT "captain_sessions_captain_id_captains_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."captains"("id") ON DELETE cascade ON UPDATE no action;