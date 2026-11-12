import { describe, expect, it } from 'vitest';
import { hayCambios, type ValoresDelPanel } from './cambios-sin-guardar';
import { DATOS_AL_CREAR, datosDeTarea, type DatosDeTarea } from './datos-de-tarea';
import type { Tarea } from './tarea';

const CREADA = new Date(2026, 6, 13, 8, 0, 0);
const PUNTUAL: DatosDeTarea = { forma: 'puntual', titulo: 'Pagar', nota: 'Luz' };
const RELATIVA: DatosDeTarea = { forma: 'relativa', titulo: 'Regar', cada: 2, unidad: 'dias' };
const SEMANAL: DatosDeTarea = { forma: 'calendario', titulo: 'Regar', diasSemana: ['lunes', 'jueves'], diasMes: [] };
const CON_HORARIOS: DatosDeTarea = {
	forma: 'puntual',
	titulo: 'Pagar',
	horario: [
		{ desde: '08:00', hasta: '10:00' },
		{ desde: '12:00', hasta: '14:00' }
	]
};
/** Como abre el panel al crear: nada escrito. */
const AL_CREAR: DatosDeTarea = { forma: 'puntual', titulo: '', emoji: '', nota: '', fechaLimite: undefined };

const abierto = (datos: DatosDeTarea, etiquetas: readonly string[] = []): ValoresDelPanel => ({ datos, etiquetas });
const cambia = (alAbrir: DatosDeTarea, datos: DatosDeTarea, sinConfirmar = '') => hayCambios(abierto(alAbrir), { datos, etiquetas: [], sinConfirmar });

