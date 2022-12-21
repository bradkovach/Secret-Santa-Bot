import { Message, MessageReaction, User } from 'discord.js';
import logger from '../utils/logger';

export const isValidSequence = async (
	user: User,
	reaction: MessageReaction,
	sequence: [string, string]
): Promise<boolean> => {
	const forceMessage = await reaction.message.fetch(true);

	const firstReact = forceMessage.reactions.cache.get(sequence[0]);
	const secondReact = forceMessage.reactions.cache.get(sequence[1]);

	if (!firstReact) {
		logger.info(`firstReact undefined`);
		return false;
	}

	logger.info(`firstReact defined`);

	const firstUsers = await firstReact.users.fetch();

	// user didn't do the first reaction
	if (!firstUsers.has(user.id)) {
		logger.info(`User didn't do first reaction, ${sequence[0]}`);
		return false;
	}

	// nobody (not even the bot) has reacted w second react
	if (!secondReact) {
		logger.info(`secondReact undefined`);
		if (
			firstUsers.has(user.id) &&
			reaction.emoji.toString() === sequence[0]
		) {
			logger.info(`secondReact undefined; firstReact valid`);
			return true;
		}
		return false;
	}

	logger.info(`secondReact defined`);

	const secondUsers = await secondReact.users.fetch();

	if (firstUsers.has(user.id)) {
		logger.info(`User did first react`);
		if (secondUsers.has(user.id)) {
			logger.info(`User did second react`);
			if (secondReact.emoji.toString() === reaction.emoji.toString()) {
				logger.info(`React was second in sequence.`);
				return true;
			}
		}
		return firstReact.emoji.toString() === reaction.emoji.toString();
	}

	return false;
};
