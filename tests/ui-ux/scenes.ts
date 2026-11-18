import type { Page } from '@playwright/test';
import {
  cleanEmulators,
  enter,
  setClock,
  create,
} from '../../e2e/support.ts';

export const HOUR_PILOT = '2026-07-15T09:00:00';

/**
 * Escena 1: Lista vacía.
 * Usuario con sesión iniciada, sin ninguna tarea cargada.
 */
export async function seedSceneEmpty(page: Page): Promise<void> {
  await cleanEmulators();
  await enter(page);
  await setClock(page, HOUR_PILOT);
}

/**
 * Escena 2: Carga normal para hoy.
 * 3 tareas activas:
 * - Una periódica por intervalo (verde/al día).
 * - Una periódica con horario acotado que vence en breve.
 * - Una tarea puntual para hoy.
 */
export async function seedSceneNormal(page: Page): Promise<void> {
  await cleanEmulators();
  await enter(page);
  await setClock(page, HOUR_PILOT);

  // 1. Tarea periódica sin horario estricto
  await create(page, {
    title: 'Regar las plantas',
    kind: 'Intervalo',
    every: '2',
    unit: 'días',
    emoji: '🌱',
  });

  // 2. Tarea con horario para hoy por la mañana
  await create(page, {
    title: 'Tomar infusión',
    kind: 'Intervalo',
    every: '1',
    unit: 'días',
    schedule: { from: '08:00', to: '10:00' },
    emoji: '🌿',
  });

  // 3. Tarea puntual para hoy
  await create(page, {
    title: 'Pasear a Simón',
    kind: 'No se repite',
    date: '2026-07-15',
    emoji: '🐶',
  });
}

/**
 * Escena 3: Sobrecarga / Muchas tareas atrasadas.
 * Múltiples tareas pendientes, varias de ellas vencidas y con aviso de atraso.
 * Prueba el estrés visual y la jerarquía de alertas para personas con TDAH.
 */
export async function seedSceneOverdue(page: Page): Promise<void> {
  await cleanEmulators();
  await enter(page);
  await setClock(page, HOUR_PILOT);

  // Tarea atrasada hace 2 días
  await create(page, {
    title: 'Hacer fuego para el asado',
    kind: 'No se repite',
    date: '2026-07-13',
    emoji: '🔥',
  });

  // Tarea periódica vencida
  await create(page, {
    title: 'Barrer la vereda',
    kind: 'Intervalo',
    every: '1',
    unit: 'días',
    schedule: { from: '06:00', to: '08:00' },
    emoji: '🧹',
  });

  // Tarea atrasada puntual
  await create(page, {
    title: 'Llamar a la abuela',
    kind: 'No se repite',
    date: '2026-07-10',
    emoji: '❤️',
  });

  // Tareas normales en el mismo estado para ver el contraste
  await create(page, {
    title: 'Cuidar el huerto',
    kind: 'Intervalo',
    every: '3',
    unit: 'días',
    emoji: '🌱',
  });

  await create(page, {
    title: 'Jugar con el perro',
    kind: 'Intervalo',
    every: '1',
    unit: 'días',
    emoji: '🐶',
  });
}
