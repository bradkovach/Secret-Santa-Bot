import { Message } from 'discord.js';
import { ICommand } from '../ICommand';
import { query } from '../mysql';
import { ExchangeRow } from '../rows/ExchangeRow';
import { UserRow } from '../rows/UserRow';

const command: ICommand = {
	name: 'cancel',
	aliases: ['stop'],
	usage: 'cancel',
	description:
		'Cancels your current Secret Santa, so long as you created it.',
	hasArgs: false,
	requirePartner: false,
	worksInDM: true,
	forceDMsOnly: false,
	modOnly: false,
	adminOnly: false,

	async execute(
		message: Message,
		args: string[],
		prefix: string
	): Promise<Message | undefined> {
		console.log('execute() cancel command');
		const row = (
			await query<UserRow[]>(
				`SELECT * FROM users WHERE userId = ${message.author.id}`
			)
		)[0];
		const exchangeRow = (
			await query<(UserRow & ExchangeRow)[]>(
				`SELECT * FROM users INNER JOIN exchange ON users.exchangeId = exchange.exchangeId WHERE userId = ${message.author.id}`
			)
		)[0];

		if (row.exchangeId == 0)
			return message.reply("You aren't in a Secret Santa.");
		else if (!exchangeRow || exchangeRow.userId !== exchangeRow.creatorId)
			return message.reply(
				"You can't cancel a Secret Santa that you didn't create.\n\nAsk `" +
					(
						await message.client.users.fetch(
							exchangeRow.creatorId.toString()
						)
					).tag +
					'` to cancel it.'
			);

		await query<never>(
			`DELETE FROM exchange WHERE exchangeId = ${exchangeRow.exchangeId}`
		);
		await query<never>(
			`UPDATE users SET partnerId = 0 WHERE exchangeId = ${exchangeRow.exchangeId}`
		);
		await query<never>(
			`UPDATE users SET exchangeId = 0 WHERE exchangeId = ${exchangeRow.exchangeId}`
		);
		message.reply('Successfully cancelled your Secret Santa.');
	},
};

export default command;
