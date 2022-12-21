import { bold } from 'discord.js';

export const passage = (...sections: string[][]) =>
	sections.map((section) => section.join(' ')).join('\n\n');

export const heading = (text: string) => [bold(text)];

export const p = (...sentences: string[]) => [sentences.join(' ')];

export const brjoin = (...lines: string[]) => [lines.join('\n')];
