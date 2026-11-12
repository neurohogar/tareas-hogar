import { expect, type Locator, type Page } from "@playwright/test";

export const ATKINSON = "Atkinson Hyperlegible Next";
export const NOTO = "Noto Color Emoji";

// ---------------------------------------------------------------------------
// Contrato observable: la fuente que informa el navegador para un nodo
// (CDP CSS.getPlatformFontsForNode). La fuente empaquetada es "personalizada";
// "la fuente del sistema" y "el emoji del dispositivo" no lo son.
// ---------------------------------------------------------------------------

export interface Plataforma {
  familyName: string;
  isCustomFont: boolean;
  glyphCount: number;
}
interface NodoCdp {
  nodeId: number;
  attributes?: string[];
  children?: NodoCdp[];
  shadowRoots?: NodoCdp[];
  contentDocument?: NodoCdp;
}

function buscarMarca(n: NodoCdp): NodoCdp | undefined {
  if (n.attributes?.includes("data-qa-sonda")) return n;
  for (const h of [
    ...(n.children ?? []),
    ...(n.shadowRoots ?? []),
    ...(n.contentDocument ? [n.contentDocument] : []),
  ]) {
    const r = buscarMarca(h);
    if (r !== undefined) return r;
  }
  return undefined;
}

function descendientes(n: NodoCdp): NodoCdp[] {
  return [
    n,
    ...[...(n.shadowRoots ?? []), ...(n.children ?? [])].flatMap(descendientes),
  ];
}

export async function plataforma(
  page: Page,
  l: Locator,
): Promise<Plataforma[]> {
  await l.first().evaluate((e) => e.setAttribute("data-qa-sonda", ""));
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = (await cdp.send("DOM.getDocument", {
      depth: -1,
      pierce: true,
    })) as { root: NodoCdp };
    const marcado = buscarMarca(root);
    if (marcado === undefined) throw new Error("nodo marcado no encontrado");
    // Un campo dibuja su texto en un nodo interno: se pregunta por él si el campo no informa fuentes.
    for (const n of descendientes(marcado)) {
      const r = (await cdp.send("CSS.getPlatformFontsForNode", {
        nodeId: n.nodeId,
      })) as { fonts: Plataforma[] };
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

export const esAtkinson = (f: Plataforma) =>
  f.familyName.startsWith(ATKINSON) && f.isCustomFont;
export const esNoto = (f: Plataforma) =>
  f.familyName.startsWith(NOTO) && f.isCustomFont;
export const esOtra = (f: Plataforma) => !esAtkinson(f) && !esNoto(f);

export const glifos = (fs: Plataforma[], p: (f: Plataforma) => boolean) =>
  fs.filter(p).reduce((s, f) => s + f.glyphCount, 0);

/** El nodo se dibuja solo con Atkinson (con al menos un glifo). */
export const conAtkinson = (page: Page, l: Locator) =>
  repartoEs(page, l, ([a, n, o]) => a > 0 && n === 0 && o === 0);

/** El nodo se dibuja solo con Noto (el juego empaquetado). */
export const conNoto = (page: Page, l: Locator) =>
  repartoEs(page, l, ([a, n, o]) => a === 0 && n > 0 && o === 0);

/** Reparto de glifos del nodo: [Atkinson, Noto, otras]. */
export async function reparto(
  page: Page,
  l: Locator,
): Promise<[number, number, number]> {
  const fs = await plataforma(page, l);
  return [glifos(fs, esAtkinson), glifos(fs, esNoto), glifos(fs, esOtra)];
}

export async function repartoEs(
  page: Page,
  l: Locator,
  cond: (r: [number, number, number]) => boolean,
) {
  await expect
    .poll(async () => {
      // Si la grilla se vuelve a dibujar entre marcar el nodo y leerlo, la marca se pierde: se reintenta.
      const r = await plataforma(page, l).catch((e: Error) => e.message);
      if (typeof r === "string") return r;
      return cond([glifos(r, esAtkinson), glifos(r, esNoto), glifos(r, esOtra)])
        ? "ok"
        : JSON.stringify(r);
    })
    .toBe("ok");
}
