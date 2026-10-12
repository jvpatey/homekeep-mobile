import { format } from "date-fns";
import { YearInReview } from "../utils/yearInReview";
import { formatMoney } from "../utils/formatMoney";
import { buildHouseMarkSvg } from "../utils/houseMarkSvg";

export interface YearInReviewReportData {
  review: YearInReview;
  currency: string;
  homeLabel: string | null;
  generatedAt: Date;
}

const PRIMARY = "#C45C26";
const SAGE = "#2F5D50";
const TEXT = "#1A1612";
const TEXT_SECONDARY = "#6B645C";
const BORDER = "#E5DDD2";
const SURFACE = "#F4EFE6";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stat(value: string, label: string): string {
  return `<div class="stat"><div class="stat-value">${escapeHtml(value)}</div><div class="stat-label">${escapeHtml(label)}</div></div>`;
}

function rankList(title: string, items: { label: string; count: number }[]): string {
  if (items.length === 0) return "";
  return `<section>
    <h2>${escapeHtml(title)}</h2>
    <ol class="rank">${items
      .map(
        (item) =>
          `<li><span>${escapeHtml(item.label)}</span><span class="muted">${item.count} ${item.count === 1 ? "job" : "jobs"}</span></li>`
      )
      .join("")}</ol>
  </section>`;
}

function monthChart(counts: number[]): string {
  const max = Math.max(1, ...counts);
  const bars = counts
    .map((count, i) => {
      const height = Math.round((count / max) * 80);
      return `<div class="bar-col"><div class="bar" style="height:${Math.max(height, count > 0 ? 4 : 1)}pt"></div><div class="bar-label">${MONTHS[i]}</div></div>`;
    })
    .join("");
  return `<section><h2>Month by month</h2><div class="chart">${bars}</div></section>`;
}

export function buildYearInReviewHtml(data: YearInReviewReportData): string {
  const { review, currency } = data;
  const money = (n: number) => formatMoney(n, currency, { whole: true });

  const stats = [
    stat(String(review.jobsDone), review.jobsDone === 1 ? "job done" : "jobs done"),
    review.onTimeRate !== null
      ? stat(`${Math.round(review.onTimeRate * 100)}%`, "on time")
      : "",
    review.estimatedHours > 0
      ? stat(`${review.estimatedHours}h`, "of upkeep")
      : "",
    review.spend ? stat(money(review.spend.total), "spent") : "",
    review.repairsLogged > 0
      ? stat(String(review.repairsLogged), review.repairsLogged === 1 ? "repair" : "repairs")
      : "",
  ].join("");

  const spendSection = review.spend
    ? `<section>
    <h2>Spend</h2>
    <p>${escapeHtml(money(review.spend.total))} across ${review.spend.count} ${review.spend.count === 1 ? "job" : "jobs"}.</p>
    <p class="muted">DIY ${escapeHtml(money(review.spend.diyTotal))} · Hired ${escapeHtml(money(review.spend.hiredTotal))}${
      review.spend.repairTotal > 0
        ? ` · Repairs ${escapeHtml(money(review.spend.repairTotal))}`
        : ""
    }</p>
  </section>`
    : "";

  const contributors =
    review.contributors.length > 1
      ? rankList(
          "Who pitched in",
          review.contributors.map((c) => ({ label: c.name, count: c.count }))
        )
      : "";

  const bookends =
    review.firstJob && review.lastJob
      ? `<section>
    <h2>Bookends</h2>
    <p>First job: ${escapeHtml(review.firstJob.title)} <span class="muted">· ${escapeHtml(format(review.firstJob.date, "MMM d"))}</span></p>
    <p>Last job: ${escapeHtml(review.lastJob.title)} <span class="muted">· ${escapeHtml(format(review.lastJob.date, "MMM d"))}</span></p>
  </section>`
      : "";

  const brandMark = buildHouseMarkSvg({ sage: SAGE, copper: PRIMARY, ink: TEXT });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${review.year} Year in Review</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      color: ${TEXT};
      font-size: 11pt;
      line-height: 1.5;
      margin: 0;
    }
    .header { border-bottom: 2pt solid ${PRIMARY}; padding-bottom: 16pt; margin-bottom: 24pt; }
    .brand-row { margin-bottom: 12pt; line-height: 1.2; }
    .brand-logo { display: inline-block; vertical-align: middle; width: 20pt; height: 20pt; margin-right: 6pt; }
    .brand-wordmark { display: inline-block; vertical-align: middle; font-size: 16pt; font-weight: 800; letter-spacing: -0.04em; }
    .brand-keep { color: ${PRIMARY}; }
    h1 { font-size: 26pt; margin: 0 0 6pt; }
    h2 { font-size: 13pt; font-weight: 600; margin: 0 0 8pt; }
    p { margin: 0 0 4pt; }
    .muted { color: ${TEXT_SECONDARY}; }
    section { margin-bottom: 22pt; page-break-inside: avoid; }
    .stats { display: flex; flex-wrap: wrap; gap: 10pt; margin-bottom: 24pt; }
    .stat { flex: 1 1 110pt; background: ${SURFACE}; border: 1pt solid ${BORDER}; border-radius: 10pt; padding: 12pt; }
    .stat-value { font-size: 22pt; font-weight: 700; color: ${PRIMARY}; line-height: 1.1; }
    .stat-label { font-size: 10pt; color: ${TEXT_SECONDARY}; }
    .rank { margin: 0; padding-left: 16pt; }
    .rank li { margin-bottom: 4pt; }
    .rank li span:first-child { margin-right: 8pt; }
    .chart { display: flex; align-items: flex-end; gap: 6pt; height: 100pt; border-bottom: 1pt solid ${BORDER}; padding-bottom: 2pt; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
    .bar { width: 100%; background: ${SAGE}; border-radius: 3pt 3pt 0 0; }
    .bar-label { font-size: 8pt; color: ${TEXT_SECONDARY}; margin-top: 3pt; }
    .footer { margin-top: 28pt; font-size: 9pt; color: ${TEXT_SECONDARY}; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-row">${brandMark}<span class="brand-wordmark"><span>Home</span><span class="brand-keep">Keep</span></span></div>
    <h1>${review.year} Year in Review</h1>
    ${data.homeLabel ? `<p class="muted">${escapeHtml(data.homeLabel)}</p>` : ""}
  </div>
  <div class="stats">${stats}</div>
  ${monthChart(review.monthCounts)}
  ${rankList("Where the work went", review.topZones)}
  ${rankList("Top categories", review.topCategories)}
  ${spendSection}
  ${contributors}
  ${bookends}
  <p class="footer">Generated ${escapeHtml(format(data.generatedAt, "MMMM d, yyyy"))} with HomeKeep.</p>
</body>
</html>`;
}
