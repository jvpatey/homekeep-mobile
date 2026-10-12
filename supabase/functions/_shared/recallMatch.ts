/**
 * Pure matching between equipment rows and product recalls. Each source
 * (CPSC in the US, Health Canada) is adapted into a RecallCandidate so one
 * set of manufacturer / model / name rules applies to both. No I/O so it can
 * be tested in isolation.
 */

export type RecallSource = "cpsc" | "health_canada";
export type RecallCountry = "US" | "CA";

export interface CpscNamed {
  Name?: string | null;
}

export interface CpscProduct {
  Name?: string | null;
  Description?: string | null;
  Model?: string | null;
  Type?: string | null;
}

/** saferproducts.gov RestWebServices/Recall record. */
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

export interface RecallCandidate {
  source: RecallSource;
  recallNumber: string;
  title: string;
  url: string | null;
  hazard: string | null;
  remedy: string | null;
  recallDate: string | null;
  /** Companies named on the recall (manufacturer, importer, distributor). */
  companies: string[];
  /** Text where a brand mention also identifies the maker ("Kenmore" sold by Electrolux). */
  brandTexts: string[];
  /** With no companies or brand text, trust the upstream maker filter (CPSC queries by maker). */
  trustMakerWhenUnlisted: boolean;
  /** Fields that list model numbers. */
  modelFields: string[];
  /** Prose that may mention a model number. */
  freeTexts: string[];
  /** Product names used for name-only matches. */
  productNames: string[];
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
  "canada",
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
/** "DeLonghi" vs "De'Longhi": only compare run-together words for longer names. */
const MIN_COMPACT_MAKER_LENGTH = 5;

function words(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
 * Map a stored profile country (ISO code or name) to the recall source's
 * country. Blank means the address was never set; those homes keep the
 * original US (CPSC) behaviour. Any other country gets no recall scan.
 */
export function recallCountry(
  value: string | null | undefined
): RecallCountry | null {
  const key = words(value).join(" ");
  if (!key) return "US";
  if (key === "ca" || key === "can" || key === "canada") return "CA";
  if (
    key === "us" ||
    key === "usa" ||
    key === "u s" ||
    key === "u s a" ||
    key === "united states" ||
    key === "united states of america"
  ) {
    return "US";
  }
  return null;
}

/**
 * Split a model field ("WTW5000DW1, WTW5005* and MVW6200") into
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

/** Pre-split text for repeated maker checks (see mentionsMakerInWords). */
export function searchWords(text: string | null | undefined): string[] {
  return words(text);
}

/** Does the pre-split text mention the normalized maker as whole words? */
export function mentionsMakerInWords(textWords: string[], maker: string): boolean {
  if (!maker) return false;
  if (` ${textWords.join(" ")} `.includes(` ${maker} `)) return true;
  const compact = maker.replace(/ /g, "");
  if (compact.length < MIN_COMPACT_MAKER_LENGTH) return false;
  return textWords.some(
    (word, index) =>
      word === compact || word + (textWords[index + 1] ?? "") === compact
  );
}

export function mentionsMaker(
  text: string | null | undefined,
  maker: string
): boolean {
  return mentionsMakerInWords(words(text), maker);
}

function manufacturerMatches(
  equipmentMaker: string,
  candidate: RecallCandidate
): boolean {
  const makers = candidate.companies
    .map((name) => normalizeManufacturer(name))
    .filter(Boolean);
  const listed = makers.some(
    (maker) =>
      maker === equipmentMaker ||
      ` ${maker} `.includes(` ${equipmentMaker} `) ||
      ` ${equipmentMaker} `.includes(` ${maker} `)
  );
  if (listed) return true;
  if (candidate.brandTexts.some((text) => mentionsMaker(text, equipmentMaker))) {
    return true;
  }
  return (
    makers.length === 0 &&
    candidate.brandTexts.length === 0 &&
    candidate.trustMakerWhenUnlisted
  );
}

function modelMatches(model: string, candidate: RecallCandidate): boolean {
  if (model.length < MIN_MODEL_LENGTH) return false;
  for (const field of candidate.modelFields) {
    for (const token of modelTokens(field)) {
      if (token === model) return true;
      // Recalls often list a series ("WTW5000") that covers full model
      // numbers with color/revision suffixes ("WTW5000DW1").
      if (token.length >= MIN_PREFIX_LENGTH && model.startsWith(token)) {
        return true;
      }
    }
  }
  // Some recalls only mention models in a description or the title.
  const freeText = candidate.freeTexts
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

function nameMatches(tokens: string[], candidate: RecallCandidate): boolean {
  if (tokens.length < 2) return false;
  const haystacks = [...candidate.productNames, candidate.title].map(
    (text) => new Set(words(text))
  );
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
  candidate: RecallCandidate
): RecallMatch | null {
  if (!candidate.recallNumber) return null;
  const maker = normalizeManufacturer(equipment.manufacturer);
  if (!maker) return null;
  if (!manufacturerMatches(maker, candidate)) return null;

  const model = normalizeModel(equipment.model_number);
  if (model) {
    return modelMatches(model, candidate) ? { matchedOn: "model" } : null;
  }

  return nameMatches(nameTokens(equipment, maker), candidate)
    ? { matchedOn: "name" }
    : null;
}

function joinNames(entries: CpscNamed[] | null | undefined): string | null {
  const names = (entries ?? [])
    .map((entry) => entry?.Name?.trim())
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join(" ") : null;
}

function isoDay(value: string | null | undefined): string | null {
  const day = value?.slice(0, 10) ?? null;
  return day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

export function fromCpsc(recall: CpscRecall): RecallCandidate | null {
  const recallNumber = recall.RecallNumber?.trim();
  if (!recallNumber) return null;
  const products = recall.Products ?? [];
  return {
    source: "cpsc",
    recallNumber,
    title: recall.Title?.trim() || `CPSC recall ${recallNumber}`,
    url: recall.URL?.trim() || null,
    hazard: joinNames(recall.Hazards),
    remedy: joinNames(recall.Remedies),
    recallDate: isoDay(recall.RecallDate),
    companies: [
      ...(recall.Manufacturers ?? []),
      ...(recall.Importers ?? []),
      ...(recall.Distributors ?? []),
    ]
      .map((entry) => entry?.Name ?? "")
      .filter(Boolean),
    brandTexts: [],
    trustMakerWhenUnlisted: true,
    modelFields: products.map((product) => product.Model ?? ""),
    freeTexts: [
      ...products.map((product) => product.Description ?? ""),
      recall.Title ?? "",
    ],
    productNames: products.map((product) => product.Name ?? ""),
  };
}

export interface RecallFields {
  source: RecallSource;
  recall_number: string;
  title: string;
  url: string | null;
  hazard: string | null;
  remedy: string | null;
  recall_date: string | null;
}

export function recallFields(candidate: RecallCandidate): RecallFields {
  return {
    source: candidate.source,
    recall_number: candidate.recallNumber,
    title: candidate.title,
    url: candidate.url,
    hazard: candidate.hazard,
    remedy: candidate.remedy,
    recall_date: candidate.recallDate,
  };
}
