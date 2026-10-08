/**
 * Pure matching between equipment rows and CPSC recalls
 * (saferproducts.gov RestWebServices/Recall). No I/O so it can be tested
 * in isolation.
 */

export interface CpscNamed {
  Name?: string | null;
}

export interface CpscProduct {
  Name?: string | null;
  Description?: string | null;
  Model?: string | null;
  Type?: string | null;
}

export interface CpscRecall {
  RecallID?: number;
  RecallNumber?: string | null;
  RecallDate?: string | null;
  Title?: string | null;
  Description?: string | null;
  URL?: string | null;
  LastPublishDate?: string | null;
  Products?: CpscProduct[] | null;
  Manufacturers?: CpscNamed[] | null;
  Importers?: CpscNamed[] | null;
  Distributors?: CpscNamed[] | null;
  Hazards?: CpscNamed[] | null;
  Remedies?: CpscNamed[] | null;
}

export interface RecallEquipment {
  id: string;
  name: string | null;
  manufacturer: string | null;
  model_number: string | null;
}

export type RecallMatchKind = "model" | "name";

export interface RecallMatch {
  matchedOn: RecallMatchKind;
}

const CORPORATE_SUFFIXES = new Set([
  "inc",
  "incorporated",
  "llc",
  "ltd",
  "limited",
  "corp",
  "corporation",
  "co",
  "company",
  "usa",
  "us",
  "na",
  "america",
  "americas",
  "group",
  "holdings",
  "international",
  "intl",
  "the",
]);

const NAME_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "our",
  "my",
  "main",
  "new",
  "old",
  "upstairs",
  "downstairs",
  "basement",
  "kitchen",
  "garage",
  "master",
  "guest",
  "front",
  "back",
  "left",
  "right",
]);

/** Model tokens shorter than this match too many unrelated products. */
const MIN_MODEL_LENGTH = 4;
/** Prefix (series) matches need a little more to go on. */
const MIN_PREFIX_LENGTH = 5;

function words(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);
}

/** "Whirlpool Corp." → "whirlpool"; used to group and compare makers. */
export function normalizeManufacturer(value: string | null | undefined): string {
  return words(value)
    .filter((word) => !CORPORATE_SUFFIXES.has(word))
    .join(" ");
}

/** "WTW-5000 DW/1" → "wtw5000dw1". */
export function normalizeModel(value: string | null | undefined): string {
  if (!value) return "";
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Split a CPSC model field ("WTW5000DW1, WTW5005* and MVW6200") into
 * normalized tokens. Only tokens with a digit count as model numbers.
 */
export function modelTokens(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;/|\n]+|\s+and\s+|\s+or\s+|\s{2,}/i)
    .flatMap((part) => {
      const joined = normalizeModel(part);
      const pieces = part
        .split(/\s+/)
        .map((piece) => normalizeModel(piece))
        .filter(Boolean);
      return [joined, ...pieces];
    })
    .filter(
      (token, index, all) =>
        token.length >= MIN_MODEL_LENGTH &&
        /\d/.test(token) &&
        all.indexOf(token) === index
    );
}

function makerNames(recall: CpscRecall): string[] {
  return [
    ...(recall.Manufacturers ?? []),
    ...(recall.Importers ?? []),
    ...(recall.Distributors ?? []),
  ]
    .map((entry) => normalizeManufacturer(entry?.Name))
    .filter(Boolean);
}

function manufacturerMatches(
  equipmentMaker: string,
  recall: CpscRecall
): boolean {
  const makers = makerNames(recall);
  // The API query already filtered by manufacturer; trust it when the
  // recall lists no companies.
  if (makers.length === 0) return true;
  return makers.some(
    (maker) =>
      maker === equipmentMaker ||
      ` ${maker} `.includes(` ${equipmentMaker} `) ||
      ` ${equipmentMaker} `.includes(` ${maker} `)
  );
}

function modelMatches(model: string, recall: CpscRecall): boolean {
  if (model.length < MIN_MODEL_LENGTH) return false;
  const products = recall.Products ?? [];
  for (const product of products) {
    for (const token of modelTokens(product.Model)) {
      if (token === model) return true;
      // CPSC often lists a series ("WTW5000") that covers full model
      // numbers with color/revision suffixes ("WTW5000DW1").
      if (token.length >= MIN_PREFIX_LENGTH && model.startsWith(token)) {
        return true;
      }
    }
  }
  // Some recalls only list models in the product description or title.
  const freeText = [
    ...products.map((product) => product.Description),
    recall.Title,
  ]
    .map((text) => ` ${words(text).join(" ")} `)
    .join(" ");
  return freeText.includes(` ${model} `);
}

function nameTokens(equipment: RecallEquipment, maker: string): string[] {
  const makerWords = new Set(maker.split(" "));
  return words(equipment.name).filter(
    (word) =>
      word.length >= 3 && !NAME_STOP_WORDS.has(word) && !makerWords.has(word)
  );
}

function nameMatches(tokens: string[], recall: CpscRecall): boolean {
  if (tokens.length < 2) return false;
  const haystacks = [
    ...(recall.Products ?? []).map((product) => product.Name),
    recall.Title,
  ].map((text) => new Set(words(text)));
  return haystacks.some((haystack) =>
    tokens.every(
      (token) =>
        haystack.has(token) ||
        haystack.has(`${token}s`) ||
        (token.endsWith("s") && haystack.has(token.slice(0, -1)))
    )
  );
}

/**
 * Model matches need the manufacturer to agree and a model token to match.
 * Name matches are only tried when the equipment has no model number, and
 * need every meaningful word of the equipment name in a product name.
 */
export function matchRecall(
  equipment: RecallEquipment,
  recall: CpscRecall
): RecallMatch | null {
  if (!recall.RecallNumber) return null;
  const maker = normalizeManufacturer(equipment.manufacturer);
  if (!maker) return null;
  if (!manufacturerMatches(maker, recall)) return null;

  const model = normalizeModel(equipment.model_number);
  if (model) {
    return modelMatches(model, recall) ? { matchedOn: "model" } : null;
  }

  return nameMatches(nameTokens(equipment, maker), recall)
    ? { matchedOn: "name" }
    : null;
}

function joinNames(entries: CpscNamed[] | null | undefined): string | null {
  const names = (entries ?? [])
    .map((entry) => entry?.Name?.trim())
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join(" ") : null;
}

export interface RecallFields {
  recall_number: string;
  title: string;
  url: string | null;
  hazard: string | null;
  remedy: string | null;
  recall_date: string | null;
}

export function recallFields(recall: CpscRecall): RecallFields | null {
  const recallNumber = recall.RecallNumber?.trim();
  if (!recallNumber) return null;
  const date = recall.RecallDate?.slice(0, 10) ?? null;
  return {
    recall_number: recallNumber,
    title: recall.Title?.trim() || `CPSC recall ${recallNumber}`,
    url: recall.URL?.trim() || null,
    hazard: joinNames(recall.Hazards),
    remedy: joinNames(recall.Remedies),
    recall_date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
  };
}
