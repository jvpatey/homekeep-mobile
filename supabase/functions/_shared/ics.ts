/** Minimal RFC 5545 writer for all-day events. */

export interface IcsAllDayEvent {
  uid: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  summary: string;
  description?: string;
}

export interface IcsCalendar {
  name: string;
  events: IcsAllDayEvent[];
  /** Hint for clients that honor it (Apple, Outlook). */
  refreshMinutes?: number;
}

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

const encoder = new TextEncoder();

/** Fold at 75 octets without splitting a UTF-8 sequence; continuation lines start with a space. */
export function foldIcsLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function compactDate(date: string): string {
  return date.replace(/-/g, "");
}

function nextDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildIcsCalendar(calendar: IcsCalendar, now = new Date()): string {
  const stamp = utcStamp(now);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HomeKeep//Maintenance Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendar.name)}`,
  ];
  if (calendar.refreshMinutes) {
    lines.push(`REFRESH-INTERVAL;VALUE=DURATION:PT${calendar.refreshMinutes}M`);
    lines.push(`X-PUBLISHED-TTL:PT${calendar.refreshMinutes}M`);
  }
  for (const event of calendar.events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
      `DTEND;VALUE=DATE:${compactDate(nextDate(event.date))}`,
      `SUMMARY:${escapeIcsText(event.summary)}`,
    );
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }
    lines.push("TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}
