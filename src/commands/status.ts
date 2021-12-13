import { Message, MessageEmbed } from 'discord.js';
import { ICommand } from '../ICommand';
import { query } from '../mysql';
import { UserRow } from '../rows/UserRow';
import { getUserById } from '../sql/queries';
import logger from '../utils/logger';

import addressCommand from './address';
import profileCommand from './setwishlist';

const command: ICommand = {
	name: 'status',
	aliases: ['state'],
	usage: 'status',
	description: 'Show your enrollment status in the gift exchange.',
	hasArgs: false,
	requirePartner: false,
	worksInDM: true,
	forceDMsOnly: true,
	modOnly: false,
	adminOnly: false,

	async execute(message: Message, args: string[], prefix: string) {
		const users = await query<UserRow[]>(getUserById, [message.author.id]);
		if (users && users[0]) {
			const userRow = users[0];

			const embed = new MessageEmbed()
				.setTitle(`Your Participation Status`)
				.setDescription(
					[
						userRow.address.trim() === ''
							? `❌ You have not provided your address to the Santa bot.  A shipping address is required for participation! To set your address, send \`${prefix}${addressCommand.usage}\`.`
							: `✅ You have provided your address to the Secret Santa bot. To change, reply \`${prefix}${addressCommand.usage}\`.`,
						userRow.wishlist.trim() === ''
							? `❌ You have not provided your participant profile to the Santa bot!  Your profile is used to help your Santa pick a great gift for you.  To set your profile, send \`${prefix}${profileCommand.usage}\`.`
							: `✅ You have provided your profile to the Secret Santa bot. To change it, reply \`${prefix}${profileCommand.usage}\`.`,
					].join('\n\n')
				)
				.addField(
					'Provided Address',
					userRow.address.trim() === ''
						? `*not set*`
						: userRow.address.trim()
				)
				// .addField('Validated Address', userRow.standardized_address === '' ? `*not processed*` : message.author.username + '\n' + userRow.standardized_address.trim())
				.addField(
					'Profile',
					userRow.wishlist.trim() === ''
						? `*not set*`
						: userRow.wishlist.trim()
				);

			message
				.reply({
					content: [
						`Hello, ${message.author.username}!`,
						'',
						userRow.wishlist.trim() === '' || userRow.address.trim() === ''
							? '**At this time, you will not be selected for matching.**  Please submit your address and profile before December 4 at 7:00 PM EST!'
							: `You're all set for matching.  You will get a DM from this bot when gift assignments are made!`,
					].join('\n'),
					embed,
				})
				.then((replyMessage) =>
					logger.info(
						`[status] Sent status message to ${message.author.tag} (${message.author.id})`
					)
				);
		}
	},
};

export default command;
