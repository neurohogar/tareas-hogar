import { describe, expect, it } from 'vitest';
import { aplicarCambio, aplicarCambiosDeReferencias, tareaDesdeDocumento, type DocumentoDeTarea } from './documento-de-tarea';
import type { Recurrencia } from './tarea';

const CREADA = new Date(2026, 6, 1, 8, 0, 0);
const RELATIVA = { modo: 'relativo', cada: 2, unidad: 'dias' } as const;
const LIMITE = new Date(2026, 6, 14);

const PUNTUAL: DocumentoDeTarea = { id: 't1', titulo: 'Pagar', tipo: 'puntual', fechaLimite: LIMITE, creadaEn: CREADA };
const PERIODICA: DocumentoDeTarea = { id: 't2', titulo: 'Regar', tipo: 'periodica', recurrencia: RELATIVA, creadaEn: CREADA };

describe('tareaDesdeDocumento', () => {
	it('una puntual conserva su fecha límite e ignora una recurrencia que no le corresponde', () => {
		expect(tareaDesdeDocumento({ ...PUNTUAL, recurrencia: RELATIVA })).toStrictEqual(PUNTUAL);
	});

	it('una puntual sin fecha límite queda sin el campo', () => {
		const { fechaLimite: _, ...sinLimite } = PUNTUAL;

		expect(tareaDesdeDocumento(sinLimite)).toStrictEqual(sinLimite);
	});

	it('una periódica conserva su recurrencia e ignora una fecha límite que no le corresponde', () => {
		expect(tareaDesdeDocumento({ ...PERIODICA, fechaLimite: LIMITE })).toStrictEqual(PERIODICA);
	});

	it('las dos formas conservan su emoji y su nota', () => {
		const campos = { emoji: '🌱', nota: 'Usar guantes' };

		expect(tareaDesdeDocumento({ ...PUNTUAL, ...campos })).toStrictEqual({ ...PUNTUAL, ...campos });
		expect(tareaDesdeDocumento({ ...PERIODICA, ...campos })).toStrictEqual({ ...PERIODICA, ...campos });
	});

	it('las dos formas conservan sus etiquetas', () => {
		expect(tareaDesdeDocumento({ ...PUNTUAL, etiquetas: ['e1'] })).toStrictEqual({ ...PUNTUAL, etiquetas: ['e1'] });
		expect(tareaDesdeDocumento({ ...PERIODICA, etiquetas: ['e1', 'e2'] })).toStrictEqual({ ...PERIODICA, etiquetas: ['e1', 'e2'] });
	});

	it('una periódica sin recurrencia viola el modelo', () => {
		const { recurrencia: _, ...sinRecurrencia } = PERIODICA;

		expect(() => tareaDesdeDocumento(sinRecurrencia)).toThrow();
	});
});

describe('aplicarCambio', () => {
	it('escribe solo los campos del cambio y deja los demás', () => {
		const [editado] = aplicarCambio([PUNTUAL], 't1', { titulo: 'Pagar la luz' });

		expect(editado).toStrictEqual({ ...PUNTUAL, titulo: 'Pagar la luz' });
	});

	it('un campo en null se quita del documento', () => {
		const [editado] = aplicarCambio([PUNTUAL], 't1', { tipo: 'periodica', recurrencia: RELATIVA, fechaLimite: null });

		expect(editado).toStrictEqual({ id: 't1', titulo: 'Pagar', tipo: 'periodica', recurrencia: RELATIVA, creadaEn: CREADA });
	});

	it('la recurrencia se reemplaza entera, sin mezclar subcampos', () => {
		const semanal: Recurrencia = { modo: 'calendario', diasSemana: ['martes'] };
		const [editado] = aplicarCambio([PERIODICA], 't2', { recurrencia: semanal });

		expect(editado.recurrencia).toStrictEqual(semanal);
	});

	it('solo cambia el documento de esa tarea', () => {
		expect(aplicarCambio([PUNTUAL, PERIODICA], 't2', { titulo: 'Otro' })[0]).toBe(PUNTUAL);
	});

	it('gana el borrado: un cambio sobre una tarea que no existe no la crea', () => {
		expect(aplicarCambio([PUNTUAL], 'borrada', { titulo: 'Revivida' })).toStrictEqual([PUNTUAL]);
	});

	it('no modifica el documento original', () => {
		aplicarCambio([PUNTUAL], 't1', { titulo: 'Otro', fechaLimite: null });

		expect(PUNTUAL).toStrictEqual({ id: 't1', titulo: 'Pagar', tipo: 'puntual', fechaLimite: LIMITE, creadaEn: CREADA });
	});
});

