// Which font draws each character (spec §6, "Qué se dibuja con qué").
import { expect } from 'vitest';
import { textFonts } from '../../src/lib/core/character-font';
import { P } from './values';
import type { StepDefinition } from './world';

/** The font names as the Gherkin says them, mapped to the core's values. */
const GHERKIN_FONTS: Record<string, string> = {
	'Atkinson Hyperlegible Next': 'Atkinson Hyperlegible Next',
	'Noto Color Emoji': 'Noto Color Emoji',
	'la fuente del sistema': 'systemFont',
	'el emoji del dispositivo': 'deviceEmoji'
};

export const fontSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^the text ${P}$`),
		run: (world, text) => {
			world.text = text;
		}
	},
	{
		pattern: new RegExp(`^the text is drawn with ${P}$`),
		run: (world, font) => expect(new Set(textFonts(world.text ?? ''))).toEqual(new Set([GHERKIN_FONTS[font] ?? font]))
	}
];
