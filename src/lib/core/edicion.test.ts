import { describe, expect, it } from 'vitest';
import { datosDeTarea } from './datos-de-tarea';
import { editar } from './edicion';
import type { TareaPeriodica, TareaPuntual } from './tarea';

const CREADA = new Date(2026, 6, 1, 8, 0, 0);
const PUNTUAL: TareaPuntual = { id: 't1', titulo: 'Pagar', tipo: 'puntual', fechaLimite: new Date(2026, 6, 14), creadaEn: CREADA };
const RELATIVA: TareaPeriodica = {
	id: 't2',
	titulo: 'Regar',
	tipo: 'periodica',
	recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' },
	creadaEn: CREADA
};
const SEMANAL: TareaPeriodica = {
	id: 't3',
	titulo: 'Basura',
	tipo: 'periodica',
	recurrencia: { modo: 'calendario', diasSemana: ['martes', 'jueves'] },
	creadaEn: CREADA
};
const MENSUAL: TareaPeriodica = { ...SEMANAL, recurrencia: { modo: 'calendario', diasMes: [10, 31] } };

describe('datosDeTarea', () => {
	it('da los valores actuales de cada forma, como los carga el panel', () => {
		expect(datosDeTarea(PUNTUAL)).toStrictEqual({ forma: 'puntual', titulo: 'Pagar', fechaLimite: '2026-07-14' });
		expect(datosDeTarea({ ...PUNTUAL, fechaLimite: undefined })).toStrictEqual({ forma: 'puntual', titulo: 'Pagar' });
		expect(datosDeTarea(RELATIVA)).toStrictEqual({ forma: 'relativa', titulo: 'Regar', cada: 2, unidad: 'dias' });
		expect(datosDeTarea(SEMANAL)).toStrictEqual({
			forma: 'calendario',
			titulo: 'Basura',
			diasSemana: ['martes', 'jueves'],
			diasMes: []
		});
		expect(datosDeTarea(MENSUAL)).toStrictEqual({ forma: 'calendario', titulo: 'Basura', diasSemana: [], diasMes: [10, 31] });
	});
});

describe('datosDeTarea con emoji y nota', () => {
	it('los incluye cuando la tarea los tiene', () => {
		expect(datosDeTarea({ ...PUNTUAL, emoji: '🌱', nota: 'Usar guantes' })).toStrictEqual({
			forma: 'puntual',
			titulo: 'Pagar',
			emoji: '🌱',
			nota: 'Usar guantes',
			fechaLimite: '2026-07-14'
		});
		expect(datosDeTarea({ ...RELATIVA, emoji: '🌱' })).toMatchObject({ forma: 'relativa', emoji: '🌱' });
		expect(datosDeTarea({ ...SEMANAL, nota: 'x' })).toMatchObject({ forma: 'calendario', nota: 'x' });
		expect(datosDeTarea({ ...MENSUAL, nota: 'x' })).toMatchObject({ forma: 'calendario', nota: 'x' });
	});
});

describe('editar emoji y nota', () => {
	it('escribe solo el campo que cambió', () => {
		const conEmoji = { ...PUNTUAL, emoji: '🌱', nota: 'Usar guantes' };

		expect(editar(conEmoji, { ...datosDeTarea(conEmoji), emoji: '🔥' })).toStrictEqual({ ok: true, cambio: { emoji: '🔥' } });
		expect(editar(conEmoji, { ...datosDeTarea(conEmoji), nota: '  Ventilar ' })).toStrictEqual({ ok: true, cambio: { nota: 'Ventilar' } });
	});

	it('guardar el mismo emoji o la misma nota, aunque con espacios alrededor, no cambia nada', () => {
		const conEmoji = { ...PUNTUAL, emoji: '🌱', nota: 'Usar guantes' };

		expect(editar(conEmoji, { ...datosDeTarea(conEmoji), emoji: ' 🌱 ', nota: ' Usar guantes ' })).toStrictEqual({ ok: true, cambio: {} });
	});

	it('poner emoji y nota a una tarea que no los tenía los escribe', () => {
		expect(editar(PUNTUAL, { ...datosDeTarea(PUNTUAL), emoji: '👍🏽', nota: 'Hola' })).toStrictEqual({
			ok: true,
			cambio: { emoji: '👍🏽', nota: 'Hola' }
		});
	});

	it('vaciarlos o dejarlos en espacios los quita (null)', () => {
		const conEmoji = { ...PUNTUAL, emoji: '🌱', nota: 'Usar guantes' };

		expect(editar(conEmoji, { ...datosDeTarea(conEmoji), emoji: '   ', nota: '' })).toStrictEqual({
			ok: true,
			cambio: { emoji: null, nota: null }
		});
	});

	it('un emoji inválido rechaza la edición entera, también el título válido', () => {
		expect(editar(PUNTUAL, { ...datosDeTarea(PUNTUAL), titulo: 'Pagar la luz', emoji: '🌱🔥' })).toStrictEqual({
			ok: false,
			errores: { emoji: 'invalido' }
		});
	});
});

