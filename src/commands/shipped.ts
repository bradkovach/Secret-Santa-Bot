import {
	EmbedBuilder,
	Guild,
	inlineCode,
	italic,
	Message
} from 'discord.js';
import { sendMessageToChannel } from '../exchange/sendMessageToChannel';
import type { ICommand } from '../ICommand';
import { Channel } from '../model/Channel';
import { ChannelRow } from '../model/channels.table';
import { ExchangeRow } from '../model/exchange.table';
import { Match } from '../model/Match';
import { ParticipantRow } from '../model/participants.table';
import { ParticipantState } from '../ParticipantState';
import logger, {
	logAndReturnMessage
} from '../utils/logger';
import { showCommandUsage } from '../utils/showCommandUsage';
import { brjoin, p, passage } from '../utils/text';
import { sentEmoji } from './create';
import receivedCommand from './received';

const command: ICommand = {
	name: 'shipped',
	usage: 'shipped [tracking number or information]',
	description:
		'Mark your gift as shipped.  Include tracking number or information such as who it was shipped with.',

	allowAfter: ParticipantState.HAS_GIFTEE,
	allowBefore: ParticipantState.SHIPPED_TO_GIFTEE,

	allowOwner: false,
	allowAdmin: false,
	showInHelp: false,
	respondInChannelTypes: ['participant'],

	protectInvocation: true,

	async execute(
		guild: Guild,
		message: Message,
		tracking_number: string,
		info: ChannelRow & ParticipantRow & ExchangeRow
	) {
		logAndReturnMessage(message, 'shipped command');
		if (!info) {
			logger.info(`[shipped] No participant information.`);
			return;
		}

		tracking_number =
			['none', ''].indexOf(tracking_number.toLowerCase().trim()) > -1
				? '<no tracking info provided>'
				: tracking_number.trim();

		// log
		logger.info(`[shipped] Marking gift as shipped...`);

		// update
		return Channel.fromDiscordChannelId(message.channelId)
			.then((channel) => channel.getParticipant())
			.then((santa) =>
				santa.getGiftees().then((giftees) => ({ santa, giftees }))
			)
			.then(({ santa, giftees }) => {
				if (giftees.length !== 1) {
					return Promise.reject(`Number of giftees was not 1`);
				}
				const giftee = giftees.shift();
				if (!giftee) {
					return Promise.reject(
						`Unable to find giftee for participant ${santa.participant_id}!`
					);
				}
				return Match.fromGifteeParticipantId(giftee.participant_id)
					.then((match) => match.createShipment(tracking_number))
					.then((shipment) =>
						sendMessageToChannel(guild, giftee, 'participant', {
							content: passage(
								p(`Your Secret Santa has marked your gift as shipped!`),
								brjoin(
									italic(
										`When your gift arrives, mark it received by replying...`
									),
									inlineCode(showCommandUsage(receivedCommand))
								)
							),
							embeds: [
								new EmbedBuilder()
									.setTitle('Your Shipment')
									.setFields([
										{ name: 'Tracking Number', value: tracking_number },
									]),
							],
						})
					)
					.then((gifteeMessage) => message.react(sentEmoji));
			});
	},
} as ICommand;

export default command;
