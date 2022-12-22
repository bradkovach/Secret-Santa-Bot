import {
	bold,
	Guild,
	inlineCode,
	italic,
	Message,
	strikethrough,
} from 'discord.js';
import { UpdateResult } from 'kysely';
import { sendMessageToChannel } from '../exchange/sendMessageToChannel';
import type { ICommand } from '../ICommand';
import { Channel } from '../model/Channel';
import { DatabaseManager } from '../model/database';
import { Match } from '../model/Match';
import { ParticipantRow } from '../model/participants.table';
import { ParticipantState } from '../ParticipantState';
import logger, { logAndReturnMessage } from '../utils/logger';
import { showCommandUsage } from '../utils/showCommandUsage';
import { brjoin, p, passage } from '../utils/text';

import { printChannelContext } from '../exchange/printMessage';
import { Shipment } from '../model/Shipment';
import { isGuildTextChannel } from '../utils/discord/isGuildTextChannel';
import shippedCommand from './shipped';

function gifteeAnInvalidShipmentNumberWasProvided(
	shipments: Shipment<false>[]
): string {
	return passage(
		p(
			`You specified an invalid shipment.`,
			`Either that shipment doesn't exist, or it's already marked as received.`,
			`Please provide a shipment number between 1 and ${shipments.length}.`
		),
		printShipments(shipments)
	);
}

function santaYourMatchHasReceivedAShipment(
	shipment: Shipment<false>
): string {
	return passage(
		p(
			`Your match has received your gift with tracking number ${shipment.tracking_number}.`
		)
	);
}

const markShipmentReceived = (
	shipment_id: bigint
): Promise<UpdateResult> => {
	return DatabaseManager.getInstance()
		.updateTable('shipments')
		.set({
			received: true,
		})
		.where('shipment_id', '=', shipment_id)
		.executeTakeFirst();
};

const printShipments = (shipments: Shipment[]) =>
	brjoin(
		bold(`Here are the shipments from your Secret Santa...`),
		...shipments.map((shipment, idx) => {
			return shipment.received
				? strikethrough(
						`Shipment ${idx + 1}. ${inlineCode(
							shipment.tracking_number ?? ''
						)} received at ${shipment.updated}`
				  )
				: `Shipment ${idx + 1}. ${inlineCode(
						shipment.tracking_number ?? ''
				  )} shipped at ${shipment.created}`;
		})
	);

const gifteeNoOutstandingGifts = passage(
	p(
		`Either your Secret Santa hasn't shipped your gift, or you've already marked all shipments as received!`,
		`Try this command again once you've received a shipping notification.`
	)
);
const santaNoOutstandingGifts = passage(
	p(
		`Your match just tried to mark a gift as received, but there aren't any known shipments...`
	),
	brjoin(
		italic(`To mark a gift as shipped, reply...`),
		inlineCode(`santa! shipped USPS 00001111222233334444`)
	)
);
const gifteeOneShipmentReceived = passage(
	p(`Your gift has been marked as received!`)
);
const santaOneShipmentReceived = passage(
	p(
		`Your giftee has received their gift!`,
		`Thank you for participating in this Secret Santa exchange!`
	)
);
const gifteeAShipmentMarkedAsReceived = passage(
	p(`This shipment has been marked as received!`)
);

