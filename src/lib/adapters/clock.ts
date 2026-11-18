export function now(): Date {
	return new Date();
}

/** Periodically reports the current time, so statuses recompute on their own. */
export function observeClock(onChange: (now: Date) => void, everyMs = 1000): () => void {
	const interval = setInterval(() => onChange(new Date()), everyMs);
	return () => clearInterval(interval);
}
