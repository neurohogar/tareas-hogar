export function now(): Date {
	return new Date();
}

/** Avisa periódicamente la hora actual, para que los estados se recalculen solos. */
export function observeClock(onChange: (now: Date) => void, everyMs = 1000): () => void {
	const interval = setInterval(() => onChange(new Date()), everyMs);
	return () => clearInterval(interval);
}
