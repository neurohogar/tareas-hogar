// Spec §6.6: lo que la pantalla de carga necesita del navegador. Se dibuja en src/app.html,
// antes de que corra el JavaScript. Lo recordado vive solo en el dispositivo (§7).
import { recuerdoAlArrancar } from '$lib/core/pantalla-de-carga';
import { huellaDeNoto } from './fuentes';

const CLAVE = 'tareas-hogar:tope-de-noto';

/** Los segundos desde que la app arrancó, marcados en src/app.html. */
export function segundosDesdeElArranque(): number {
	const { arranqueDeLaApp = 0 } = window as unknown as { arranqueDeLaApp?: number };
	return (performance.now() - arranqueDeLaApp) / 1000;
}

export function quitarPantallaDeCarga(): void {
	document.getElementById('pantalla-de-carga')?.remove();
}

/** Lo recordado vale para la versión del juego con que se alcanzó el tope. Sin almacenamiento, no se recuerda nada. */
export function leerRecuerdoDeTopeDeNoto(): boolean {
	try {
		const huella = localStorage.getItem(CLAVE);
		return recuerdoAlArrancar(huella !== null, huella !== huellaDeNoto());
	} catch {
		return false;
	}
}

export function guardarRecuerdoDeTopeDeNoto(recuerda: boolean): void {
	try {
		if (recuerda) localStorage.setItem(CLAVE, huellaDeNoto());
		else localStorage.removeItem(CLAVE);
	} catch {
		// Sin almacenamiento, la próxima apertura vuelve a esperar a Noto.
	}
}
