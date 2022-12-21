import { getChannel } from '../channel/getChannel';
import { IReactionHandler } from '../exchange/IReactionHandler';
import { DatabaseManager } from '../model/database';
import { countryFromEmoji, isFlagEmoji } from '../utils/countries';
import logger from '../utils/logger';

export const flagReactionHandler: IReactionHandler = {
	name: 'flag',
	description: `Updates a user's country by letting them use flag emoji reactions`,
	test(reaction): boolean {
		return isFlagEmoji(reaction.emoji.toString());
	},
	execute(reaction, user, exchange?, channel?) {
		if (!channel) {
			return Promise.reject();
		}

		const country = countryFromEmoji(reaction.emoji.toString());
		if (!country) {
			return Promise.reject();
		}

		return DatabaseManager.getInstance()
			.updateTable('participants')
			.set({
				iso_country_code: country.threeAlpha,
			})
			.where('participant_id', '=', channel.participant_id)
			.execute()
			.then((updateResult) => {
				return reaction.message.reactions.removeAll();
			})
			.then((cleared) => {
				logger.info(
					`Updated ${user.username} country to ${country.threeAlpha}`
				);
				return reaction.message.react(reaction.emoji.toString());
			});
	},
};

export default flagReactionHandler;
