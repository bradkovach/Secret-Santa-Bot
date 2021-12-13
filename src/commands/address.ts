import { Message, MessageEmbed } from 'discord.js';
import { ICommand } from '../ICommand';
import { query } from '../mysql';
import { ExchangeRow } from '../rows/ExchangeRow';
import { UserRow } from '../rows/UserRow';
import logger from '../utils/logger';

const command: ICommand = {
	name: 'address',
	aliases: ['setaddress'],
	usage: 'address 1234 Your Street; Boston, MA 02134',
	description:
		'Enter your address so your Secret Santa can ship your gift.',
	hasArgs: true,
	requirePartner: false,
	worksInDM: true,
	forceDMsOnly: true,
	modOnly: false,
	adminOnly: false,

	async execute(message: Message, args: string[], prefix: string) {
		var addressToSet = args.join(' ');

		if (addressToSet.length >= 1000) {
			return message.reply(
				'Your address can only be a maximum of 1000 characters long!'
			);
		}

		let oldUserRow = (
			await query<UserRow[]>(`SELECT * FROM users WHERE userId = ?`, [
				message.author.id,
			])
		)[0];

		await query<never>(
			`UPDATE users SET address = ?, standardized_address = ''  WHERE userId = ?`,
			[addressToSet, message.author.id]
		);

		const exchangeAndSanta = (
			await query<({ santaId: number } & ExchangeRow)[]>(
				`SELECT Exchange.*, User.userId as santaId
			FROM users User
			INNER JOIN exchange Exchange on User.exchangeId = Exchange.exchangeId
			WHERE User.partnerId = ?`,
				message.author.id
			)
		)[0];

		if (exchangeAndSanta && exchangeAndSanta.started === 1) {
			let santaDiscordUser = await message.client.users.fetch(
				exchangeAndSanta.santaId.toString()
			);

			if (santaDiscordUser) {
				santaDiscordUser.send(
					new MessageEmbed()
						.setTitle('Giftee Address Changed')
						.setDescription(
							`Your giftee, @${message.author.tag}, just updated their address.`
						)
						.addField('Updated Address', addressToSet)
				);
			}
		}

		message.reply(
			'**Successfully set your address to:**\n\n' + addressToSet
		);

		logger.info(
			`[address] Updated ${message.author.tag} (${message.author.id}) address to '${addressToSet}'; Old value '${oldUserRow.address}'`
		);
	},
};

export default command;
