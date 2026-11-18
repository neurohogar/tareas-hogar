// Shape of the IR JSON produced by APS `gherkin-parser` (parser-spec.md).

export interface Step {
	keyword: string;
	text: string;
	parameters?: string[];
}

export type Example = Record<string, string>;

export interface Scenario {
	name: string;
	steps: Step[];
	examples: Example[];
}

export interface Feature {
	name: string;
	background?: Step[];
	scenarios: Scenario[];
}
