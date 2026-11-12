// Spec §6.2 (Editar) y §7 (Conflictos): editar produce un cambio parcial que,
// aplicado al documento guardado, deja la tarea que describen los datos.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { crearSegunDatos, datosDeTarea, type DatosDeTarea } from './datos-de-tarea';
import { diaIso } from './dias';
import { aplicarCambio, tareaDesdeDocumento, type CambioDeTarea, type DocumentoDeTarea } from './documento-de-tarea';
import { editar } from './edicion';
import { DIAS_DE_LA_SEMANA, type Recurrencia, type Tarea } from './tarea';

const ID = 't';
const creadaEn = fc.date({ min: new Date(1990, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true });

/** Un título con algo más que espacios (con espacios en los extremos, que se recortan). */
const tituloValido = fc
	.tuple(fc.string({ maxLength: 3 }).map((s) => s.replace(/\S/g, ' ')), fc.string({ minLength: 1, maxLength: 12 }))
	.filter(([, texto]) => texto.trim() !== '')
	.map(([espacios, texto]) => `${espacios}${texto}${espacios}`);
const fechaIso = creadaEn.map(diaIso);
const unidad = fc.constantFrom('horas' as const, 'dias' as const);
/** Días de la semana en cualquier orden y con repetidos: crear los guarda como conjunto. */
const diasSemana = fc.array(fc.constantFrom(...DIAS_DE_LA_SEMANA), { minLength: 1, maxLength: 9 });
const diasMes = fc.array(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 8 });

const hora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
const minutosDelDia = fc.integer({ min: 0, max: 1439 });
/** Un horario válido (§4.1), o ninguno. */
const horarioValido = fc.option(
	fc.uniqueArray(minutosDelDia, { minLength: 2, maxLength: 2 }).map(([a, b]) => [{ desde: hora(Math.min(a, b)), hasta: hora(Math.max(a, b)) }]),
	{ nil: undefined }
);
/** Cualquier horario que escriba el panel: horas vacías, invertidas o iguales. */
const horarioCualquiera = fc.option(
	fc.record({ desde: fc.oneof(minutosDelDia.map(hora), fc.constant('')), hasta: fc.oneof(minutosDelDia.map(hora), fc.constant('')) }).map((ventana) => [ventana]),
	{ nil: undefined }
);
const conHorario = (datos: fc.Arbitrary<DatosDeTarea>, horario: typeof horarioCualquiera) =>
	fc.tuple(datos, horario).map(([d, h]): DatosDeTarea => ({ ...d, ...(h && { horario: h }) }));

/** Datos que pasan las validaciones de crear (§4.1–§4.2), sin horario. */
const datosSinHorario: fc.Arbitrary<DatosDeTarea> = fc.oneof(
	fc.record({ forma: fc.constant('puntual' as const), titulo: tituloValido }),
	fc.record({ forma: fc.constant('puntual' as const), titulo: tituloValido, fechaLimite: fechaIso }),
	fc.record({ forma: fc.constant('relativa' as const), titulo: tituloValido, cada: fc.integer({ min: 1, max: 1000 }), unidad }),
	fc.record({ forma: fc.constant('calendario' as const), titulo: tituloValido, diasSemana, diasMes: fc.constant([]) }),
	fc.record({ forma: fc.constant('calendario' as const), titulo: tituloValido, diasSemana: fc.constant([]), diasMes })
);
/** Datos que pasan las validaciones de crear, con o sin horario. */
const datosValidos = conHorario(datosSinHorario, horarioValido);

