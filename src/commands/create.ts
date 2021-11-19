import * as Discord from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { ICommand } from '../ICommand';
const { query } = require('../mysql');
const config = require('../config.json');
import { Methods } from '../utils/methods';
import { addNewExchange } from '../utils/addNewExchange';

const command: ICommand = {
	name: 'create',
	aliases: [''],
	usage: 'create',
	description: 'Creates a new secret santa for everyone to join.',
	hasArgs: false,
	requirePartner: false,
	worksInDM: false,
	forceDMsOnly: false,
	modOnly: false,
	adminOnly: false,
	guildModsOnly: true,

	async execute(message, args, prefix) {
		const row = (
			await query(
				`SELECT * FROM users WHERE userId = ${message.author.id}`
			)
		)[0];

		if (row.exchangeId !== 0)
			return message.reply(
				'You are already in a Secret Santa! Ask the creator of the secret santa to cancel it before making a new one.'
			);

		const embed = new MessageEmbed()
			.setTitle(
				'__' +
					message.member!.displayName +
					' started a new Secret Santa!__'
			)
			.setDescription('React with 🎅 to join!')
			.setFooter(
				message.member!.displayName +
					' can draw names with ' +
					config.prefix +
					'start'
			)
			.setColor(config.embeds_color);

		const botMessage = await message.channel.send(embed);
		try {
			await botMessage.react('🎅');
		} catch (err) {}

		await query(
			`UPDATE users SET exchangeId = ${botMessage.id} WHERE userId = ${message.author.id}`
		);
		await addNewExchange(botMessage.id, message.author.id);
	},
} as ICommand;

export default command;
