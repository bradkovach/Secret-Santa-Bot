import { Message } from 'discord.js';
import { ICommand } from '../ICommand';
import { query } from '../mysql';
import { ExchangeRow } from '../rows/ExchangeRow';
import { UserRow } from '../rows/UserRow';
import { getUserById } from '../sql/queries';
import logger from '../utils/logger';
import { pickRandom } from '../utils/pickRandom';

const config = require('../config.json');

const command: ICommand = {
	name: 'start',
	aliases: [''],
	usage: 'start',
	description: 'Assigns everyone a random gift partner!',
	hasArgs: false,
	requirePartner: false,
	worksInDM: true,
	forceDMsOnly: false,
	modOnly: false,
	adminOnly: false,

	async execute(message: Message, args: string[], prefix: string) {
		const row = (
			await query<UserRow[]>(getUserById, [message.author.id])
		)[0];
		const exchangeRow = (
			await query<(UserRow & ExchangeRow)[]>(
				`SELECT * 
        FROM users 
        INNER JOIN exchange ON users.exchangeId = exchange.exchangeId 
        WHERE userId = ?`,
				[message.author.id]
			)
		)[0];

		if (row.exchangeId == 0) {
			return message.reply("You aren't in a Secret Santa.");
		} else if (
			!exchangeRow ||
			exchangeRow.userId !== exchangeRow.creatorId
		) {
			return message.reply(
				"You can't start a Secret Santa that you didn't create.\n\nAsk `" +
					(
						await message.client.users.fetch(
							exchangeRow.creatorId.toString()
						)
					).tag +
					'` to start it.'
			);
		} else if (exchangeRow.started == 1) {
			return message.reply('The Secret Santa has already started!');
		}

		await query(`UPDATE exchange SET started = 1 WHERE exchangeId = ?`, [
			exchangeRow.exchangeId,
		]);
		const botMsg = await message.reply(
			'Shuffling participants and messaging...'
		);

		await pickRandom(message, exchangeRow.exchangeId, prefix);

		botMsg
			.edit('Successfully started your Secret Santa!')
			.then((newMessage) =>
				logger.info(
					`[start] Secret Santa exchange started by ${message.author.tag} (${message.author.id}).`
				)
			);
	},
};

export default command;
