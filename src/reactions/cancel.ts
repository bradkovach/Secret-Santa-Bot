import Sequence from 'mysql2/typings/mysql/lib/protocol/sequences/Sequence';
import { cancelEmoji, cancelSequence } from '../commands/create';
import { type IReactionHandler } from '../exchange/IReactionHandler';
import logger from '../utils/logger';
import { isValidSequence } from './isValidSequence';
import { resetEmojiSequence } from './resetEmojiSequence';

/**
 * Converts Discord snowflake to a Date object
 * @param {String} snowflake
 * @returns {Date}
 */
export function snowflakeToDate(snowflake: string): Date {
	const dateBits = Number(BigInt.asUintN(64, BigInt(snowflake)) >> 22n);
	return new Date(dateBits + 1420070400000);
}

export const cancelReactionHandler: IReactionHandler = {
	name: 'cancel',
	description: 'Allows a gift exchange to be cancelled.',
	emoji: [cancelEmoji],
	async execute(reaction, user, exchange?, channel?) {
		// if (!exchange) {
		// 	return Promise.reject(
		// 		'Cannot cancel exchange from unknown message.'
		// 	);
		// }

		// if (user.id !== exchange.discord_owner_user_id) {
		// 	return Promise.reject(
		// 		`The exchange can only be cancelled by its owner!`
		// 	);
		// }

		// if (await isValidSequence(user, reaction, cancelSequence)) {
		// 	logger.info(`sequence valid; not resetting!`);
		//     if(reaction.emoji.toString() === cancelSequence[1]) {
		//         logger.info(`sequence complete! triggering cancellation.`)
		//     }
		// } else {
		// 	logger.info(`The sequence was invalid and will be reset.`);
		// 	return reaction.message
		// 		.fetch()
		// 		.then((message) => resetEmojiSequence(message, cancelSequence));
		// }

		// if (exchange.started) {
		// 	return Promise.reject(
		// 		`Cannot cancel an exchange that has already started!`
		// 	);
		// }

		return Promise.reject('cancel handler not implemented');
	},
};

export default cancelReactionHandler;
