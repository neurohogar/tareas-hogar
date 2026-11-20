// Spec §7 (Cleanups and retries): the cleanup of orphan completions is attempted item by item and retried.

/** What ended up clean and what is left to retry after an attempt; only ids, nothing to show. */
export interface AttemptResult {
	cleaned: string[];
	pendings: string[];
}

/** What can happen while the app is open; only the first two retry. */
export type AppEvent = 'connectionBack' | 'dataChanged' | 'timePasses';

/** §7: each item is attempted separately; only those that failed are left to clean. */
export function attemptResult(attempted: readonly string[], failed: readonly string[]): AttemptResult {
	const failure = new Set(failed);
	return {
		cleaned: attempted.filter((id) => !failure.has(id)),
		pendings: attempted.filter((id) => failure.has(id))
	};
}

/** §7: every item to clean that does not already have an attempt in progress is attempted (a finished attempt, even if it failed, stops counting). */
export function itemsToAttempt(toClean: readonly string[], inProgress: ReadonlySet<string>): string[] {
	return toClean.filter((id) => !inProgress.has(id));
}

/** §7: it retries when the connection returns and when the data changes, without timers. */
export function retriesWith(occurrenceEvent: AppEvent): boolean {
	return occurrenceEvent !== 'timePasses';
}
