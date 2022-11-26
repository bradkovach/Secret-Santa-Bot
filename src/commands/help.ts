import { MessageEmbed } from 'discord.js';
import { EmbedFieldData } from 'discord.js';
import { Message } from 'discord.js';
import type { ICommand } from '../ICommand';

import Discord from 'discord.js';
import config from '../config.json';

function code(subject: string) {
	return `\`${subject}\``;
}

const command: ICommand = {
	name: 'help',
	aliases: [''],
	usage: 'help',
	description: 'Shows all bot commands.',
	hasArgs: false,
	requirePartner: false,
	worksInDM: true,
	forceDMsOnly: false,
	modOnly: false,
	adminOnly: false,

	async execute(message: Message, args: string[], prefix: string) {
		// Show all commands
		if (args[0] == undefined) {
			var helpArr: EmbedFieldData[] = message.client.commands
				.filter((cmd) => !cmd.adminOnly && cmd.name !== 'help')
				.map((cmd) => ({
					name: cmd.name == cmd.usage ? code(cmd.name) : code(cmd.usage),
					value: `${cmd.forceDMsOnly ? '**DM Only** ' : ''}${
						cmd.description
					}`,
				}));

			const helpEmbed = new MessageEmbed()
				.setTitle('__Commands__')
				.addFields(helpArr)
				.setFooter(
					'Use ' + prefix + 'help <command> to see more about a command.'
				)
				.setColor(config.embeds_color);

			message.channel.send(helpEmbed);
		} else {
			const command =
				message.client.commands.get(args[0]) ||
				message.client.commands.find(
					(cmd: ICommand) => cmd.aliases && cmd.aliases.includes(args[0])
				);

			if (!command) {
				return message.reply("That command doesn't exist.");
			}

			var embedDesc = [command.description];

			if (command.worksInDM) {
				embedDesc.push('This command works in DMs');
			}

			if (command.forceDMsOnly) {
				embedDesc.push('This command only works in DMs');
			}

			if (command.adminOnly) {
				embedDesc.push('This command can only be used by bot admins.');
			}

			if (command.hasArgs) {
				embedDesc.push('This command requires arguments.');
			}

			if (command.requirePartner) {
				embedDesc.push(
					'This command requires that you already have a Secret Santa partner.'
				);
			}

			if (command.modOnly) {
				embedDesc.push(
					'This command requires that you have the `MANAGE_SERVER` permission.'
				);
			}

			const cmdEmbed = new Discord.MessageEmbed()
				.setTitle(
					'__' +
						(command.name.charAt(0).toUpperCase() +
							command.name.slice(1)) +
						' Command__'
				)
				.addField('Usage', code(prefix + command.usage))
				.setDescription(embedDesc.map((cmd) => '- ' + cmd).join('\n'))
				.setColor(config.embeds_color);

			if (command.aliases[0].length) {
				cmdEmbed.addField('Aliases', command.aliases);
			}

			message.channel.send(cmdEmbed);
		}
	},
};

export default command;