/** Cualquier dato que pueda cargar el panel, válido o no. */
const datosCualesquiera: fc.Arbitrary<DatosDeTarea> = conHorario(
	fc.oneof(
		datosSinHorario,
		fc.record({
			forma: fc.constant('puntual' as const),
			titulo: fc.string({ maxLength: 4 }),
			fechaLimite: fc.oneof(fechaIso, fc.constantFrom('', '2026-02-30', '2026-13-01', 'mañana'))
		}),
		fc.record({
			forma: fc.constant('relativa' as const),
			titulo: fc.string({ maxLength: 4 }),
			cada: fc.oneof(fc.integer({ min: -3, max: 3 }), fc.double({ noNaN: false })),
			unidad
		}),
		fc.record({
			forma: fc.constant('calendario' as const),
			titulo: fc.string({ maxLength: 4 }),
			diasSemana: fc.array(fc.constantFrom(...DIAS_DE_LA_SEMANA), { maxLength: 3 }),
			diasMes: fc.array(fc.integer({ min: -1, max: 33 }), { maxLength: 3 })
		})
	),
	horarioCualquiera
);

function crear(datos: DatosDeTarea, creada: Date): Tarea {
	const resultado = crearSegunDatos(datos, ID, creada);
	if (!resultado.ok) throw new Error('los datos válidos siempre crean');
	return resultado.tarea;
}

/** Una tarea guardada, como la deja crear. */
const tarea = fc.tuple(datosValidos, creadaEn).map(([datos, creada]) => crear(datos, creada));

function editarOk(t: Tarea, datos: DatosDeTarea): CambioDeTarea {
	const resultado = editar(t, datos);
	if (!resultado.ok) throw new Error('los datos válidos siempre editan');
	return resultado.cambio;
}

const aplicar = (documento: DocumentoDeTarea, ...cambios: CambioDeTarea[]): DocumentoDeTarea =>
	cambios.reduce<DocumentoDeTarea>((doc, cambio) => aplicarCambio([doc], doc.id, cambio)[0], documento);

/** Una recurrencia de un solo modo, con exactamente sus campos (§7: nunca se mezcla por subcampo). */
function esRecurrenciaDeUnModo(recurrencia: Recurrencia): boolean {
	const campos = Object.keys(recurrencia).sort().join(',');
	return ['cada,modo,unidad', 'diasSemana,modo', 'diasMes,modo'].includes(campos);
}

describe('datosDeTarea (propiedades)', () => {
	it('es la inversa de crear: crear con los datos de una tarea da la misma tarea', () => {
		fc.assert(
			fc.property(tarea, (t) => {
				expect(crearSegunDatos(datosDeTarea(t), t.id, t.creadaEn)).toStrictEqual({ ok: true, tarea: t });
			})
		);
	});
});