describe('hayCambios (spec §6.2): Guardar cambiaría algo respecto de los valores al abrir', () => {
	it('los mismos valores no son un cambio', () => {
		expect(cambia(PUNTUAL, { ...PUNTUAL })).toBe(false);
	});

	it('otro título, otra nota, otro emoji u otro esfuerzo son un cambio', () => {
		expect(cambia(PUNTUAL, { ...PUNTUAL, titulo: 'Pagar luz' })).toBe(true);
		expect(cambia(PUNTUAL, { ...PUNTUAL, nota: 'Gas' })).toBe(true);
		expect(cambia(PUNTUAL, { ...PUNTUAL, emoji: '🌱' })).toBe(true);
		expect(cambia(PUNTUAL, { ...PUNTUAL, esfuerzo: 'media' })).toBe(true);
	});

	it('los espacios que Guardar recorta no cuentan', () => {
		expect(cambia(PUNTUAL, { ...PUNTUAL, titulo: '  Pagar  ', nota: '  Luz \n' })).toBe(false);
		expect(cambia({ ...PUNTUAL, emoji: '🌱' }, { ...PUNTUAL, emoji: ' 🌱 ' })).toBe(false);
	});

	it('un valor que no es un solo emoji se compara tal cual: otro texto es un cambio', () => {
		expect(cambia({ ...PUNTUAL, emoji: '🌱' }, { ...PUNTUAL, emoji: '🌱🌱' })).toBe(true);
	});

	it('un campo vaciado cuenta aunque sea inválido, y solo espacios es vaciarlo', () => {
		expect(cambia(PUNTUAL, { ...PUNTUAL, titulo: '' })).toBe(true);
		expect(cambia(PUNTUAL, { ...PUNTUAL, titulo: '   ' })).toBe(true);
		expect(cambia(PUNTUAL, { ...PUNTUAL, nota: '' })).toBe(true);
		expect(cambia(PUNTUAL, { ...PUNTUAL, nota: '   ' })).toBe(true);
	});

	it('sin el campo y el campo vacío son lo mismo', () => {
		expect(cambia({ forma: 'puntual', titulo: 'Pagar' }, { forma: 'puntual', titulo: 'Pagar', emoji: '', nota: '', horario: undefined, fechaLimite: undefined })).toBe(false);
	});

	it('los valores con que el panel abre una tarea coinciden con el formulario recién abierto', () => {
		const tarea: Tarea = { id: 't', titulo: 'Pagar', tipo: 'puntual', fechaLimite: new Date(2026, 6, 20), creadaEn: CREADA };
		expect(cambia(datosDeTarea(tarea), { forma: 'puntual', titulo: 'Pagar', emoji: '', nota: '', horario: undefined, fechaLimite: '2026-07-20' })).toBe(false);
	});

	describe('Se repite', () => {
		it('otra opción es un cambio, aunque sus campos estén vacíos', () => {
			expect(cambia(PUNTUAL, { ...PUNTUAL, forma: 'relativa', cada: Number.NaN, unidad: 'horas' })).toBe(true);
			expect(cambia(RELATIVA, { forma: 'puntual', titulo: 'Regar' })).toBe(true);
			expect(cambia(SEMANAL, { ...SEMANAL, diasSemana: [], diasMes: [1] })).toBe(true);
		});

		it('otro valor de sus campos es un cambio', () => {
			expect(cambia(RELATIVA, { ...RELATIVA, cada: 3 } as DatosDeTarea)).toBe(true);
			expect(cambia(RELATIVA, { ...RELATIVA, unidad: 'horas' } as DatosDeTarea)).toBe(true);
			expect(cambia(RELATIVA, { ...RELATIVA, cada: Number.NaN } as DatosDeTarea)).toBe(true);
			expect(cambia(PUNTUAL, { ...PUNTUAL, fechaLimite: '2026-07-20' } as DatosDeTarea)).toBe(true);
			expect(cambia(SEMANAL, { ...SEMANAL, diasSemana: ['lunes'] } as DatosDeTarea)).toBe(true);
		});

		it('una fecha a medio escribir es un cambio aunque tenga valor vacío', () => {
			expect(cambia(PUNTUAL, { ...PUNTUAL, fechaLimite: '' } as DatosDeTarea)).toBe(true);
		});

		it('los días son un conjunto: el orden en que se tocaron no cuenta', () => {
			expect(cambia(SEMANAL, { ...SEMANAL, diasSemana: ['jueves', 'lunes'] } as DatosDeTarea)).toBe(false);
			const mensual: DatosDeTarea = { forma: 'calendario', titulo: 'Regar', diasSemana: [], diasMes: [1, 15] };
			expect(cambia(mensual, { ...mensual, diasMes: [15, 1] })).toBe(false);
		});

		it('un formulario inválido sin tocar no es un cambio', () => {
			const sinCada: DatosDeTarea = { ...RELATIVA, cada: Number.NaN } as DatosDeTarea;
			expect(cambia(sinCada, { ...sinCada })).toBe(false);
		});
	});

	describe('Horario', () => {
		it('intercambiar dos ventanas no cambia nada: Guardar las ordena', () => {
			const [primera, segunda] = CON_HORARIOS.horario!;
			expect(cambia(CON_HORARIOS, { ...CON_HORARIOS, horario: [segunda, primera] })).toBe(false);
		});

		it('cambiar una ventana sí', () => {
			const [primera] = CON_HORARIOS.horario!;
			expect(cambia(CON_HORARIOS, { ...CON_HORARIOS, horario: [primera, { desde: '12:00', hasta: '15:00' }] })).toBe(true);
		});

		it('una fila vacía cuenta aunque sea inválida', () => {
			expect(cambia(CON_HORARIOS, { ...CON_HORARIOS, horario: [...CON_HORARIOS.horario!, { desde: '', hasta: '' }] })).toBe(true);
			expect(cambia(PUNTUAL, { ...PUNTUAL, horario: [{ desde: '', hasta: '' }] })).toBe(true);
		});

		it('apagar el horario es un cambio; sin ventanas es lo mismo que sin horario', () => {
			expect(cambia(CON_HORARIOS, { ...CON_HORARIOS, horario: undefined })).toBe(true);
			expect(cambia(PUNTUAL, { ...PUNTUAL, horario: [] })).toBe(false);
		});

		it('varias ventanas en una relativa en horas se miden igual, aunque Guardar las rechace', () => {
			const enHoras = { forma: 'relativa', titulo: 'Regar', cada: 2, unidad: 'horas', horario: CON_HORARIOS.horario } as DatosDeTarea;
			expect(cambia(enHoras, { ...enHoras })).toBe(false);
		});
	});

	describe('Etiquetas', () => {
		const conEtiquetas = (alAbrir: readonly string[], etiquetas: readonly string[]) => hayCambios(abierto(PUNTUAL, alAbrir), { datos: PUNTUAL, etiquetas, sinConfirmar: '' });

		it('agregar o quitar una etiqueta es un cambio', () => {
			expect(conEtiquetas([], ['casa'])).toBe(true);
			expect(conEtiquetas(['casa'], [])).toBe(true);
			expect(conEtiquetas(['casa'], ['auto'])).toBe(true);
		});

		it('agregarla y quitarla, cambiarlas de orden o de mayúsculas no cambia nada', () => {
			expect(conEtiquetas(['casa', 'auto'], ['auto', 'casa'])).toBe(false);
			expect(conEtiquetas(['casa'], ['Casa'])).toBe(false);
		});
	});

	describe('Texto sin confirmar en Etiquetas (única excepción)', () => {
		it('cuenta aunque Guardar no cambie nada por él', () => {
			expect(cambia(PUNTUAL, PUNTUAL, 'casa')).toBe(true);
			expect(cambia(PUNTUAL, PUNTUAL, '  casa  ')).toBe(true);
		});

		it('solo espacios no cuenta', () => {
			expect(cambia(PUNTUAL, PUNTUAL, '   ')).toBe(false);
		});
	});

	describe('Al crear', () => {
		it('se mide contra No se repite, la opción que viene elegida (S23, S5)', () => {
			const intervalo: DatosDeTarea = { ...AL_CREAR, forma: 'relativa', cada: Number.NaN, unidad: 'horas' };
			expect(cambia(DATOS_AL_CREAR, AL_CREAR)).toBe(false);
			expect(cambia(DATOS_AL_CREAR, intervalo)).toBe(true);
		});

		it('el formulario como se abrió, o con solo espacios, no es un cambio', () => {
			expect(cambia(AL_CREAR, AL_CREAR)).toBe(false);
			expect(cambia(AL_CREAR, { ...AL_CREAR, titulo: '   ' })).toBe(false);
			expect(cambia(AL_CREAR, { ...AL_CREAR, nota: '   ' })).toBe(false);
			expect(cambia(AL_CREAR, AL_CREAR, '   ')).toBe(false);
		});

		it('cargar cualquier campo es un cambio', () => {
			expect(cambia(AL_CREAR, { ...AL_CREAR, titulo: 'Pagar' })).toBe(true);
			expect(cambia(AL_CREAR, { ...AL_CREAR, esfuerzo: 'media' })).toBe(true);
			expect(cambia(AL_CREAR, { ...AL_CREAR, forma: 'relativa', cada: Number.NaN, unidad: 'horas' })).toBe(true);
			expect(cambia(AL_CREAR, AL_CREAR, 'casa')).toBe(true);
		});
	});

	it('se mide contra los valores al abrir, no contra los de otro dispositivo', () => {
		const remota: Tarea = { id: 't', titulo: 'Pagar luz', nota: 'Luz', tipo: 'puntual', creadaEn: CREADA };
		expect(cambia(PUNTUAL, datosDeTarea(remota))).toBe(true);
		expect(cambia(PUNTUAL, PUNTUAL)).toBe(false);
	});
});
