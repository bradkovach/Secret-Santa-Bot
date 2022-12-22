import {
	EmbedBuilder,
	Guild,
	GuildMember,
	italic,
	time,
} from 'discord.js';
import { ICommand } from '../ICommand';
import { Channel } from '../model/Channel';
import { Match } from '../model/Match';
import { Participant } from '../model/Participant';
import { Shipment } from '../model/Shipment';
import { ParticipantState } from '../ParticipantState';
import { logAndReturnMessage } from '../utils/logger';
import { heading, passage } from '../utils/text';
import { receivedEmoji, sentEmoji } from './create';

const shipmentToEmbedFields = (
	shipment: Shipment<false>,
	idx: number
): { name: string; value: string } => ({
	name: `Shipment ${idx + 1}. Shipped ${time(
		shipment.created.getTime() / 1000
	)}`,
	value: [
		shipment.tracking_number && shipment.tracking_number.trim() !== ''
			? shipment.tracking_number.trim()
			: italic('<no tracking information provided>'),
		shipment.received
			? `${receivedEmoji} Received ${time(
					shipment.updated.getTime() / 1000
			  )}`
			: `${sentEmoji} Not Received`,
	].join('\n'),
});
const shipments: ICommand = {
	allowAdmin: false,
	allowOwner: false,
	description: `Shows shipments you've sent and can expect to receive.`,
	name: 'shipments',
	respondInChannelTypes: ['participant'],
	showInHelp: true,
	usage: `shipments`,
	allowAfter: ParticipantState.JOINED,
	allowBefore: ParticipantState.RECEIVED_BY_GIFTEE,
	protectInvocation: false,
	execute(guild: Guild, message, subcommand, metadata) {
		logAndReturnMessage(message, 'execute command');
		return guild.members
			.fetch()
			.then(() => Channel.fromDiscordChannelId(message.channelId))
			.then((channel) => {
				return channel.getParticipant();
			})
			.then((participant) => {
				return Promise.all([
					participant.getSanta(),
					participant.getMatchAsGiftee(),
					participant.getMatchesAsSanta(),
				]).then(
					([santaParticipant, matchAsGiftee, matchesAsSanta]: [
						Participant,
						Match,
						Match[]
					]) => {
						return { santaParticipant, matchAsGiftee, matchesAsSanta };
					}
				);
			})
			.then(({ santaParticipant, matchAsGiftee, matchesAsSanta }) => {
				return Promise.all([
					guild.members.fetch(santaParticipant.discord_user_id),
					matchAsGiftee.getShipments(),
					Promise.all(
						matchesAsSanta.flatMap((match) =>
							match
								.getShipments()
								.then((shipments) => ({ match, shipments }))
								.then(({ match, shipments }) =>
									match
										.getGifteeParticipant()
										.then((giftee) => ({ match, shipments, giftee }))
								)
						)
					),
				]).then(
					([santaMember, incomingShipments, outgoingShipments]: [
						GuildMember,
						Shipment[],
						{ match: Match; giftee: Participant; shipments: Shipment[] }[]
					]) => {
						const embeds: EmbedBuilder[] = [];

						const allReceived = incomingShipments.every((s) => s.received);

						if (incomingShipments.length > 0) {
							embeds.push(
								new EmbedBuilder()
									.setTitle(
										`Your Secret Santa${
											allReceived ? `, ${santaMember.displayName},` : ''
										} has sent the following...`
									)
									.setFields(incomingShipments.map(shipmentToEmbedFields))
							);
						}

						if (outgoingShipments.length > 0) {
							outgoingShipments.forEach((triple) => {
								let gifteeMember = guild.members.cache.get(
									triple.giftee.discord_user_id
								);
								let displayName = gifteeMember
									? gifteeMember.displayName
									: 'your giftee';
								embeds.push(
									new EmbedBuilder()
										.setTitle(
											`You've sent ${displayName} the following...`
										)
										.setFields(triple.shipments.map(shipmentToEmbedFields))
								);
							});
						}

						return message
							.reply({
								content: passage(
									heading(`Here are the your shipments in this exchange.`)
								),
								embeds,
							})
							.then(logAndReturnMessage);
					}
				);
			});
	},
};

export default shipments;