describe('editar (propiedades)', () => {
	it('guardar con los valores que cargó el panel no cambia ningún campo', () => {
		fc.assert(
			fc.property(tarea, (t) => {
				expect(editarOk(t, datosDeTarea(t))).toStrictEqual({});
			})
		);
	});

	it('valida exactamente como crear: se rechaza con los mismos errores', () => {
		fc.assert(
			fc.property(tarea, datosCualesquiera, (t, datos) => {
				const creacion = crearSegunDatos(datos, t.id, t.creadaEn);
				const edicion = editar(t, datos);
				expect(edicion.ok).toBe(creacion.ok);
				if (!creacion.ok) expect(edicion).toStrictEqual(creacion);
			})
		);
	});

	it('aplicado al documento, deja la tarea que se crearía con esos datos, con el mismo id y creadaEn', () => {
		fc.assert(
			fc.property(tarea, datosValidos, (t, datos) => {
				const documento = aplicar(t, editarOk(t, datos));
				// Igualdad estricta del documento: ningún campo del otro tipo, ninguna recurrencia mezclada.
				expect(documento).toStrictEqual(crear(datos, t.creadaEn));
			})
		);
	});

	it('escribe solo los campos que cambiaron y, al cambiar de tipo, los dos campos de tipo', () => {
		fc.assert(
			fc.property(tarea, datosValidos, (t, datos) => {
				const nueva = crear(datos, t.creadaEn) as unknown as Record<string, unknown>;
				const antes = t as unknown as Record<string, unknown>;
				const cambio = editarOk(t, datos);
				const esperados = ['titulo', 'tipo', 'fechaLimite', 'recurrencia'].filter(
					(campo) => nueva.tipo !== antes.tipo || JSON.stringify(nueva[campo]) !== JSON.stringify(antes[campo])
				);
				// El horario es un campo común: se escribe solo si cambió, también al cambiar de tipo.
				const horario = JSON.stringify(nueva.horario) !== JSON.stringify(antes.horario) ? ['horario'] : [];
				expect(Object.keys(cambio).sort()).toEqual(
					[...esperados.filter((campo) => campo !== 'titulo' || nueva.titulo !== antes.titulo), ...horario].sort()
				);
			})
		);
	});

	it('una recurrencia escrita es siempre entera y de un solo modo', () => {
		fc.assert(
			fc.property(tarea, datosValidos, (t, datos) => {
				const { recurrencia } = editarOk(t, datos);
				if (recurrencia) expect(esRecurrenciaDeUnModo(recurrencia)).toBe(true);
			})
		);
	});

	it('al cambiar de tipo quita el campo del otro tipo, aunque una edición concurrente lo haya dejado', () => {
		const ajeno = { fechaLimite: new Date(2026, 6, 14), recurrencia: { modo: 'relativo', cada: 3, unidad: 'horas' } } as const;
		fc.assert(
			fc.property(tarea, datosValidos, (t, datos) => {
				const nueva = crear(datos, t.creadaEn);
				fc.pre(nueva.tipo !== t.tipo);
				const conCampoAjeno = { ...t, ...(t.tipo === 'puntual' ? { recurrencia: ajeno.recurrencia } : { fechaLimite: ajeno.fechaLimite }) };
				expect(aplicar(conCampoAjeno, editarOk(t, datos))).toStrictEqual(nueva);
			})
		);
	});

	it('dos ediciones concurrentes de campos distintos (el título y la definición) conmutan', () => {
		fc.assert(
			fc.property(tarea, tituloValido, datosValidos, (t, titulo, definicion) => {
				const c1 = editarOk(t, { ...datosDeTarea(t), titulo });
				const c2 = editarOk(t, { ...definicion, titulo: t.titulo });
				expect(aplicar(t, c2, c1)).toStrictEqual(aplicar(t, c1, c2));
				expect(tareaDesdeDocumento(aplicar(t, c1, c2))).toStrictEqual(crear({ ...definicion, titulo }, t.creadaEn));
			})
		);
	});

	it('gana el último cambio por campo', () => {
		fc.assert(
			fc.property(tarea, datosValidos, datosValidos, (t, datos1, datos2) => {
				const c2 = editarOk(t, datos2);
				const documento = aplicar(t, editarOk(t, datos1), c2) as unknown as Record<string, unknown>;
				for (const [campo, valor] of Object.entries(c2)) {
					if (valor === null) expect(documento).not.toHaveProperty(campo);
					else expect(documento[campo]).toStrictEqual(valor);
				}
			})
		);
	});
});

describe('aplicarCambio (propiedades)', () => {
	const otras = fc.array(tarea, { maxLength: 3 }).map((ts) => ts.map((t, i) => ({ ...t, id: `otra-${i}` })));

	it('aplicar el mismo cambio dos veces es como aplicarlo una', () => {
		fc.assert(
			fc.property(tarea, datosValidos, (t, datos) => {
				const cambio = editarOk(t, datos);
				expect(aplicar(t, cambio, cambio)).toStrictEqual(aplicar(t, cambio));
			})
		);
	});

	it('gana el borrado: ningún cambio revive una tarea que ya no existe ni toca las demás', () => {
		fc.assert(
			fc.property(tarea, datosValidos, otras, (t, datos, documentos) => {
				expect(aplicarCambio(documentos, t.id, editarOk(t, datos))).toStrictEqual(documentos);
			})
		);
	});

	it('cambia solo el documento de esa tarea', () => {
		fc.assert(
			fc.property(tarea, datosValidos, otras, (t, datos, documentos) => {
				const cambio = editarOk(t, datos);
				const resultado = aplicarCambio([...documentos, t], t.id, cambio);
				expect(resultado.slice(0, -1)).toStrictEqual(documentos);
				expect(tareaDesdeDocumento(resultado[resultado.length - 1])).toStrictEqual(crear(datos, t.creadaEn));
			})
		);
	});
});
