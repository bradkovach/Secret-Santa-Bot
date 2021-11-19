import { Message } from 'discord.js';
import { ICommand } from '../ICommand';
import { query } from '../mysql';

const command: ICommand = {
	name: 'profile',
	aliases: ['wishlist', 'setwishlist'],
	usage:
		'profile <description of you including your likes, dislikes, allergies, hobbies, pets, etc>',
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

		await query<never>(
			`UPDATE users SET wishlist = ? WHERE userId = ${message.author.id}`,
			[wishlistToSet]
		);

		message.reply(
			'**Successfully set your preferences to:**\n\n' + wishlistToSet
		);
	},
};

export default command;