describe('aplicarCambio con emoji y nota', () => {
	it('escribe el emoji y la nota, y null los quita', () => {
		const conCampos = aplicarCambio([PUNTUAL], 't1', { emoji: '🌱', nota: 'Hola' });

		expect(conCampos[0]).toStrictEqual({ ...PUNTUAL, emoji: '🌱', nota: 'Hola' });
		expect(aplicarCambio(conCampos, 't1', { emoji: null, nota: null })[0]).toStrictEqual(PUNTUAL);
	});

	it('un cambio de nota no toca el emoji', () => {
		expect(aplicarCambio([{ ...PUNTUAL, emoji: '🌱' }], 't1', { nota: 'Hola' })[0]).toStrictEqual({ ...PUNTUAL, emoji: '🌱', nota: 'Hola' });
	});
});

describe('aplicarCambio con etiquetas', () => {
	it('el campo etiquetas se reemplaza entero: gana el último cambio, sin unir', () => {
		const conCocina = aplicarCambio([{ ...PUNTUAL, etiquetas: ['cocina'] }], 't1', { etiquetas: ['cocina', 'bano'] });
		const [editado] = aplicarCambio(conCocina, 't1', { etiquetas: ['cocina', 'patio'] });

		expect(editado.etiquetas).toStrictEqual(['cocina', 'patio']);
	});
});

describe('aplicarCambiosDeReferencias', () => {
	it('quita las etiquetas nombradas de las tareas nombradas y deja sus otras etiquetas', () => {
		const pagar = { ...PUNTUAL, etiquetas: ['bano', 'cocina'] };
		const regar = { ...PERIODICA, etiquetas: ['cocina'] };
		const quitarCocina = (tareaId: string) => ({ tareaId, quitar: ['cocina'], poner: [] });

		expect(aplicarCambiosDeReferencias([pagar, regar], [quitarCocina('t1'), quitarCocina('t2')])).toStrictEqual([
			{ ...pagar, etiquetas: ['bano'] },
			{ ...regar, etiquetas: [] }
		]);
	});

	it('pone al final las que no estaban, sin repetir', () => {
		const pagar = { ...PUNTUAL, etiquetas: ['b', 'c', 'a'] };

		expect(aplicarCambiosDeReferencias([pagar], [{ tareaId: 't1', quitar: ['b'], poner: ['a', 'd'] }])).toStrictEqual([
			{ ...pagar, etiquetas: ['c', 'a', 'd'] }
		]);
	});

	it('no toca las tareas no nombradas, aunque tengan la etiqueta', () => {
		const regar = { ...PERIODICA, etiquetas: ['cocina'] };

		expect(aplicarCambiosDeReferencias([regar], [{ tareaId: 't1', quitar: ['cocina'], poner: [] }])).toStrictEqual([regar]);
	});

	it('una tarea que ya no existe se saltea', () => {
		expect(aplicarCambiosDeReferencias([PUNTUAL], [{ tareaId: 'borrada', quitar: [], poner: ['a'] }])).toStrictEqual([PUNTUAL]);
	});

	it('aplica en orden varios cambios a la misma tarea', () => {
		const pagar = { ...PUNTUAL, etiquetas: ['a'] };
		const cambios = [
			{ tareaId: 't1', quitar: ['a'], poner: ['b'] },
			{ tareaId: 't1', quitar: ['b'], poner: ['c'] }
		];

		expect(aplicarCambiosDeReferencias([pagar], cambios)).toStrictEqual([{ ...pagar, etiquetas: ['c'] }]);
	});
});

