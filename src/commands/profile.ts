import { EmbedBuilder, Guild, Message } from 'discord.js';
import { sendMessageToChannel } from '../exchange/sendMessageToChannel';
import { ParticipantState } from '../ParticipantState';
import type { ICommand } from '../ICommand';
import { DatabaseManager } from '../model/database';
import { Participant } from '../model/Participant';
import logger from '../utils/logger';

const command: ICommand = {
	name: 'profile',
	usage: 'profile I like hobbies, food, drink, clothing, etc...',
	description:
		'Tell a little about yourself so your Secret Santa knows what to get you!',

	allowAfter: ParticipantState.JOINED,
	allowBefore: ParticipantState.SHIPPED_BY_SANTA,

	allowOwner: false,
	allowAdmin: false,
	showInHelp: false,
	respondInChannelTypes: ['participant'],

	protectInvocation: true,

	async execute(
		guild: Guild,
		message: Message,
		profile: string,
		info: any
	) {
		logger.info(`profile execute`);

		if (!info) {
			return;
		}

		if (profile.trim().length === 0) {
			return message.reply(
				`Your profile can not be blank.  Please try again with a longer profile.`
			);
		}

		if (profile.trim().length >= 1000) {
			return message.reply(
				`Your profile can only be 1000 characters long. Please try again!`
			);
		}

		// log
		logger.info(
			`Updating profile for ${message.author.tag} from '${info.wishlist}' to '${profile}'`
		);

		// if exchange started, update santa
		if (info.started) {
			Participant.fromParticipantId(info.participant_id)
				.then((participant) => participant.getSanta())
				.then((santa) => {
					santa
						.getChannels()
						.then((channels) =>
							channels.find((c) => c.role === 'participant')
						)
						.then((channel) => {
							return sendMessageToChannel(guild, santa, 'participant', {
								content: `Your giftee has updated their profile!`,
								embeds: [
									new EmbedBuilder().addFields([
										{ name: 'Updated Profile', value: profile },
									]),
								],
							});
						});
				});
		}

		// save
		DatabaseManager.getInstance()
			.updateTable('participants')
			.set({ wishlist: profile.trim() })
			.where('participant_id', '=', info.participant_id)

			.execute()
			.then((updated) => {
				message.reply({
					content: `Your profile has been updated!`,
					embeds: [
						new EmbedBuilder().setFields([
							...(info.wishlist.trim() === ''
								? []
								: [{ name: 'Old Profile', value: info.wishlist.trim() }]),
							{ name: 'New Profile', value: profile },
						]),
					],
				});
			});
	},
};

export default command;
