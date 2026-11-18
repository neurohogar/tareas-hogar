// Spec §4.1 (How a task is shown): «emoji título», or just the title without an emoji.
// It is the name used by Pending, History and the undo notice.

export function taskName({ title, emoji }: { title: string; emoji?: string }): string {
	return emoji === undefined ? title : `${emoji} ${title}`;
}
