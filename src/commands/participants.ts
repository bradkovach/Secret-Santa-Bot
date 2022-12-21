import { Message } from 'discord.js';
import type { ICommand } from '../ICommand';

const command: ICommand = {
	name: 'participants',
	usage: 'participants',
	description: 'Show who is participating in your Secret Santa.',

	allowOwner: true,
	allowAdmin: true,
	showInHelp: false,
	respondInChannelTypes: ['participant'],

	async execute() {
		// const row = (
		// 	await query(
		// 		`SELECT * FROM users WHERE userId = ${message.author.id}`
		// 	)
		// )[0];
		// const rows = await query(
		// 	`SELECT * FROM users WHERE exchangeId = ${row.exchangeId}`
		// );
		// const exchangeRow = (
		// 	await query(
		// 		`SELECT * FROM exchange WHERE exchangeId = ${row.exchangeId}`
		// 	)
		// )[0];
		// if (row.exchangeId == 0) {
		// 	return message.reply("You aren't in a Secret Santa.");
		// }
		// var userTags = [];
		// for (var i = 0; i < rows.length; i++) {
		// 	userTags.push(
		// 		(await message.client.users.fetch(rows[i].userId)).tag
		// 	);
		// }
		// const embed = new Discord.MessageEmbed()
		// 	.setTitle('__Participants__')
		// 	.setDescription(
		// 		userTags.map((user, index) => index + 1 + '. ' + user).join('\n')
		// 	)
		// 	.setColor(config.embeds_color)
		// 	.setFooter(
		// 		'Started by ' +
		// 			(await message.client.users.fetch(exchangeRow.creatorId))
		// 				.username
		// 	);
		// message.channel.send(embed);
	},
};

export default command;
