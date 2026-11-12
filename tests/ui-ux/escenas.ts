import type { Page } from '@playwright/test';
import {
  limpiarEmuladores,
  entrar,
  fijarReloj,
  crear,
} from '../../e2e/apoyo.ts';

export const HORA_PILOTO = '2026-07-15T09:00:00';

/**
 * Escena 1: Lista vacía.
 * Usuario con sesión iniciada, sin ninguna tarea cargada.
 */
export async function sembrarEscenaVacia(page: Page): Promise<void> {
  await limpiarEmuladores();
  await entrar(page);
  await fijarReloj(page, HORA_PILOTO);
}

/**
 * Escena 2: Carga normal para hoy.
 * 3 tareas activas:
 * - Una periódica por intervalo (verde/al día).
 * - Una periódica con horario acotado que vence en breve.
 * - Una tarea puntual para hoy.
 */
export async function sembrarEscenaNormal(page: Page): Promise<void> {
  await limpiarEmuladores();
  await entrar(page);
  await fijarReloj(page, HORA_PILOTO);

  // 1. Tarea periódica sin horario estricto
  await crear(page, {
    titulo: 'Regar las plantas',
    tipo: 'Intervalo',
    cada: '2',
    unidad: 'días',
    emoji: '🌱',
  });

  // 2. Tarea con horario para hoy por la mañana
  await crear(page, {
    titulo: 'Tomar infusión',
    tipo: 'Intervalo',
    cada: '1',
    unidad: 'días',
    horario: { desde: '08:00', hasta: '10:00' },
    emoji: '🌿',
  });

  // 3. Tarea puntual para hoy
  await crear(page, {
    titulo: 'Pasear a Simón',
    tipo: 'No se repite',
    fecha: '2026-07-15',
    emoji: '🐶',
  });
}

/**
 * Escena 3: Sobrecarga / Muchas tareas atrasadas.
 * Múltiples tareas pendientes, varias de ellas vencidas y con aviso de atraso.
 * Prueba el estrés visual y la jerarquía de alertas para personas con TDAH.
 */
export async function sembrarEscenaAtrasadas(page: Page): Promise<void> {
  await limpiarEmuladores();
  await entrar(page);
  await fijarReloj(page, HORA_PILOTO);

  // Tarea atrasada hace 2 días
  await crear(page, {
    titulo: 'Hacer fuego para el asado',
    tipo: 'No se repite',
    fecha: '2026-07-13',
    emoji: '🔥',
  });

  // Tarea periódica vencida
  await crear(page, {
    titulo: 'Barrer la vereda',
    tipo: 'Intervalo',
    cada: '1',
    unidad: 'días',
    horario: { desde: '06:00', hasta: '08:00' },
    emoji: '🧹',
  });

  // Tarea atrasada puntual
  await crear(page, {
    titulo: 'Llamar a la abuela',
    tipo: 'No se repite',
    fecha: '2026-07-10',
    emoji: '❤️',
  });

  // Tareas normales en el mismo estado para ver el contraste
  await crear(page, {
    titulo: 'Cuidar el huerto',
    tipo: 'Intervalo',
    cada: '3',
    unidad: 'días',
    emoji: '🌱',
  });

  await crear(page, {
    titulo: 'Jugar con el perro',
    tipo: 'Intervalo',
    cada: '1',
    unidad: 'días',
    emoji: '🐶',
  });
}
