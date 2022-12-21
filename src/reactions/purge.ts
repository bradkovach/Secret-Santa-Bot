import { purgeEmoji, purgeSequence } from '../commands/create';
import { IReactionHandler } from '../exchange/IReactionHandler';
import { cancelExchange } from '../macros/cancelExchange.macro';
import logger from '../utils/logger';
import { userHasCompletedReactionSequence } from './userHasCompletedReactionSequence';

export const purgeReactionHandler: IReactionHandler = {
	name: 'purge',
	description:
		'Destroys any channels created to support a Secret Santa exchange.',
	emoji: purgeSequence,
	async execute(reaction, user, exchange?, channel?): Promise<boolean> {
		if (!exchange) {
			logger.info(
				`Not purging exchange. Reaction not resolved to an exchange.`
			);
			return false;
		}

		if (exchange.discord_owner_user_id !== user.id) {
			logger.warn(`Not purging exchange. ${user.tag} does not own it.`);
			return false;
		}

		const message = await reaction.message.fetch(true);

		if (!message) {
			return false;
		}

		if (!message.inGuild()) {
			logger.warn(`Not purging exchange. Message not from guild.`);
			return false;
		}

		const guild = await message.guild.fetch();
		if (userHasCompletedReactionSequence(message, user, purgeSequence)) {
			return cancelExchange(guild, exchange)
				.then((exchangeCancelled) => {
					logger.info(`${purgeEmoji}: Exchange cancelled.`);
					return message.delete();
				})
				.then((messageDeleted) => {
					logger.info(`${purgeEmoji}: Exchange message deleted.`);
					return true;
				})
				.catch((err) => {
					logger.error(
						`An error occurred cancelling exchange ${
							exchange.exchange_id
						}: ${JSON.stringify(err)}`
					);
					return false;
				});
		}

		logger.info(
			`Not purging exchange. Message did not have required emotes to purge: ${purgeSequence.join(
				' & '
			)}`
		);

		return Promise.all(
			purgeSequence.map((requiredEmote) => message.react(requiredEmote))
		)
			.then((allReacted) => {
				return true;
			})
			.catch((someReactionsFailed) => {
				return false;
			});
	},
};

export default purgeReactionHandler;