describe('tareaDesdeDocumento y aplicarCambio con pausa (spec §5.8, §7)', () => {
	const REANUDADA = new Date(2026, 6, 15, 10, 0, 0);

	it('una periódica conserva pausada y reanudadaEn', () => {
		const documento = { ...PERIODICA, pausada: true, reanudadaEn: REANUDADA };

		expect(tareaDesdeDocumento(documento)).toStrictEqual(documento);
	});

	it('una puntual ignora pausada y reanudadaEn', () => {
		expect(tareaDesdeDocumento({ ...PUNTUAL, pausada: true, reanudadaEn: REANUDADA })).toStrictEqual(PUNTUAL);
	});

	it('reanudar quita pausada y guarda reanudadaEn; pausar en otro dispositivo después la deja pausada', () => {
		const pausada = { ...PERIODICA, pausada: true };
		const reanudada = aplicarCambio([pausada], 't2', { pausada: null, reanudadaEn: REANUDADA });

		expect(reanudada).toStrictEqual([{ ...PERIODICA, reanudadaEn: REANUDADA }]);
		expect(aplicarCambio(reanudada, 't2', { pausada: true })).toStrictEqual([{ ...PERIODICA, reanudadaEn: REANUDADA, pausada: true }]);
	});
});

describe('pospuesta en el documento (spec §4.1, §7)', () => {
	const PRIMERA = { desde: new Date(2026, 6, 15, 10, 0, 0), hasta: new Date(2026, 6, 15, 13, 0, 0) };
	const SEGUNDA = { desde: new Date(2026, 6, 15, 10, 5, 0), hasta: new Date(2026, 6, 15, 11, 5, 0) };

	it.each([
		['una puntual', PUNTUAL],
		['una periódica', PERIODICA]
	])('%s conserva pospuesta', (_, documento) => {
		expect(tareaDesdeDocumento({ ...documento, pospuesta: PRIMERA }).pospuesta).toStrictEqual(PRIMERA);
	});

	it('sin pospuesta, la tarea queda sin el campo', () => {
		expect(tareaDesdeDocumento(PUNTUAL)).not.toHaveProperty('pospuesta');
	});

	it('es un solo campo: el último cambio queda entero, sin mezclar desde y hasta', () => {
		const [documento] = aplicarCambio([{ ...PUNTUAL, pospuesta: PRIMERA }], PUNTUAL.id, { pospuesta: SEGUNDA });

		expect(documento.pospuesta).toStrictEqual(SEGUNDA);
	});

	it('en null, se quita del documento', () => {
		const [documento] = aplicarCambio([{ ...PUNTUAL, pospuesta: PRIMERA }], PUNTUAL.id, { pospuesta: null });

		expect(documento).not.toHaveProperty('pospuesta');
	});
});

describe('el esfuerzo en el documento', () => {
	it('las dos formas conservan su esfuerzo', () => {
		expect(tareaDesdeDocumento({ ...PUNTUAL, esfuerzo: 'rapida' })).toStrictEqual({ ...PUNTUAL, esfuerzo: 'rapida' });
		expect(tareaDesdeDocumento({ ...PERIODICA, esfuerzo: 'larga' })).toStrictEqual({ ...PERIODICA, esfuerzo: 'larga' });
	});

	it('sin el campo, la tarea queda sin estimar', () => {
		expect(tareaDesdeDocumento(PUNTUAL)).not.toHaveProperty('esfuerzo');
	});

	it('es un campo independiente: se combina con un cambio de título de otro dispositivo (§7)', () => {
		const conEsfuerzo: DocumentoDeTarea = { ...PUNTUAL, esfuerzo: 'media' };
		const [resultado] = aplicarCambio(aplicarCambio([conEsfuerzo], 't1', { titulo: 'Pagar la luz' }), 't1', { esfuerzo: 'rapida' });

		expect(resultado).toStrictEqual({ ...PUNTUAL, titulo: 'Pagar la luz', esfuerzo: 'rapida' });
	});

	it('el último cambio gana, también si lo quita con null (§7)', () => {
		const conEsfuerzo: DocumentoDeTarea = { ...PUNTUAL, esfuerzo: 'media' };
		const [quitado] = aplicarCambio(aplicarCambio([conEsfuerzo], 't1', { esfuerzo: 'rapida' }), 't1', { esfuerzo: null });
		const [puesto] = aplicarCambio(aplicarCambio([conEsfuerzo], 't1', { esfuerzo: null }), 't1', { esfuerzo: 'larga' });

		expect(quitado).toStrictEqual(PUNTUAL);
		expect(puesto).toStrictEqual({ ...PUNTUAL, esfuerzo: 'larga' });
	});
});
