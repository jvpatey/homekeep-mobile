import { format } from "date-fns";
import { HomeSummaryReportData, HomeSummaryTaskGroup } from "../types/homeSummary";
import { formatHomeSummaryHistoryMeta } from "../utils/groupHomeSummaryTasks";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PRIMARY = "#2EC4B6";
const ACCENT = "#FF9F1C";
const TEXT = "#222222";
const TEXT_SECONDARY = "#4A4A4A";
const BORDER = "#E0E0E0";

export interface HomeSummaryReportHtmlOptions {
  logoDataUri?: string | null;
}

function completionLine(completion: HomeSummaryTaskGroup["completions"][number]): string {
  const who = completion.completedByLabel
    ? ` · ${completion.completedByLabel}`
    : "";
  return `${completion.completedDateLabel}${who}`;
}

function renderCompletionsCell(group: HomeSummaryTaskGroup): string {
  if (group.completions.length === 1) {
    const completion = group.completions[0];
    const notesBlock = completion.notes
      ? `<div class="notes">${escapeHtml(completion.notes)}</div>`
      : "";
    return `${escapeHtml(completionLine(completion))}${notesBlock}`;
  }

  return `<ul class="completion-list">${group.completions
    .map((completion) => {
      const notesBlock = completion.notes
        ? `<div class="notes">${escapeHtml(completion.notes)}</div>`
        : "";
      return `<li class="completion-item">${escapeHtml(completionLine(completion))}${notesBlock}</li>`;
    })
    .join("")}</ul>`;
}

