import { describe, expect, it } from 'vitest';
import { trimText } from './free-text';

describe('trimText', () => {
	it('trims the spaces and line breaks at the start and the end', () => {
		expect(trimText('  \n Usar guantes \n\n ')).toBe('Usar guantes');
	});

	it('keeps the inner line breaks and spaces', () => {
		expect(trimText(' Usar guantes\n\n  Ventilar ')).toBe('Usar guantes\n\n  Ventilar');
	});

	it.each(['', '   ', ' \n\t '])('empty or only spaces (%j) is no text', (text) => {
		expect(trimText(text)).toBeUndefined();
	});

	it('has no maximum length', () => {
		expect(trimText('x'.repeat(5000))).toHaveLength(5000);
	});
});
