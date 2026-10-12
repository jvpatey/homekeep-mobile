/**
 * Health Canada consumer product recalls (recalls-rappels.canada.ca).
 *
 * The open-data feed is one daily JSON file without manufacturer or model
 * fields, so candidates are picked by brand from the feed and their detail
 * pages are parsed for the recall number, companies, and product
 * description (where model numbers live). Parsing is pure for testing.
 */
import type { RecallCandidate } from "./recallMatch.ts";

export const HEALTH_CANADA_FEED_URL =
  "https://recalls-rappels.canada.ca/sites/default/files/opendata-donneesouvertes/HCRSAMOpenData.json";

export interface HealthCanadaFeedItem {
  NID?: string | null;
  Title?: string | null;
  URL?: string | null;
  Organization?: string | null;
  Product?: string | null;
  Issue?: string | null;
  "What you should do"?: string | null;
  Category?: string | null;
  "Last updated"?: string | null;
  Archived?: string | null;
}

/** Parsed detail page; cached in health_canada_recall_details. */
export interface HealthCanadaDetail {
  nid: string;
  last_updated: string | null;
  recall_number: string;
  recall_date: string | null;
  hazard: string | null;
  remedy: string | null;
  /** "Affected products" + "Product description" text, where models are listed. */
  product_text: string | null;
  companies: string[];
}

const MAX_FIELD_LENGTH = 600;
/** Model lists can run long; keep enough of the product text to match against. */
const MAX_PRODUCT_TEXT_LENGTH = 12_000;

// Pages come in two layouts: older ones label fields "Issue:", newer ones
// "Issue" (no colon) and add Brand(s) / Details / Published by blocks.
const SECTION_HEADINGS = new Set([
  "summary",
  "affected products",
  "product description",
  "hazard identified",
  "issue",
  "number sold",
  "time period sold",
  "place of origin",
  "details",
  "companies",
  "published by",
  "audience",
  "identification number",
  "what you should do",
  "images",
  "previous next",
  "get notified",
  "date modified",
]);

const COMPANY_ROLES =
  /^(manufacturer|distributor|importer|retailer|recalling firm|recalling company)$/i;

