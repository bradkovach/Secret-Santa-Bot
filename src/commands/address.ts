import { EmbedBuilder, Guild, Message } from 'discord.js';
import { sendMessageToChannel } from '../exchange/sendMessageToChannel';
import type { ICommand } from '../ICommand';
import { DatabaseManager } from '../model/database';

import { ParticipantState } from '../ParticipantState';
import { ChannelRow } from '../model/channels.table';
import { ExchangeRow } from '../model/exchange.table';
import { ParticipantRow } from '../model/participants.table';
import { Participant } from '../model/Participant';
import { flagFromThree } from '../utils/countries';
import logger from '../utils/logger';

interface ParticipantInfo
	extends ParticipantRow,
		ChannelRow,
		ExchangeRow {}

const command: ICommand = {
	name: 'address',
	usage: 'address 1234 Your Street; Boston, MA 02134',
	description:
		'Enter your address so your Secret Santa can ship your gift.',

	allowAfter: ParticipantState.JOINED,
	allowBefore: ParticipantState.SHIPPED_BY_SANTA,

	allowOwner: false,
	allowAdmin: false,
	showInHelp: false,
	respondInChannelTypes: ['participant'],
	protectInvocation: true,

	execute: async function (
		guild: Guild,
		message: Message,
		address: string,
		context: ParticipantInfo
	): Promise<any> {
		if (!message.channel) {
			return;
		}

		if (address.trim().length === 0) {
			return message.reply(
				`Your address cannot be blank. Please try again with a longer address.`
			);
		}

		if (address.length >= 1000) {
			return message.reply(
				'Your address can only be a maximum of 1000 characters long!'
			);
		}

		logger.info(
			`Updating address for ${message.author.tag} from '${context.address}' to '${address}'.`
		);

		if (context.started) {
			Participant.fromParticipantId(context.participant_id)
				.then((participant) => participant.getSanta())
				.then((santa) => {
					santa
						.getChannels()
						.then((channels) =>
							channels.find((c) => c.role === 'participant')
						)
						.then((channel) => {
							return sendMessageToChannel(guild, santa, 'participant', {
								content: `Your giftee has updated their address!`,
								embeds: [
									new EmbedBuilder().addFields([
										{ name: 'Updated Address', value: address },
									]),
								],
							});
						});
				});
		}

		return await DatabaseManager.getInstance()
			.updateTable('participants')
			.set({ address })
			.where('participant_id', '=', context.participant_id)
			.execute()
			.then((updated) => {
				message
					.reply({
						content: `Your address has been updated!  React to any bot message with your flag to set your country.`,
						embeds: [
							new EmbedBuilder().setFields([
								...(context.address.trim() === ''
									? []
									: [
											{
												name: 'Old Address',
												value: context.address.trim(),
											},
									  ]),
								{ name: 'New Address', value: address },
							]),
						],
					})
					.then((replyMessage) =>
						replyMessage.react(flagFromThree(context.iso_country_code))
					);
			});
	},
};

export default command;