describe('editar', () => {
	it('guardar sin cambios no cambia ningún campo', () => {
		for (const tarea of [PUNTUAL, RELATIVA, SEMANAL, MENSUAL])
			expect(editar(tarea, datosDeTarea(tarea))).toStrictEqual({ ok: true, cambio: {} });
	});

	it('cambiar el título cambia solo el título, sin los espacios de los extremos', () => {
		expect(editar(RELATIVA, { ...datosDeTarea(RELATIVA), titulo: '  Regar plantas ' })).toStrictEqual({
			ok: true,
			cambio: { titulo: 'Regar plantas' }
		});
	});

	it('cambiar la fecha límite, quitarla o agregarla', () => {
		expect(editar(PUNTUAL, { forma: 'puntual', titulo: 'Pagar', fechaLimite: '2026-07-20' })).toStrictEqual({
			ok: true,
			cambio: { fechaLimite: new Date(2026, 6, 20) }
		});
		expect(editar(PUNTUAL, { forma: 'puntual', titulo: 'Pagar' })).toStrictEqual({ ok: true, cambio: { fechaLimite: null } });
		const sinLimite: TareaPuntual = { id: 't1', titulo: 'Pagar', tipo: 'puntual', creadaEn: CREADA };
		expect(editar(sinLimite, { forma: 'puntual', titulo: 'Pagar' })).toStrictEqual({ ok: true, cambio: {} });
		expect(editar(sinLimite, { forma: 'puntual', titulo: 'Pagar', fechaLimite: '2026-07-14' })).toStrictEqual({
			ok: true,
			cambio: { fechaLimite: new Date(2026, 6, 14) }
		});
	});

	it('la recurrencia se cambia entera, aunque cambie un solo subcampo', () => {
		expect(editar(RELATIVA, { forma: 'relativa', titulo: 'Regar', cada: 2, unidad: 'horas' })).toStrictEqual({
			ok: true,
			cambio: { recurrencia: { modo: 'relativo', cada: 2, unidad: 'horas' } }
		});
		expect(editar(RELATIVA, { forma: 'relativa', titulo: 'Regar', cada: 3, unidad: 'dias' })).toStrictEqual({
			ok: true,
			cambio: { recurrencia: { modo: 'relativo', cada: 3, unidad: 'dias' } }
		});
	});

	it('los días se comparan como conjunto: el orden en que se eligen no es un cambio', () => {
		const datos = { forma: 'calendario', titulo: 'Basura', diasSemana: ['jueves', 'martes'], diasMes: [] } as const;

		expect(editar(SEMANAL, { ...datos, diasSemana: [...datos.diasSemana] })).toStrictEqual({ ok: true, cambio: {} });
		expect(editar(MENSUAL, { forma: 'calendario', titulo: 'Basura', diasSemana: [], diasMes: [31, 10] })).toStrictEqual({
			ok: true,
			cambio: {}
		});
	});

	it('cambiar de semanal a mensual con los mismos números no es lo mismo', () => {
		expect(editar(SEMANAL, { forma: 'calendario', titulo: 'Basura', diasSemana: [], diasMes: [2, 4] })).toStrictEqual({
			ok: true,
			cambio: { recurrencia: { modo: 'calendario', diasMes: [2, 4] } }
		});
		expect(editar(SEMANAL, { forma: 'calendario', titulo: 'Basura', diasSemana: ['martes'], diasMes: [] })).toStrictEqual({
			ok: true,
			cambio: { recurrencia: { modo: 'calendario', diasSemana: ['martes'] } }
		});
	});

	it('pasar a puntual quita la recurrencia y escribe la fecha límite, aunque no tenga', () => {
		expect(editar(SEMANAL, { forma: 'puntual', titulo: 'Basura', fechaLimite: '2026-07-20' })).toStrictEqual({
			ok: true,
			cambio: { tipo: 'puntual', fechaLimite: new Date(2026, 6, 20), recurrencia: null }
		});
		expect(editar(SEMANAL, { forma: 'puntual', titulo: 'Basura' })).toStrictEqual({
			ok: true,
			cambio: { tipo: 'puntual', fechaLimite: null, recurrencia: null }
		});
	});

	it('pasar a periódica quita la fecha límite, la tuviera o no', () => {
		const relativa = { modo: 'relativo', cada: 2, unidad: 'dias' } as const;

		expect(editar(PUNTUAL, { forma: 'relativa', titulo: 'Pagar', cada: 2, unidad: 'dias' })).toStrictEqual({
			ok: true,
			cambio: { tipo: 'periodica', recurrencia: relativa, fechaLimite: null }
		});
		const sinLimite: TareaPuntual = { id: 't1', titulo: 'Pagar', tipo: 'puntual', creadaEn: CREADA };
		expect(editar(sinLimite, { forma: 'relativa', titulo: 'Pagar', cada: 2, unidad: 'dias' })).toStrictEqual({
			ok: true,
			cambio: { tipo: 'periodica', recurrencia: relativa, fechaLimite: null }
		});
	});

	it('con algún campo inválido la edición se rechaza entera, con los mismos errores que al crear', () => {
		expect(editar(PUNTUAL, { forma: 'puntual', titulo: 'Pagar la luz', fechaLimite: '2026-04-31' })).toStrictEqual({
			ok: false,
			errores: { fechaLimite: 'invalida' }
		});
		expect(editar(RELATIVA, { forma: 'relativa', titulo: '   ', cada: 0, unidad: 'dias' })).toStrictEqual({
			ok: false,
			errores: { titulo: 'vacio', cada: 'invalido' }
		});
		expect(editar(SEMANAL, { forma: 'calendario', titulo: 'Basura', diasSemana: [], diasMes: [] })).toStrictEqual({
			ok: false,
			errores: { dias: 'faltan' }
		});
	});
});

