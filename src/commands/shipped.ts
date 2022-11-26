import { Message } from 'discord.js';
import { query } from '../mysql';
import { UserRow } from '../rows/UserRow';
import config from '../config.json';
import receivedCommand from './received';
import type { ICommand } from '../ICommand';
import logger from '../utils/logger';
import { getUserById } from '../sql/queries';
import { logUser as u } from '../utils/discord';

const command: ICommand = {
	name: 'shipped',
	aliases: ['setshipped'],
	usage: 'shipped <tracking number>',
	description: 'Mark your gift as shipped.',
	hasArgs: false,
	requirePartner: false,
	worksInDM: true,
	forceDMsOnly: true,
	modOnly: false,
	adminOnly: false,

	async execute(
		shippingNotificationMessage: Message,
		args: string[],
		prefix: string
	) {
		const santaRow = (
			await query<UserRow[]>(getUserById, [
				shippingNotificationMessage.author.id,
			])
		)[0];
		if (!santaRow) {
			return await shippingNotificationMessage
				.reply('Problem fetching your santa details')
				.then((newMessage) =>
					logger.error(
						`[shipped] Unable to find santa with id ${shippingNotificationMessage.author.id}.`
					)
				);
		}

		const gifteeRow = (
			await query<UserRow[]>(getUserById, [santaRow.partnerId])
		)[0];
		if (!gifteeRow) {
			return await shippingNotificationMessage
				.reply('Problem fetching your giftee details.')
				.then((newMessage) =>
					logger.error(
						`[shipped] Unable to find giftee with id ${santaRow.partnerId}.`
					)
				);
		}

		const santa = await shippingNotificationMessage.client.users.fetch(
			santaRow.userId.toString()
		);
		if (!santa) {
			return logger.error(
				`Unable to fetch() Santa by ${santaRow.userId} in Discord.`
			);
		}

		const giftee = await shippingNotificationMessage.client.users.fetch(
			gifteeRow.userId.toString()
		);
		if (!giftee) {
			return await shippingNotificationMessage
				.reply('Unable to find your giftee in Discord')
				.then((newMessage) =>
					logger.error(
						`[shipped] Unable to fetch() Giftee by ${gifteeRow.userId} in Discord.`
					)
				);
		}

		if (args && args[0] && args[0].trim() !== '') {
			const trackingNumber = args.join(' ');
			// store the tracking number in the santaRow
			query<never>(
				`UPDATE users SET tracking_number = ? WHERE userId = ?`,
				[trackingNumber, santaRow.userId]
			);

			// send the giftee a message
			const gifteeNotification = await giftee.send(
				[
					'**Your Secret Santa has shipped your gift!**',
					'',
					`You can track your gift with tracking number ${trackingNumber}. Please mark your gift as received by replying \`${config.prefix}${receivedCommand.name}\`.`,
				].join('\n')
			);

			if (!gifteeNotification) {
				return await shippingNotificationMessage.reply(
					'Unable to notify your giftee about your shipment. Try again later.'
				);
			} else {
				logger.info(
					`[shipped] ${u(santa)} shipped their gift to ${u(
						giftee
					)} with tracking number ${trackingNumber}.`
				);
			}

			return await shippingNotificationMessage.react('📦');
		} else {
			return await shippingNotificationMessage.reply(
				`To mark your gift as shipped, include a tracking number in the format \`${config.prefix}${this.name} <tracking number>\`.`
			);
		}
	},
} as ICommand;

export default command;