const command: ICommand = {
	name: 'received',
	usage: 'received [shipment number]',
	description:
		'Mark your gift as received. Include shipment number if your Santa has sent more than one shipment.',

	allowAfter: ParticipantState.SHIPPED_BY_SANTA,

	allowOwner: false,
	allowAdmin: false,
	showInHelp: false,
	respondInChannelTypes: ['participant'],

	async execute(
		guild: Guild,
		messageFromGiftee: Message,
		subcommand: string,
		gifteeParticpant: ParticipantRow
	): Promise<Message[]> {
		logAndReturnMessage(messageFromGiftee, '`received` command');
		const dChannel = messageFromGiftee.channel;

		if (!isGuildTextChannel(dChannel)) {
			logger.verbose(
				`[received] recieved message from non-guild/non-text channel. ${printChannelContext(
					dChannel
				)}`
			);
			return Promise.reject(
				`[received] Channel ${dChannel.id} cannot be used to mark shipments as received.`
			);
		}

		return Channel.fromDiscordChannelId(dChannel.id)
			.then((ch) => {
				logger.verbose(
					`[received] getting match for channel's participant, ${ch.participant_id}`
				);
				return Match.fromGifteeParticipantId(ch.participant_id).then(
					(match) =>
						Promise.all([
							match.getGifteeParticipant(),
							match.getSantaParticipant(),
							match.getShipments(),
						]).then(([giftee, santa, shipments]) => {
							logger.verbose(
								`[received]    got [match ${match.match_id}]: [santa ${santa.participant_id}], [giftee ${giftee.participant_id}], [shipments: ${shipments.length}]`
							);
							return {
								match,
								santa,
								giftee,
								shipments,
							};
						})
				);
			})
			.then(async ({ santa, match, giftee, shipments }) => {
				logger.verbose(
					`[received]    found ${shipments.length} shipments [match ${match.match_id}] => [santa ${match.santa_participant_id}] and [giftee ${match.giftee_participant_id}]`
				);
				shipments.forEach((shipment, idx) => {
					logger.verbose(
						`[received]       ${
							idx + 1
						}. Shipped ${shipment.created.toLocaleString()} with tracking # '${
							shipment.tracking_number
						}'. Received? ${shipment.received} [match ${
							match.match_id
						}] [shipment ${shipment.shipment_id}]`
					);
				});

				const notReceivedYet = shipments.filter(
					(shipment) => shipment.received === false
				);

				logger.verbose(
					`[received]    ${notReceivedYet.length} of ${shipments.length} have not been received. [match ${match.match_id}] `
				);

				const toMarkReceived: Shipment[] = [];
				const toTellSanta: string[] = [];
				const toTellGiftee: string[] = [];

				// if no outstanding shipments
				if (notReceivedYet.length === 0) {
					// reply that santa hasn't marked their gift as shipped
					toTellGiftee.push(gifteeNoOutstandingGifts);
					// remind santa to ship their gift
					toTellSanta.push(santaNoOutstandingGifts);
				} else if (notReceivedYet.length === 1) {
					// if one shipment
					//    mark as received
					const santaMember = await guild.members.fetch(
						santa.discord_user_id
					);
					toMarkReceived.push(notReceivedYet[0].setReceived(true));
					
					toTellGiftee.push(gifteeOneShipmentReceived);
					if (santaMember) {
						toTellGiftee.push(
							`Your Secret Santa was ${santaMember.displayName}!`
						);
					}
					toTellGiftee.push(
						`Thank you for participating in this Secret Santa exchange!`
					);

					toTellSanta.push(santaOneShipmentReceived);
				} else {
					// if many shipments
					const shipmentNum = parseInt(subcommand, 10);
					logger.verbose(
						`[received]    giftee has many shipments; attempted to parse '${subcommand}' to number: (${shipmentNum}) [match ${match.match_id}]`
					);
					//    if no index specified
					if (
						!isNaN(shipmentNum) &&
						0 < shipmentNum &&
						shipmentNum <= shipments.length
					) {
						logger.verbose(
							`[received]       ${shipmentNum} is numeric and is within the position bounds of shipment array [match ${match.match_id}]`
						);

						//    else if index supplied AND index in array
						const shipmentIdx = shipmentNum - 1;
						const shipment = shipments[shipmentIdx];
						if (shipment) {
							toMarkReceived.push(shipment.setReceived(true));

							toTellGiftee.push(gifteeAShipmentMarkedAsReceived);
							toTellSanta.push(
								santaYourMatchHasReceivedAShipment(shipment)
							);
							if (notReceivedYet.length > 1) {
								toTellGiftee.push(
									passage(
										p(
											`There are still ${
												notReceivedYet.length - 1
											} packages for you to receive/mark as received!`
										),
										printShipments(shipments)
									)
								);
								toTellSanta.push(
									passage(
										p(
											`Your match is still expecting ${
												notReceivedYet.length - 1
											} gifts from you!`
										)
									)
								);
							}
						} else {
							// reply that an invalid shipment number was provided
							toTellGiftee.push(
								gifteeAnInvalidShipmentNumberWasProvided(shipments)
							);
						}
					} else {
						logger.verbose(
							`[received]       '${subcommand}' could not be parsed as a valid number! [match ${match.match_id}]`
						);
						toTellGiftee.push(
							passage(
								p(
									`An invalid shipment number was provided!`,
									`Please specify a shipment number between 1 and ${shipments.length}`
								),
								printShipments(shipments)
							)
						);
					}
				}

				return Promise.all(
					toMarkReceived.map((shipment) =>
						markShipmentReceived(shipment.shipment_id)
					)
				)
					.then((shipments) =>
						messageFromGiftee
							.reply(passage(toTellGiftee))
							.then(logAndReturnMessage)
					)
					.then((replyToGiftee) => {
						if (toTellSanta.length > 0) {
							return sendMessageToChannel(
								guild,
								santa,
								'participant',
								passage(toTellSanta)
							)
								.then(logAndReturnMessage)
								.then((messageToSanta) => [replyToGiftee, messageToSanta]);
						} else {
							return Promise.resolve([replyToGiftee]);
						}
					});
			});
	},
};

export default command;
