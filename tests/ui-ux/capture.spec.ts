import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  seedSceneEmpty,
  seedSceneNormal,
  seedSceneOverdue,
} from './scenes.ts';

const ROUND = process.env.RONDA || '0';
const OUT_DIR = join(process.cwd(), 'tmp/ui-ux', `ronda-${ROUND}`);

mkdirSync(OUT_DIR, { recursive: true });

interface Variant {
  name: string;
  viewport: { width: number; height: number };
  hasTouch: boolean;
  theme: 'light' | 'dark';
}

const VARIANTS: Variant[] = [
  { name: 'mobile-light', viewport: { width: 360, height: 640 }, hasTouch: true, theme: 'light' },
  { name: 'mobile-dark', viewport: { width: 360, height: 640 }, hasTouch: true, theme: 'dark' },
  { name: 'desktop-light', viewport: { width: 1280, height: 800 }, hasTouch: false, theme: 'light' },
  { name: 'desktop-dark', viewport: { width: 1280, height: 800 }, hasTouch: false, theme: 'dark' },
];

const SCENES = [
  { id: '1-vacia', seed: seedSceneEmpty },
  { id: '2-normal', seed: seedSceneNormal },
  { id: '3-atrasadas', seed: seedSceneOverdue },
];

test.describe.serial('Capturas del Piloto UI/UX', () => {
  for (const scene of SCENES) {
    for (const variant of VARIANTS) {
      test(`${scene.id} en ${variant.name}`, async ({ page }) => {
        await page.setViewportSize(variant.viewport);
        await page.emulateMedia({ colorScheme: variant.theme });

        // Sembrar el estado específico (deja la app en / con login y reloj simulado)
        await scene.seed(page);

        // Esperar a que la tipografía y el renderizado estén listos
        await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        // Breve pausa para asentar animaciones/transiciones
        await page.waitForTimeout(300);

        const captureId = `${scene.id}_${variant.name}`;
        const pngPath = join(OUT_DIR, `${captureId}.png`);
        const axePath = join(OUT_DIR, `${captureId}.axe.json`);
        const ariaPath = join(OUT_DIR, `${captureId}.aria.yml`);

        // 1. Captura visual
        await page.screenshot({ path: pngPath, fullPage: false });

        // 2. Reporte de accesibilidad WCAG 2.2 AA (axe-core)
        const axeResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
          .analyze();
        writeFileSync(axePath, JSON.stringify(axeResults.violations, null, 2));

        // 3. Aria snapshot para asegurar estabilidad semántica
        const aria = await page.locator('body').ariaSnapshot();
        writeFileSync(ariaPath, aria);

        console.log(`[Ronda ${ROUND}] Captura guardada: ${captureId} (violaciones axe: ${axeResults.violations.length})`);
      });
    }
  }
});
