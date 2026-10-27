import type { NextRequest } from "next/server";
import { handle, json, limit, parseBody, requireCaptain } from "@/server/http";
import { locationBody } from "@/server/schemas";
import { updateLocation } from "@/server/services/captains";

/** GPS fixes from the captain app, at most one every couple of seconds. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const { db, captain } = await requireCaptain(req);
    const fix = await parseBody(req, locationBody);
    limit(`location:${captain.id}`, 40, 60_000);
    await updateLocation(db, captain.id, fix);
    return json({ ok: true });
  });
}
