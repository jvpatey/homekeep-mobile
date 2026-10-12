import { supabase, supabaseProjectUrl } from "../lib/supabase";
import { ServiceResponse } from "../types/maintenance";
import { logServiceFailure } from "../utils/serviceError";

export interface CalendarFeedLinks {
  /** For Google Calendar's "From URL" and anywhere that wants plain https. */
  httpsUrl: string;
  /** Opens the system "Subscribe to calendar" flow on iOS and macOS. */
  webcalUrl: string;
}

function linksFor(token: string): CalendarFeedLinks {
  const httpsUrl = `${supabaseProjectUrl}/functions/v1/calendar-feed?token=${token}`;
  return { httpsUrl, webcalUrl: httpsUrl.replace(/^https?:/, "webcal:") };
}

async function callTokenRpc(
  fn: "get_or_create_calendar_feed" | "rotate_calendar_feed"
): Promise<ServiceResponse<CalendarFeedLinks>> {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } };
  }
  const { data, error } = await supabase.rpc(fn);
  if (error || typeof data !== "string") {
    return {
      data: null,
      error: logServiceFailure(`Calendar feed (${fn}) failed:`, error ?? "No token"),
    };
  }
  return { data: linksFor(data), error: null };
}

export class CalendarFeedService {
  /** The current subscription link, created on first use. */
  static getFeed(): Promise<ServiceResponse<CalendarFeedLinks>> {
    return callTokenRpc("get_or_create_calendar_feed");
  }

  /** Revokes the old link (subscribed calendars stop updating) and returns a new one. */
  static rotateFeed(): Promise<ServiceResponse<CalendarFeedLinks>> {
    return callTokenRpc("rotate_calendar_feed");
  }
}
