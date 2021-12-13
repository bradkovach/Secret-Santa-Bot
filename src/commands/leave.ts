import { Message } from 'discord.js';
import { ICommand } from '../ICommand';
import { query } from '../mysql';
import { UserRow } from '../rows/UserRow';
import { getUserById } from '../sql/queries';
import logger from '../utils/logger';

const command: ICommand = {
	name: 'leave',
	aliases: ['quit'],
	usage: 'leave',
	description: 'Withdraw from the secret santa gift exchange.',
	hasArgs: false,
	requirePartner: false,
	worksInDM: true,
	forceDMsOnly: true,
	modOnly: false,
	adminOnly: false,

	async execute(message: Message, args: string[], prefix: string) {
		const users = await query<UserRow[]>(getUserById, [message.author.id]);
		if (users && users[0]) {
			const user = users[0];
			if (user.partnerId !== 0) {
				message.reply(
					`The secret santa exchange has already started! Please talk to one of the admins to leave the exchange.`
				);
			} else {
				await query<never>(
					`DELETE FROM users WHERE partnerId = '' AND userId = ?`,
					[message.author.id]
				);
				message.reply(
					`You are no longer participating in this Secret Santa exchange! To rejoin, just unreact and react to the announcement post.`
				);
				logger.info(
					`[leave] ${message.author.tag} (${message.author.id}) has left the Secret Santa Exchange, ${user.exchangeId}`
				);
			}
		}
	},
};

export default command;
