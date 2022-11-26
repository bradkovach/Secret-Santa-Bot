import { Message } from 'discord.js';
import type { ICommand } from '../ICommand';
import { getAttachments } from '../utils/getAttachments';
import logger from '../utils/logger';

import Discord from 'discord.js';
import { query } from '../mysql';
import config from '../config.json';
import { UserRow } from '../rows/UserRow';
import { ExchangeRow } from '../rows/ExchangeRow';
import { getUserById } from '../sql/queries';
import { logUser as u } from '../utils/discord';

const command: ICommand = {
	name: 'message',
	aliases: [''],
	usage: 'message <giftee|santa> <message>',
	description: 'Message your secret santa or giftee.',
	hasArgs: true,
	requirePartner: true,
	worksInDM: true,
	forceDMsOnly: true,
	modOnly: false,
	adminOnly: false,

	async execute(message: Message, args: string[], prefix: string) {
		const userRow = (
			await query<UserRow[]>(getUserById, [message.author.id])
		)[0];
		const santaRow = (
			await query<UserRow[]>(`SELECT * FROM users WHERE partnerId = ?`, [
				message.author.id,
			])
		)[0];

		const recipient = args[0].toLowerCase();
		const usageMessage = [
			`You need to specify who you're going to message! \`${prefix}${this.usage}\``,
			'',
			`giftee - the person you were chosen to get a gift for (<@${userRow.partnerId}>).`,
			`santa - the person gifting you (secret).`,
		].join('\n');

		if (userRow.exchangeId == 0) {
			return message.reply("You aren't in a Secret Santa.");
		} else if (!args.length) {
			return message.reply(usageMessage);
		} else if (
			recipient !== 'giftee' &&
			recipient !== 'santa' &&
			recipient !== 'all'
		) {
			return message.reply(usageMessage);
		} else if (recipient == 'giftee') {
			const content = args.slice(1).join(' ');
			const gifteeEmbed = new Discord.MessageEmbed()
				.setTitle(
					'__You received an anonymous message from your Secret Santa!__'
				)
				.setDescription('\n' + content)
				.setColor(config.embeds_color)
				.setFooter(
					`You can respond with \`${prefix}${this.name} santa <message>\`.`
				)
				.setThumbnail(
					'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/father-christmas_1f385.png'
				);

			try {
				const giftee = await message.client.users.fetch(
					userRow.partnerId.toString()
				);
				await giftee
					.send(getAttachments(message, gifteeEmbed))
					.then((newMessage) =>
						logger.info(
							`[message] Santa ${u(
								message.author
							)} sent a message to giftee @${u(giftee)}. m${
								newMessage.id
							}: '${content}'`
						)
					);

				message.reply(
					'Successfully sent your message anonymously to ' +
						giftee.toString()
				);
			} catch (err) {
				logger.error(
					`[message] Error sending message from Santa [${u(
						message.author
					)}] to Giftee ${userRow.partnerId}: ${err}`
				);
				message.reply('Error sending message: ```' + err + '```');
			}
		} else if (recipient == 'santa') {
			const content = args.slice(1).join(' ');
			const santaEmbed = new Discord.MessageEmbed()
				.setTitle(
					`__You received a message from your giftee, ${message.author.tag}.__`
				)
				.setDescription('\n' + content)
				.setColor(config.embeds_color)
				.setFooter(
					'You can respond with ' + prefix + 'message giftee <message>'
				)
				.setThumbnail(
					'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/incoming-envelope_1f4e8.png'
				);

			try {
				const santa = await message.client.users.fetch(
					santaRow.userId.toString()
				);
				await santa
					.send(getAttachments(message, santaEmbed))
					.then((newMessage) =>
						logger.info(
							`[message] Giftee ${u(message.author)} sent a message (${
								newMessage.id
							}) to Santa ${u(santa)}: '${content}'`
						)
					);

				message.reply('Successfully sent message to your Secret Santa!');
			} catch (err) {
				message.reply('Error sending message: ```' + err + '```');
				logger.error(
					`[message] Error sending message from Giftee ${message.author} to Santa ${santaRow.userId}: ${err}`
				);
			}
		} else if (
			recipient === 'all' &&
			// author must be a configured admin
			config.adminUsers.indexOf(message.author.id) > -1
		) {
			// message everyone!

			const participantRows = await query<UserRow[]>(
				`SELECT * FROM users`
			);
			const content = args.slice(1).join(' ');

			Promise.all(
				participantRows.map(async (participantRow) => {
					const user = await message.client.users.fetch(
						participantRow.userId.toString()
					);

					let embed = new Discord.MessageEmbed()
						.setTitle(`New Admin Message from ${message.author.tag}`)
						.setDescription(content);

					return user.send(embed).then(
						(success) =>
							logger.info(
								`[message][all] Admin message sent to ${u(user)}.`
							),
						(error) =>
							logger.error(
								`[message][all] Unable to send admin message to ${u(
									user
								)}).`
							)
					);
				})
			).then((allSuccess) => {
				message.reply(
					`Admin message successfully sent to ${participantRows.length} users.`
				);
				logger.info(
					`[message] Sent admin message to ${participantRows.length} users.`
				);
			});
		}
	},
};

export default command;