export function buildHomeSummaryReportHtml(
  data: HomeSummaryReportData,
  options?: HomeSummaryReportHtmlOptions
): string {
  const generatedLabel = format(data.generatedAt, "MMMM d, yyyy");
  const ownerBlock = data.ownerName
    ? `<p class="meta">Prepared for ${escapeHtml(data.ownerName)}</p>`
    : "";

  const logoImg = options?.logoDataUri
    ? `<img class="brand-logo" src="${options.logoDataUri}" alt="" />`
    : "";

  const brandRow = `<div class="brand-row">${logoImg}<span class="brand-wordmark"><span class="brand-home">Home</span><span class="brand-keep">Keep</span></span></div>`;

  const addressBlock = data.hasAddress
    ? `<div class="address">${data.addressLines
        .map((line) => `<div>${escapeHtml(line)}</div>`)
        .join("")}</div>`
    : `<p class="empty">No home address on file.</p>`;

  const equipmentRows =
    data.equipment.length > 0
      ? data.equipment
          .map((item) => {
            const attachments: string[] = [];
            if (item.hasManual) attachments.push("Manual");
            if (item.hasReceipt) attachments.push("Receipt");
            const attachmentNote =
              attachments.length > 0
                ? `<span class="muted"> (${attachments.join(", ")} on file)</span>`
                : "";
            return `<tr>
              <td>${escapeHtml(item.name)}</td>
              <td>${escapeHtml(item.modelNumber ?? "—")}</td>
              <td>${escapeHtml(item.purchaseDateLabel ?? "—")}${attachmentNote}</td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="3" class="empty-cell">No equipment recorded.</td></tr>`;

  const taskRows =
    data.taskGroups.length > 0
      ? data.taskGroups
          .map(
            (group) => `<tr>
              <td>${escapeHtml(group.title)}</td>
              <td>${escapeHtml(group.category)}</td>
              <td>${renderCompletionsCell(group)}</td>
            </tr>`
          )
          .join("")
      : `<tr><td colspan="3" class="empty-cell">No completed maintenance yet.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Home Maintenance Summary</title>
  <style>
    @page {
      margin: 64pt 52pt 72pt 52pt;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      color: ${TEXT};
      font-size: 11pt;
      line-height: 1.5;
      margin: 0;
      padding: 0 0 16pt 0;
    }
    .header {
      margin-bottom: 32pt;
      border-bottom: 2pt solid ${PRIMARY};
      padding-bottom: 18pt;
      text-align: left;
      width: 100%;
    }
    .brand-row {
      margin: 0 0 14pt 0;
      padding: 0;
      text-align: left;
      line-height: 1.2;
    }
    .brand-logo {
      display: inline-block;
      vertical-align: middle;
      width: 20pt;
      height: 20pt;
      margin: 0 4pt 0 0;
      padding: 0;
      object-fit: contain;
      object-position: left center;
    }
    .brand-wordmark {
      display: inline-block;
      vertical-align: middle;
      margin: 0;
      padding: 0;
      font-size: 16pt;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1.1;
    }
    .brand-home { color: ${TEXT}; }
    .brand-keep { color: ${ACCENT}; }
    h1 {
      font-size: 22pt;
      font-weight: 700;
      margin: 0 0 10pt;
      color: ${TEXT};
    }
    .meta {
      margin: 0 0 4pt;
      color: ${TEXT_SECONDARY};
      font-size: 10pt;
    }
    section {
      margin-bottom: 28pt;
      page-break-inside: avoid;
    }
    h2 {
      font-size: 13pt;
      font-weight: 600;
      margin: 0 0 10pt;
      color: ${TEXT};
    }
    .section-meta {
      font-size: 9pt;
      color: ${TEXT_SECONDARY};
      margin: -2pt 0 12pt;
    }
    .address div { margin-bottom: 3pt; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin-top: 4pt;
    }
    th, td {
      border: 1px solid ${BORDER};
      padding: 9pt 12pt;
      text-align: left;
      vertical-align: top;
    }
    th { background: #f4f7f8; font-weight: 600; }
    tr { page-break-inside: avoid; }
    .empty, .empty-cell {
      color: ${TEXT_SECONDARY};
      font-style: italic;
    }
    .notes {
      margin-top: 5pt;
      font-size: 9pt;
      color: ${TEXT_SECONDARY};
    }
    .completion-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .completion-item {
      margin-bottom: 6pt;
    }
    .completion-item:last-child {
      margin-bottom: 0;
    }
    .muted {
      font-size: 9pt;
      color: ${TEXT_SECONDARY};
      font-style: normal;
    }
    .footer {
      margin-top: 32pt;
      padding-top: 14pt;
      border-top: 1px solid ${BORDER};
      font-size: 8pt;
      line-height: 1.45;
      color: ${TEXT_SECONDARY};
    }
    .footer-brand-home { color: ${TEXT}; font-weight: 600; }
    .footer-brand-keep { color: ${ACCENT}; font-weight: 600; }
  </style>
</head>
<body>
  <header class="header">
    ${brandRow}
    <h1>Home Maintenance Summary</h1>
    <p class="meta">Generated ${escapeHtml(generatedLabel)}</p>
    ${ownerBlock}
  </header>

  <section>
    <h2>Property</h2>
    ${addressBlock}
  </section>

  <section>
    <h2>Equipment</h2>
    <p class="section-meta">${data.equipment.length} item${data.equipment.length === 1 ? "" : "s"}</p>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Model</th>
          <th>Purchase date</th>
        </tr>
      </thead>
      <tbody>${equipmentRows}</tbody>
    </table>
  </section>

  <section>
    <h2>Maintenance history</h2>
    <p class="section-meta">${formatHomeSummaryHistoryMeta(data.taskGroups)}</p>
    <table>
      <thead>
        <tr>
          <th>Task</th>
          <th>Category</th>
          <th>Completed</th>
        </tr>
      </thead>
      <tbody>${taskRows}</tbody>
    </table>
  </section>

  <footer class="footer">
    This document is an informational record generated from data you entered in
    <span class="footer-brand-home">Home</span><span class="footer-brand-keep">Keep</span>.
    Verify details independently for legal, insurance, or warranty purposes.
  </footer>
</body>
</html>`;
}
