import { MessageEmbed } from 'discord.js';
import { Message } from 'discord.js';
import { ICommand } from '../ICommand';
import { query } from '../mysql';
import { ExchangeRow } from '../rows/ExchangeRow';
import { UserRow } from '../rows/UserRow';
import logger from '../utils/logger';

const command: ICommand = {
	name: 'profile',
	aliases: ['wishlist', 'setwishlist'],
	usage:
		'profile Description of you including your likes, dislikes, allergies, hobbies, pets, etc',
	description:
		'Tell a little about yourself so your Secret Santa knows what to get you!',
	hasArgs: true,
	requirePartner: false,
	worksInDM: true,
	forceDMsOnly: true,
	modOnly: false,
	adminOnly: false,

	async execute(message: Message, args: string[], prefix: string) {
		var wishlistToSet = args.join(' ');

		if (wishlistToSet.length >= 1000) {
			return message.reply(
				'Your wishlist can only be a maximum of 1000 characters long!'
			);
		}

		let oldUserRow = (
			await query<UserRow[]>(
				`SELECT * FROM users WHERE userId = ?`,
				message.author.id
			)
		)[0];

		await query<never>(`UPDATE users SET wishlist = ? WHERE userId = ?`, [
			wishlistToSet,
			message.author.id,
		]);

		const exchangeAndSanta = (
			await query<({ santaId: number } & ExchangeRow)[]>(
				`SELECT Exchange.*, User.userId as santaId
			FROM users User
			INNER JOIN exchange Exchange on User.exchangeId = Exchange.exchangeId
			WHERE User.partnerId = ?`,
				[message.author.id]
			)
		)[0];

		if (exchangeAndSanta && exchangeAndSanta.started === 1) {
			let santaDiscordUser = await message.client.users.fetch(
				exchangeAndSanta.santaId.toString()
			);

			if (santaDiscordUser) {
				santaDiscordUser
					.send(
						new MessageEmbed()
							.setTitle('Giftee Profile Changed')
							.setDescription(
								`Your giftee, @${message.author.tag}, just updated their profile.`
							)
							.addField('Updated Profile', wishlistToSet)
					)
					.then((newMessage) =>
						logger.info(
							`Notified (${newMessage.id}) Santa, ${santaDiscordUser.tag} (${santaDiscordUser.id}), of giftee, ${message.author.tag} (${message.author.id}), profile change`
						)
					);
			}
		}

		message.reply(
			'**Successfully set your profile to:**\n\n' + wishlistToSet
		);

		logger.info(
			`[profile] Updated ${message.author.tag} profile to '${wishlistToSet}'; Old value '${oldUserRow.wishlist}'`
		);
	},
};

export default command;
