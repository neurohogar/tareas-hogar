import { describe, expect, it } from 'vitest';
import { accionDeLaOpcion, cambioDeAccion, queHaceLaAccion, type AccionDelPanel } from './accion-del-panel';
import { avisoDeAccion, descartarYActuar, guardarYActuar, type AccionEnAviso } from './aviso-de-accion';
import { datosDeTarea, type DatosDeTarea } from './datos-de-tarea';
import type { Completado, Tarea } from './tarea';

const CREADA = new Date(2026, 6, 13, 8, 0, 0);
const AHORA = new Date(2026, 6, 15, 8, 0, 0);
const MAS_TARDE = new Date(2026, 6, 15, 8, 3, 0);
const REGAR: Tarea = { id: 'r', titulo: 'Regar', tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' }, creadaEn: CREADA };
const PAUSADA: Tarea = { ...REGAR, pausada: true } as Tarea;
const PAGAR: Tarea = { id: 'p', titulo: 'Pagar', tipo: 'puntual', creadaEn: CREADA };
const POSPUESTA: Tarea = { ...PAGAR, pospuesta: { desde: AHORA, hasta: new Date(2026, 6, 15, 9, 0, 0) } };
const A_PUNTUAL = (titulo: string): DatosDeTarea => ({ forma: 'puntual', titulo });

function enAviso(accion: AccionDelPanel, tarea: Tarea, cambios: Partial<AccionEnAviso> = {}): AccionEnAviso {
	return {
		accion,
		tareaAlAbrir: tarea,
		tarea,
		completados: [],
		ahora: AHORA,
		formulario: { datos: { ...datosDeTarea(tarea), titulo: `${tarea.titulo} nuevo` }, etiquetas: [], sinConfirmar: '' },
		existentes: [],
		...cambios
	};
}

const textos = (contexto: AccionEnAviso) => avisoDeAccion(contexto)?.botones.map(({ texto }) => texto);

describe('queHaceLaAccion (spec §6.2)', () => {
	const ACCIONES: AccionDelPanel[] = ['pausar', 'reanudar', 'posponer 1 hora', 'posponer 3 horas', 'posponer hasta mañana', 'quitar posponer'];

	it('sin cambios, cada acción actúa en el momento', () => {
		for (const accion of ACCIONES) expect(queHaceLaAccion(accion, false)).toBe('actúa');
	});

	it('con cambios, cada acción abre el aviso', () => {
		for (const accion of ACCIONES) expect(queHaceLaAccion(accion, true)).toBe('abre el aviso de acción');
	});

	it('Borrar tarea no suma el aviso: con o sin cambios, solo su confirmación', () => {
		expect(queHaceLaAccion('borrar tarea', true)).toBe('pide confirmar el borrado');
		expect(queHaceLaAccion('borrar tarea', false)).toBe('pide confirmar el borrado');
	});
});

describe('accionDeLaOpcion', () => {
	it('nombra la acción con la opción tocada', () => {
		expect(accionDeLaOpcion('1 hora')).toBe('posponer 1 hora');
		expect(accionDeLaOpcion('3 horas')).toBe('posponer 3 horas');
		expect(accionDeLaOpcion('hasta mañana')).toBe('posponer hasta mañana');
	});
});

describe('avisoDeAccion (spec §6.2)', () => {
	it('dice "Tenés cambios sin guardar" y ofrece los tres botones, con el efecto de cada uno', () => {
		expect(avisoDeAccion(enAviso('pausar', REGAR))).toEqual({
			mensaje: 'Tenés cambios sin guardar',
			botones: [
				{ texto: 'Seguir editando', efecto: 'seguir editando' },
				{ texto: 'Descartar y pausar', efecto: 'descartar' },
				{ texto: 'Guardar y pausar', efecto: 'guardar' }
			]
		});
	});

	it.each<[AccionDelPanel, Tarea]>([
		['reanudar', PAUSADA],
		['posponer 1 hora', PAGAR],
		['posponer 3 horas', PAGAR],
		['posponer hasta mañana', PAGAR],
		['quitar posponer', POSPUESTA]
	])('nombra la acción en sus botones: %s', (accion, tarea) => {
		expect(textos(enAviso(accion, tarea))).toEqual(['Seguir editando', `Descartar y ${accion}`, `Guardar y ${accion}`]);
	});

	describe('si lo guardado deja la acción sin sentido', () => {
		it('Pausar una tarea cambiada a No se repite: lo dice y no ofrece Guardar', () => {
			const aviso = avisoDeAccion(enAviso('pausar', REGAR, { formulario: { datos: A_PUNTUAL('Regar'), etiquetas: [], sinConfirmar: '' } }));
			expect(aviso).toEqual({
				mensaje: 'Con estos cambios la tarea ya no se puede pausar',
				botones: [
					{ texto: 'Seguir editando', efecto: 'seguir editando' },
					{ texto: 'Descartar y pausar', efecto: 'descartar' }
				]
			});
		});

		it('Reanudar una pausada cambiada a No se repite: guardar ya la reanuda', () => {
			const aviso = avisoDeAccion(enAviso('reanudar', PAUSADA, { formulario: { datos: A_PUNTUAL('Regar'), etiquetas: [], sinConfirmar: '' } }));
			expect(aviso?.mensaje).toBe('Con estos cambios la tarea ya no se puede reanudar');
			expect(aviso?.botones.map(({ texto }) => texto)).toEqual(['Seguir editando', 'Descartar y reanudar']);
		});

		it('Posponer una periódica con completados cambiada a No se repite: quedaría completada', () => {
			const completados: Completado[] = [{ id: 'c', tareaId: 'r', completadoEn: new Date(2026, 6, 12, 9, 0, 0) }];
			const aviso = avisoDeAccion(enAviso('posponer 1 hora', REGAR, { completados, formulario: { datos: A_PUNTUAL('Regar'), etiquetas: [], sinConfirmar: '' } }));
			expect(aviso?.mensaje).toBe('Con estos cambios la tarea ya no se puede posponer 1 hora');
			expect(aviso?.botones.map(({ texto }) => texto)).toEqual(['Seguir editando', 'Descartar y posponer 1 hora']);
		});

		it('la misma periódica, sin completados, se puede posponer como puntual', () => {
			expect(textos(enAviso('posponer 1 hora', REGAR, { formulario: { datos: A_PUNTUAL('Regar'), etiquetas: [], sinConfirmar: '' } }))).toContain('Guardar y posponer 1 hora');
		});
	});

	describe('si lo escrito es inválido no hay cómo evaluarlo: se ofrece Guardar', () => {
		it('por un campo', () => {
			const aviso = avisoDeAccion(enAviso('pausar', REGAR, { formulario: { datos: A_PUNTUAL(''), etiquetas: [], sinConfirmar: '' } }));
			expect(aviso?.mensaje).toBe('Tenés cambios sin guardar');
			expect(aviso?.botones.map(({ texto }) => texto)).toContain('Guardar y pausar');
		});

		it('por un texto sin confirmar inválido en Etiquetas', () => {
			const aviso = avisoDeAccion(enAviso('pausar', REGAR, { formulario: { datos: A_PUNTUAL('Regar'), etiquetas: [], sinConfirmar: 'abcdefghijklmnopqrstuvwxyz12345' } }));
			expect(aviso?.botones.map(({ texto }) => texto)).toContain('Guardar y pausar');
		});
	});

	describe('se mantiene al día con la tarea y el ahora del momento', () => {
		it('si otro dispositivo hace que la acción no corresponda, no hay aviso', () => {
			expect(avisoDeAccion(enAviso('pausar', REGAR, { tarea: PAUSADA }))).toBeUndefined();
			expect(avisoDeAccion(enAviso('reanudar', PAUSADA, { tarea: REGAR }))).toBeUndefined();
			expect(avisoDeAccion(enAviso('posponer 1 hora', PAGAR, { tarea: POSPUESTA }))).toBeUndefined();
		});

		it('si la posposición vence justo, Quitar posponer deja de corresponder', () => {
			const hasta = new Date(2026, 6, 15, 9, 0, 0);
			expect(avisoDeAccion(enAviso('quitar posponer', POSPUESTA, { ahora: new Date(hasta.getTime() - 1) }))).toBeDefined();
			expect(avisoDeAccion(enAviso('quitar posponer', POSPUESTA, { ahora: hasta }))).toBeUndefined();
		});

		it('lo guardado se evalúa sobre la tarea de ahora: una posposición remota sigue vigente', () => {
			const remota: Tarea = { ...REGAR, pospuesta: { desde: AHORA, hasta: new Date(2026, 6, 15, 9, 0, 0) } };
			expect(textos(enAviso('quitar posponer', REGAR, { tarea: remota }))).toContain('Guardar y quitar posponer');
		});

		it('Guardar puede aparecer con el tiempo: lo guardado vuelve a estar pendiente', () => {
			// Vence el 14; con cada 5 días estaría en espera hasta el 17 a las 9.
			const completados: Completado[] = [{ id: 'c', tareaId: 'r', completadoEn: new Date(2026, 6, 12, 9, 0, 0) }];
			const datos: DatosDeTarea = { forma: 'relativa', titulo: 'Regar', cada: 5, unidad: 'dias' };
			const contexto = enAviso('posponer 1 hora', REGAR, { completados, formulario: { datos, etiquetas: [], sinConfirmar: '' } });
			expect(textos(contexto)).toEqual(['Seguir editando', 'Descartar y posponer 1 hora']);
			expect(textos({ ...contexto, ahora: new Date(2026, 6, 17, 10, 0, 0) })).toContain('Guardar y posponer 1 hora');
		});
	});
});

describe('cambioDeAccion (spec §5.8, §5.9, §6.2): "ahora" es el momento de tocar el botón', () => {
	it('pausar, reanudar y quitar posponer', () => {
		expect(cambioDeAccion('pausar', MAS_TARDE)).toEqual({ pausada: true });
		expect(cambioDeAccion('reanudar', MAS_TARDE)).toEqual({ pausada: null, reanudadaEn: MAS_TARDE });
		expect(cambioDeAccion('quitar posponer', MAS_TARDE)).toEqual({ pospuesta: null });
	});

	it('posponer, con la opción tocada', () => {
		expect(cambioDeAccion('posponer 1 hora', MAS_TARDE)).toEqual({ pospuesta: { desde: MAS_TARDE, hasta: new Date(2026, 6, 15, 9, 3, 0) } });
		expect(cambioDeAccion('posponer 3 horas', MAS_TARDE)).toEqual({ pospuesta: { desde: MAS_TARDE, hasta: new Date(2026, 6, 15, 11, 3, 0) } });
		const medianoche = new Date(2026, 6, 16, 0, 1, 0);
		expect(cambioDeAccion('posponer hasta mañana', medianoche)).toEqual({ pospuesta: { desde: medianoche, hasta: new Date(2026, 6, 17, 7, 0, 0) } });
	});
});

describe('descartarYActuar (spec §6.2)', () => {
	it('actúa sobre la tarea como estaba, sin nada de lo escrito', () => {
		expect(descartarYActuar(enAviso('pausar', REGAR, { ahora: MAS_TARDE }))).toEqual({ pausada: true });
		expect(descartarYActuar(enAviso('posponer 1 hora', REGAR, { ahora: MAS_TARDE }))).toEqual({ pospuesta: { desde: MAS_TARDE, hasta: new Date(2026, 6, 15, 9, 3, 0) } });
	});

	it('también si lo guardado dejaría la acción sin sentido', () => {
		expect(descartarYActuar(enAviso('pausar', REGAR, { formulario: { datos: A_PUNTUAL('Regar'), etiquetas: [], sinConfirmar: '' } }))).toEqual({ pausada: true });
	});

	it('si la acción ya no corresponde, no actúa', () => {
		expect(descartarYActuar(enAviso('pausar', REGAR, { tarea: PAUSADA }))).toBeUndefined();
	});
});

describe('guardarYActuar (spec §6.2): se vuelve a evaluar al tocarlo', () => {
	const nuevoId = () => 'nueva';

	it('guarda y actúa en un solo cambio, con el ahora del toque', () => {
		const resultado = guardarYActuar(enAviso('posponer 1 hora', PAGAR, { ahora: MAS_TARDE }), nuevoId);
		expect(resultado).toEqual({
			resultado: 'guardado',
			cambio: { titulo: 'Pagar nuevo', pospuesta: { desde: MAS_TARDE, hasta: new Date(2026, 6, 15, 9, 3, 0) } },
			nuevas: []
		});
	});

	it('crea las etiquetas nuevas confirmadas', () => {
		const formulario = { datos: datosDeTarea(REGAR), etiquetas: ['casa'], sinConfirmar: 'sin crear' };
		const resultado = guardarYActuar(enAviso('pausar', REGAR, { formulario }), nuevoId);
		expect(resultado).toEqual({ resultado: 'guardado', cambio: { etiquetas: ['nueva'], pausada: true }, nuevas: [{ id: 'nueva', nombre: 'casa', color: 'gris' }] });
	});

	it('si Guardar falla por validación, no se ejecuta nada', () => {
		const contexto = enAviso('pausar', REGAR, { formulario: { datos: A_PUNTUAL(''), etiquetas: [], sinConfirmar: '' } });
		expect(guardarYActuar(contexto, nuevoId)).toEqual({ resultado: 'rechazado', errores: { titulo: 'vacio' } });
	});

	it('si la acción quedó sin sentido, no guarda ni actúa y el aviso queda actualizado', () => {
		const contexto = enAviso('pausar', REGAR, { formulario: { datos: A_PUNTUAL('Regar'), etiquetas: [], sinConfirmar: '' } });
		expect(guardarYActuar(contexto, nuevoId)).toEqual({ resultado: 'aviso actualizado', aviso: avisoDeAccion(contexto) });
	});

	it('si la acción ya no corresponde, no guarda ni actúa y el aviso se cierra', () => {
		expect(guardarYActuar(enAviso('pausar', REGAR, { tarea: PAUSADA }), nuevoId)).toEqual({ resultado: 'aviso cerrado' });
	});

	it('mide lo escrito contra la tarea al abrir: no pisa lo que otro dispositivo cambió', () => {
		const remota: Tarea = { ...REGAR, nota: 'Remota' };
		const resultado = guardarYActuar(enAviso('pausar', REGAR, { tarea: remota }), nuevoId);
		expect(resultado).toEqual({ resultado: 'guardado', cambio: { titulo: 'Regar nuevo', pausada: true }, nuevas: [] });
	});
});
