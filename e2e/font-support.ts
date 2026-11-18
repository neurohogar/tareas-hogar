import { expect, type Locator, type Page } from "@playwright/test";

export const ATKINSON = "Atkinson Hyperlegible Next";
export const NOTO = "Noto Color Emoji";

// ---------------------------------------------------------------------------
// Observable contract: the font the browser reports for a node
// (CDP CSS.getPlatformFontsForNode). The bundled font is "custom";
// "the system font" and "the device emoji" are not.
// ---------------------------------------------------------------------------

export interface Platform {
  familyName: string;
  isCustomFont: boolean;
  glyphCount: number;
}
interface NodeCdp {
  nodeId: number;
  attributes?: string[];
  children?: NodeCdp[];
  shadowRoots?: NodeCdp[];
  contentDocument?: NodeCdp;
}

function searchMark(n: NodeCdp): NodeCdp | undefined {
  if (n.attributes?.includes("data-qa-sonda")) return n;
  for (const h of [
    ...(n.children ?? []),
    ...(n.shadowRoots ?? []),
    ...(n.contentDocument ? [n.contentDocument] : []),
  ]) {
    const r = searchMark(h);
    if (r !== undefined) return r;
  }
  return undefined;
}

function descendants(n: NodeCdp): NodeCdp[] {
  return [
    n,
    ...[...(n.shadowRoots ?? []), ...(n.children ?? [])].flatMap(descendants),
  ];
}

export async function platform(
  page: Page,
  l: Locator,
): Promise<Platform[]> {
  await l.first().evaluate((e) => e.setAttribute("data-qa-sonda", ""));
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = (await cdp.send("DOM.getDocument", {
      depth: -1,
      pierce: true,
    })) as { root: NodeCdp };
    const marked = searchMark(root);
    if (marked === undefined) throw new Error("marked node not found");
    // A field draws its text in an inner node: it is queried instead if the field reports no fonts.
    for (const n of descendants(marked)) {
      const r = (await cdp.send("CSS.getPlatformFontsForNode", {
        nodeId: n.nodeId,
      })) as { fonts: Platform[] };
      if (r.fonts.length > 0) return r.fonts;
    }
    return [];
  } finally {
    await cdp.detach().catch(() => {});
    await l
      .first()
      .evaluate((e) => e.removeAttribute("data-qa-sonda"))
      .catch(() => {});
  }
}

export const isAtkinson = (f: Platform) =>
  f.familyName.startsWith(ATKINSON) && f.isCustomFont;
export const isNoto = (f: Platform) =>
  f.familyName.startsWith(NOTO) && f.isCustomFont;
export const isOther = (f: Platform) => !isAtkinson(f) && !isNoto(f);

export const glyphs = (fs: Platform[], p: (f: Platform) => boolean) =>
  fs.filter(p).reduce((s, f) => s + f.glyphCount, 0);

/** The node is drawn only with Atkinson (with at least one glyph). */
export const withAtkinson = (page: Page, l: Locator) =>
  distributionIs(page, l, ([a, n, o]) => a > 0 && n === 0 && o === 0);

/** The node is drawn only with Noto (the bundled set). */
export const withNoto = (page: Page, l: Locator) =>
  distributionIs(page, l, ([a, n, o]) => a === 0 && n > 0 && o === 0);

/** Glyph split of the node: [Atkinson, Noto, others]. */
export async function distribution(
  page: Page,
  l: Locator,
): Promise<[number, number, number]> {
  const fs = await platform(page, l);
  return [glyphs(fs, isAtkinson), glyphs(fs, isNoto), glyphs(fs, isOther)];
}

export async function distributionIs(
  page: Page,
  l: Locator,
  cond: (r: [number, number, number]) => boolean,
) {
  await expect
    .poll(async () => {
      // If the grid is redrawn between marking the node and reading it, the mark is lost: it retries.
      const r = await platform(page, l).catch((e: Error) => e.message);
      if (typeof r === "string") return r;
      return cond([glyphs(r, isAtkinson), glyphs(r, isNoto), glyphs(r, isOther)])
        ? "ok"
        : JSON.stringify(r);
    })
    .toBe("ok");
}
