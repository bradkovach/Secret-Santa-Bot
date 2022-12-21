import { Message } from 'discord.js';

export const resetEmojiSequence = (
	message: Message,
	sequence: [string, string]
) => {
	return Promise.all(
		sequence.map((emoji) => {
			const maybeReact = message.reactions.cache.find(
				(react) => react.emoji.toString() === emoji
			);
			return maybeReact ? maybeReact.remove() : Promise.resolve();
		})
	)
		.then((allResolved) =>
			sequence.map(async (emoji) => await message.react(emoji))
		)
		.catch((someFailed) => false);
};
