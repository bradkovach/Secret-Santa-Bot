import { Message } from 'discord.js';
import { query } from '../mysql';
import { UserRow } from '../rows/UserRow';
import config from '../config.json';
import receivedCommand from './received';
import { ICommand } from '../ICommand';

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
			await query<UserRow[]>(
				`SELECT * FROM users WHERE userId = ${shippingNotificationMessage.author.id}`
			)
		)[0];
		if (!santaRow) {
			return await shippingNotificationMessage.reply(
				'Problem fetching your santa details'
			);
		}

		const gifteeRow = (
			await query<UserRow[]>(
				`SELECT * FROM users WHERE userId = ${santaRow.partnerId}`
			)
		)[0];
		if (!gifteeRow) {
			return await shippingNotificationMessage.reply(
				'Problem fetching your giftee details.'
			);
		}

		const santa = await shippingNotificationMessage.client.users.fetch(
			santaRow.userId.toString()
		);
		if (!santa) {
			return console.log('Unable to find santa in Discord.');
		}

		const giftee = await shippingNotificationMessage.client.users.fetch(
			gifteeRow.userId.toString()
		);
		if (!giftee) {
			return await shippingNotificationMessage.reply(
				'Unable to find your giftee in Discord'
			);
		}

		if (args && args[0] && args[0].trim() !== '') {
			const trackingNumber = args[0].trim();
			// store the tracking number in the santaRow
			query<never>(
				`UPDATE users SET tracking_number = ? WHERE userId = ${santaRow.userId}`,
				trackingNumber
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
					'Unable to notify your giftee about your package. Try again later.'
				);
			} else {
				console.log(
					`Notified ${giftee.username} that ${santa.username} shipped their gift with tracking number ${trackingNumber}.`
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
