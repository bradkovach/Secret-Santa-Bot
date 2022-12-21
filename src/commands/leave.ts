import { Guild, Message } from 'discord.js';
import { ParticipantState } from '../ParticipantState';
import type { ICommand } from '../ICommand';
import { DatabaseManager } from '../model/database';
import logger from '../utils/logger';

const command: ICommand = {
	name: 'leave',
	usage: 'leave',
	description:
		'Withdraw from the Secret Santa gift exchange.  You cannot leave the exchange after it has started without first contacting a moderator.',

	allowAfter: ParticipantState.JOINED,
	allowBefore: ParticipantState.HAS_GIFTEE,

	allowOwner: false,
	allowAdmin: false,
	showInHelp: false,
	respondInChannelTypes: ['participant'],

	async execute(
		guild: Guild,
		message: Message,
		subcommand: string,
		context
	) {
		if (context.started) {
			message.reply(
				`This exchange has already started, and you must talk to a moderator of ${guild.name} if you would like to leave.`
			);
		} else {
			logger.info(`${message.member!.displayName} left the exchange.`);
			// delete channels
			DatabaseManager.getInstance()
				.selectFrom('channels')
				.where('participant_id', '=', context.participant_id)
				.selectAll()
				.execute()
				.then((channels) => {
					return channels.map(
						async (channel) =>
							await guild.channels.delete(
								channel.discord_channel_id,
								'User left gift exchange'
							)
					);
				})
				.then((deleted) => {
					return DatabaseManager.getInstance()
						.deleteFrom('participants')
						.where('participant_id', '=', context.participant_id)
						.execute()
						.then((deleted) => {
							return message.author.send(
								`You have been removed from the ${guild.name} Secret Santa exchange.`
							);
						})
						.then((sent) => {
							return sent.react('🫡');
						});
				});
			// delete participant
		}
	},
};

export default command;
