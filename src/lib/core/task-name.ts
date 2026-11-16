// Spec §4.1 (Cómo se muestra una tarea): «emoji título», o solo el título sin emoji.
// Es el nombre que usan Pendientes, el Historial y el aviso de deshacer.

export function taskName({ title, emoji }: { title: string; emoji?: string }): string {
	return emoji === undefined ? title : `${emoji} ${title}`;
}
