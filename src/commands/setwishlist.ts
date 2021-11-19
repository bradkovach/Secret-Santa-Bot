import { Message } from "discord.js";
import { query } from "../mysql";

export default{
	name: 'setwishlist',
	aliases: ['wishlist'],
	description: 'Edit your preferences so your Secret Santa knows what to get you!',
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

		await query<never>(`UPDATE users SET wishlist = ? WHERE userId = ${message.author.id}`, [
			wishlistToSet,
		]);

		message.reply('**Successfully set your preferences to:**\n\n' + wishlistToSet);
	},
};
