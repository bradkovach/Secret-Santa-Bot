import { Message } from 'discord.js';
import { ICommand } from '../ICommand';
import { query } from '../mysql';

const command: ICommand = {
	name: 'address',
	aliases: ['setaddress'],
	usage: 'address <your shipping address>',
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
		console.log('address.execute(message, args, prefix)', { args });

		if (addressToSet.length >= 1000) {
			return message.reply(
				'Your address can only be a maximum of 1000 characters long!'
			);
		}

		await query<never>(
			`UPDATE users SET address = ? WHERE userId = ${message.author.id}`,
			[addressToSet]
		);

		message.reply(
			'**Successfully set your address to:**\n\n' + addressToSet
		);
	},
};

export default command;