describe('editar una pausada (spec §5.8)', () => {
	const PAUSADA: TareaPeriodica = { ...RELATIVA, pausada: true };
	const AHORA = new Date(2026, 6, 15, 10, 0, 0);

	it('pasarla a puntual la reanuda: quita pausada y guarda reanudadaEn = ahora', () => {
		const resultado = editar(PAUSADA, { forma: 'puntual', titulo: 'Regar' }, AHORA);

		expect(resultado).toStrictEqual({
			ok: true,
			cambio: { tipo: 'puntual', fechaLimite: null, recurrencia: null, pausada: null, reanudadaEn: AHORA }
		});
	});

	it('editar otros campos, o el modo, la deja pausada', () => {
		expect(editar(PAUSADA, { forma: 'calendario', titulo: 'Regar plantas', diasSemana: ['jueves'], diasMes: [] }, AHORA)).toStrictEqual({
			ok: true,
			cambio: { titulo: 'Regar plantas', recurrencia: { modo: 'calendario', diasSemana: ['jueves'] } }
		});
	});

	it('pasar a puntual una que no está pausada no la reanuda', () => {
		expect(editar(RELATIVA, { forma: 'puntual', titulo: 'Regar' }, AHORA)).toStrictEqual({
			ok: true,
			cambio: { tipo: 'puntual', fechaLimite: null, recurrencia: null }
		});
	});
});

describe('editar el esfuerzo', () => {
	const CON_ESFUERZO: TareaPuntual = { ...PUNTUAL, esfuerzo: 'media' };

	it('elegir otro nivel entra en el cambio, y solo él', () => {
		expect(editar(CON_ESFUERZO, { ...datosDeTarea(CON_ESFUERZO), esfuerzo: 'rapida' })).toStrictEqual({
			ok: true,
			cambio: { esfuerzo: 'rapida' }
		});
	});

	it('poner uno a una tarea sin estimar entra en el cambio', () => {
		expect(editar(PUNTUAL, { ...datosDeTarea(PUNTUAL), esfuerzo: 'larga' })).toStrictEqual({ ok: true, cambio: { esfuerzo: 'larga' } });
	});

	it('elegir "Sin estimar" lo quita con null', () => {
		expect(editar(CON_ESFUERZO, { ...datosDeTarea(CON_ESFUERZO), esfuerzo: undefined })).toStrictEqual({
			ok: true,
			cambio: { esfuerzo: null }
		});
	});

	it('sin cambiarlo, no entra en el cambio', () => {
		expect(editar(CON_ESFUERZO, datosDeTarea(CON_ESFUERZO))).toStrictEqual({ ok: true, cambio: {} });
	});

	it('cambiar el tipo no lo toca', () => {
		const resultado = editar(CON_ESFUERZO, { forma: 'relativa', titulo: 'Pagar', esfuerzo: 'media', cada: 3, unidad: 'dias' });

		expect(resultado).toStrictEqual({
			ok: true,
			cambio: { tipo: 'periodica', fechaLimite: null, recurrencia: { modo: 'relativo', cada: 3, unidad: 'dias' } }
		});
	});
});
