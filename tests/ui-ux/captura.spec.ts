import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  sembrarEscenaVacia,
  sembrarEscenaNormal,
  sembrarEscenaAtrasadas,
} from './escenas.ts';

const RONDA = process.env.RONDA || '0';
const OUT_DIR = join(process.cwd(), 'tmp/ui-ux', `ronda-${RONDA}`);

mkdirSync(OUT_DIR, { recursive: true });

interface Variante {
  nombre: string;
  viewport: { width: number; height: number };
  hasTouch: boolean;
  tema: 'light' | 'dark';
}

const VARIANTES: Variante[] = [
  { nombre: 'mobile-light', viewport: { width: 360, height: 640 }, hasTouch: true, tema: 'light' },
  { nombre: 'mobile-dark', viewport: { width: 360, height: 640 }, hasTouch: true, tema: 'dark' },
  { nombre: 'desktop-light', viewport: { width: 1280, height: 800 }, hasTouch: false, tema: 'light' },
  { nombre: 'desktop-dark', viewport: { width: 1280, height: 800 }, hasTouch: false, tema: 'dark' },
];

const ESCENAS = [
  { id: '1-vacia', sembrar: sembrarEscenaVacia },
  { id: '2-normal', sembrar: sembrarEscenaNormal },
  { id: '3-atrasadas', sembrar: sembrarEscenaAtrasadas },
];

test.describe.serial('Capturas del Piloto UI/UX', () => {
  for (const escena of ESCENAS) {
    for (const variante of VARIANTES) {
      test(`${escena.id} en ${variante.nombre}`, async ({ page }) => {
        await page.setViewportSize(variante.viewport);
        await page.emulateMedia({ colorScheme: variante.tema });

        // Sembrar el estado específico (deja la app en / con login y reloj simulado)
        await escena.sembrar(page);

        // Esperar a que la tipografía y el renderizado estén listos
        await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        // Breve pausa para asentar animaciones/transiciones
        await page.waitForTimeout(300);

        const capturaId = `${escena.id}_${variante.nombre}`;
        const pngPath = join(OUT_DIR, `${capturaId}.png`);
        const axePath = join(OUT_DIR, `${capturaId}.axe.json`);
        const ariaPath = join(OUT_DIR, `${capturaId}.aria.yml`);

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

        console.log(`[Ronda ${RONDA}] Captura guardada: ${capturaId} (violaciones axe: ${axeResults.violations.length})`);
      });
    }
  }
});
