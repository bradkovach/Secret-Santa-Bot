import { Message } from 'discord.js';
import { query } from '../mysql';
import { UserRow } from '../rows/UserRow';
import config from '../config.json';
import { ICommand } from '../ICommand';
import logger from '../utils/logger';

const command: ICommand = {
	name: 'received',
	aliases: ['setreceived'],
	usage: 'received',
	description: 'Mark your gift as received.',
	hasArgs: false,
	requirePartner: false,
	worksInDM: true,
	forceDMsOnly: true,
	modOnly: false,
	adminOnly: false,

	async execute(
		receiptNotificationMessage: Message,
		args: string[],
		prefix: string
	) {
		const santaRow = (
			await query<UserRow[]>(
				`SELECT * 
				FROM users 
				WHERE partnerId = ? 
				AND received = 0`,
				[receiptNotificationMessage.author.id]
			)
		)[0];
		if (!santaRow) {
			return await receiptNotificationMessage.reply(
				'There was a problem marking your package as received!  Did your Santa send it?'
			);
		}

		const updateResult = await query<never>(
			`UPDATE users SET received = 1 WHERE partnerId = ?`,
			[receiptNotificationMessage.author.id]
		);
		console.log({ updateResult });

		const santa = await receiptNotificationMessage.client.users.fetch(
			santaRow.userId.toString()
		);
		if (!santa) {
			console.log(`Unable to find santa ${santaRow.userId} in Discord.`);
		}

		const giftee = receiptNotificationMessage.author;
		if (!giftee) {
			console.log(`There was a problem with the giftee object.`);
		}

		return await Promise.all([
			santa
				.send(
					[
						`Your giftee, ${giftee.toString()}, has received their gift!`,
						`Thank you for participating in Secret Santa!`,
					].join(' ')
				)
				.then((message) =>
					Promise.all([
						message.react('📦'),
						message.react('📤'),
						message.react('✅'),
					])
				),
			giftee
				.send(
					[
						`Your gift has been marked as received and your Secret Santa has been notified!`,
						`Your secret santa was ${santa.toString()}.`,
					].join(' ')
				)
				.then((message) =>
					Promise.all([
						message.react('📦'),
						message.react('📥'),
						message.react('✅'),
					])
				),
		]).then((allSent) =>
			logger.info(
				`[received] Giftee ${giftee.tag} (${giftee.id}) has received their gift from ${santa.tag} (${santa.id}).`
			)
		);
	},
};

export default command;
