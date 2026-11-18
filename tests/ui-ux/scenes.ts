import type { Page } from '@playwright/test';
import {
  cleanEmulators,
  enter,
  setClock,
  create,
} from '../../e2e/support.ts';

export const HOUR_PILOT = '2026-07-15T09:00:00';

/**
 * Scene 1: Empty list.
 * Signed-in user, with no task loaded.
 */
export async function seedSceneEmpty(page: Page): Promise<void> {
  await cleanEmulators();
  await enter(page);
  await setClock(page, HOUR_PILOT);
}

/**
 * Scene 2: Normal load for today.
 * 3 active tasks:
 * - A recurring task by interval (green/up to date).
 * - A recurring task with a narrow schedule that expires soon.
 * - A one-off task for today.
 */
export async function seedSceneNormal(page: Page): Promise<void> {
  await cleanEmulators();
  await enter(page);
  await setClock(page, HOUR_PILOT);

  // 1. Recurring task without a strict schedule
  await create(page, {
    title: 'Regar las plantas',
    kind: 'Intervalo',
    every: '2',
    unit: 'días',
    emoji: '🌱',
  });

  // 2. Task with a schedule for this morning
  await create(page, {
    title: 'Tomar infusión',
    kind: 'Intervalo',
    every: '1',
    unit: 'días',
    schedule: { from: '08:00', to: '10:00' },
    emoji: '🌿',
  });

  // 3. One-off task for today
  await create(page, {
    title: 'Pasear a Simón',
    kind: 'No se repite',
    date: '2026-07-15',
    emoji: '🐶',
  });
}

/**
 * Scene 3: Overload / Many overdue tasks.
 * Multiple pending tasks, several of them expired and with an overdue notice.
 * Tests visual stress and the hierarchy of alerts for people with ADHD.
 */
export async function seedSceneOverdue(page: Page): Promise<void> {
  await cleanEmulators();
  await enter(page);
  await setClock(page, HOUR_PILOT);

  // Task overdue by 2 days
  await create(page, {
    title: 'Hacer fuego para el asado',
    kind: 'No se repite',
    date: '2026-07-13',
    emoji: '🔥',
  });

  // Recurring task expired
  await create(page, {
    title: 'Barrer la vereda',
    kind: 'Intervalo',
    every: '1',
    unit: 'días',
    schedule: { from: '06:00', to: '08:00' },
    emoji: '🧹',
  });

  // One-off task overdue
  await create(page, {
    title: 'Llamar a la abuela',
    kind: 'No se repite',
    date: '2026-07-10',
    emoji: '❤️',
  });

  // Normal tasks in the same state to compare the contrast
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
