/** Inline HouseMark SVG — same metrics as src/components/ui/HouseMark.tsx. */

const BAR_WIDTH = 0.22;
const GAP = 0.06;
const RADIUS = 0.08;
const HEIGHTS = [0.55, 0.85, 0.42] as const;

export function buildHouseMarkSvg(colors: {
  sage: string;
  copper: string;
  ink: string;
}): string {
  const size = 100;
  const barW = size * BAR_WIDTH;
  const gap = size * GAP;
  const radius = size * RADIUS;
  const heights = HEIGHTS.map((ratio) => size * ratio);
  const totalW = 3 * barW + 2 * gap;
  const maxH = Math.max(...heights);

  const rects = heights.map((height, index) => {
    const x = index * (barW + gap);
    const y = maxH - height;
    const fill = [colors.sage, colors.copper, colors.ink][index];
    return `<rect x="${x}" y="${y}" width="${barW}" height="${height}" rx="${radius}" fill="${fill}"/>`;
  });

  return `<svg class="brand-logo" viewBox="0 0 ${totalW} ${maxH}" width="20" height="20" aria-hidden="true" focusable="false">${rects.join("")}</svg>`;
}