export function isConsumerProduct(item: HealthCanadaFeedItem): boolean {
  return item.Organization?.trim() === "Consumer product safety";
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&reg;|&copy;|&trade;/g, "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/** Strip tags, keeping block boundaries as line breaks. */
export function htmlToLines(html: string): string[] {
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  const text = decodeEntities(
    main
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, "")
      .replace(/<(br|\/p|\/tr|\/li|\/h\d|\/div|\/dt|\/dd|\/td|\/th)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  );
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function labelKey(line: string): string {
  return line.toLowerCase().replace(/:$/, "").trim();
}

function isHeading(line: string): boolean {
  const key = labelKey(line);
  return SECTION_HEADINGS.has(key) || key.startsWith("images (");
}

function clip(
  value: string | null | undefined,
  max = MAX_FIELD_LENGTH
): string | null {
  const text = value?.replace(/[ \t]+/g, " ").trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Value on the line after a label line ("Issue:" or "Issue"); the page
 * renders them separately. Searches the first occurrence at or after `from`.
 */
function labelValue(lines: string[], label: string, from = 0): string | null {
  for (let i = Math.max(0, from); i < lines.length - 1; i++) {
    if (labelKey(lines[i]) === label) {
      const next = lines[i + 1];
      return next && !isHeading(next) && !next.endsWith(":") ? next : null;
    }
  }
  return null;
}

/** Lines between `heading` and the next section heading. */
function section(lines: string[], heading: string, from = 0): string[] {
  const start = lines.findIndex(
    (line, index) => index >= from && labelKey(line) === heading
  );
  if (start < 0) return [];
  const out: string[] = [];
  for (let i = start + 1; i < lines.length && !isHeading(lines[i]); i++) {
    out.push(lines[i]);
  }
  return out;
}

function parseDisplayDate(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const ms = Date.parse(`${value} 12:00 UTC`);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString().slice(0, 10);
}

/** First couple of sentences of the feed's HTML "What you should do". */
function feedRemedy(item: HealthCanadaFeedItem): string | null {
  const text = decodeEntities(
    (item["What you should do"] ?? "").replace(/<[^>]+>/g, " ")
  );
  const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=\.)\s+/);
  return clip(sentences.slice(0, 2).join(" "));
}

export function parseHealthCanadaDetail(
  html: string,
  item: HealthCanadaFeedItem
): HealthCanadaDetail {
  const nid = String(item.NID ?? "").trim();
  const lines = htmlToLines(html);
  const indexOf = (label: string, from = 0) =>
    lines.findIndex((line, index) => index >= from && labelKey(line) === label);

  const summaryIndex = Math.max(0, indexOf("summary"));
  const descriptionIndex = indexOf("product description");
  // "Affected products" also appears in the summary tabs; the real section
  // is the last one before "Product description" (or the page end).
  let affectedStart = -1;
  const affectedLimit = descriptionIndex < 0 ? lines.length : descriptionIndex;
  for (let i = 0; i < affectedLimit; i++) {
    if (labelKey(lines[i]) === "affected products") affectedStart = i;
  }
  const affected =
    affectedStart >= 0 ? section(lines, "affected products", affectedStart) : [];
  const description = section(lines, "product description");

  const companies: string[] = [];
  const companyLines = section(lines, "companies");
  companyLines.forEach((line, index) => {
    const name = companyLines[index + 1];
    if (COMPANY_ROLES.test(line) && name && !COMPANY_ROLES.test(name)) {
      companies.push(name);
    }
  });
  // Newer pages list brands up top ("Brand(s)" → "Samsung").
  const brandsIndex = indexOf("brand(s)");
  if (brandsIndex >= 0) {
    for (let i = brandsIndex + 1; i < lines.length; i++) {
      if (isHeading(lines[i]) || labelKey(lines[i]) === "last updated") break;
      companies.push(...lines[i].split(/,\s*/).filter(Boolean));
    }
  }

  // Older pages: summary "Issue:" is a sentence and details sit under
  // "Hazard identified". Newer pages: summary "Issue" is a category and the
  // sentence is the "Issue" section after the affected products.
  const hazardSection = section(lines, "hazard identified")[0] ?? null;
  const issueSection =
    affectedStart >= 0 ? section(lines, "issue", affectedStart)[0] ?? null : null;
  const summaryIssue = labelValue(lines, "issue", summaryIndex);
  const usefulSummaryIssue =
    summaryIssue && !/^consumer products\s*-/i.test(summaryIssue)
      ? summaryIssue
      : null;

  const publishedInline = lines
    .map((line) => line.match(/^original published date:\s*(\d{4}-\d{2}-\d{2})/i)?.[1])
    .find(Boolean) ?? null;

  return {
    nid,
    last_updated: item["Last updated"]?.trim() || null,
    recall_number:
      labelValue(lines, "identification number")?.match(/^[A-Z]{1,4}-?\d+$/i)?.[0] ??
      `HC-${nid}`,
    recall_date:
      parseDisplayDate(labelValue(lines, "posting date")) ??
      parseDisplayDate(labelValue(lines, "starting date")) ??
      publishedInline ??
      parseDisplayDate(item["Last updated"] ?? null),
    hazard: clip(hazardSection ?? issueSection ?? usefulSummaryIssue ?? item.Issue),
    remedy: clip(labelValue(lines, "what to do", summaryIndex)) ?? feedRemedy(item),
    product_text: clip(
      [...affected, ...description].join("\n"),
      MAX_PRODUCT_TEXT_LENGTH
    ),
    companies: [...new Set(companies.map((name) => name.trim()).filter(Boolean))],
  };
}

export function fromHealthCanada(
  item: HealthCanadaFeedItem,
  detail: HealthCanadaDetail
): RecallCandidate {
  const title = item.Title?.replace(/\s+/g, " ").trim() || "Health Canada recall";
  const product = item.Product?.trim() ?? "";
  return {
    source: "health_canada",
    recallNumber: detail.recall_number,
    title,
    url: item.URL?.trim() || null,
    hazard: detail.hazard,
    remedy: detail.remedy,
    recallDate: detail.recall_date,
    companies: detail.companies,
    brandTexts: [title, product, item["What you should do"] ?? ""],
    trustMakerWhenUnlisted: false,
    modelFields: [detail.product_text ?? ""],
    freeTexts: [title, product],
    productNames: [product],
  };
}

/** Text used to pre-filter feed items by brand before fetching detail pages. */
export function feedSearchText(item: HealthCanadaFeedItem): string {
  return [item.Title, item.Product, item["What you should do"]]
    .filter(Boolean)
    .join(" ");
}
