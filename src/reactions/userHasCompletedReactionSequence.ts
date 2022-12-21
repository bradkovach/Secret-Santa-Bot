import { Message, User } from 'discord.js';
import logger from '../utils/logger';

export const userHasCompletedReactionSequence = (
	message: Message<true>,
	user: User,
	sequence: string[]
): boolean => {
	const messageHasAllReacts = message.reactions.cache.hasAll(...sequence);
	if (!messageHasAllReacts) {
		logger.info(
			`[reaction sequence] Message does not have all of the reacts req'd to complete.`
		);
		return false;
	}
	return sequence.every(async (requiredEmote) => {
		logger.info(`[reaction seq] Message has emote ${requiredEmote}?`);
		const emote = message.reactions.cache.get(requiredEmote);

		if (!emote) {
			logger.info(`\t...did not have req'd emote, '${requiredEmote}'`);
			return false;
		}

		logger.info(`\t...had req'd emote, '${requiredEmote}'.`);

		let reactUsers = await emote.users.fetch();

		return reactUsers.has(user.id);
	});
};
