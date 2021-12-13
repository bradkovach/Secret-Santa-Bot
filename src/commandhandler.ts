import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { query } from './mysql';
import { UserRow } from './rows/UserRow';
import { Methods } from './utils/methods';

export const handleCmd = async (message: Message, prefix: string) => {
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args!.shift()!.toLowerCase();
	const command =
		message.client.commands.get(commandName) ||
		message.client.commands.find(
			(cmd: ICommand) => cmd.aliases && cmd.aliases.includes(commandName)
		);

	if (!command) return;
	// Command doesnt exist
	else if (!command.worksInDM && message.channel.type !== 'text')
		return message.reply("That command doesn't work in DMs!");
	else if (command.forceDMsOnly && message.channel.type !== 'dm')
		return message.reply('That command only works in DMs!');

	if (message.channel.type !== 'dm') await cacheMembers(message);
	if (
		(
			await query<UserRow[]>(`SELECT * FROM users WHERE userId = ?`, [
				message.author.id,
			])
		).length === 0
	) {
		let methods = new Methods();
		await methods.createNewUser(message.author.id); // Create new account in database for user BEFORE executing a command.
	}

	const row = (
		await query<UserRow[]>(`SELECT * FROM users WHERE userId = ?`, [
			message.author.id,
		])
	)[0];

	if (command.requirePartner && row.partnerId == 0)
		return message.reply(
			"A partner has not been chosen for you yet! Try again after you've been given a partner."
		);
	else if (
		command.modOnly &&
		!message.member!.hasPermission('MANAGE_GUILD')
	)
		return message.reply(
			'You need the `MANAGE_SERVER` permission to run that command.'
		);
	else if (
		command.adminOnly &&
		!message.client.sets.adminUsers.has(message.author.id)
	)
		return message.reply(
			'You must be an admin of the bot to run that command.'
		);

	try {
		command.execute(message, args, prefix); // CALL COMMAND HERE
		message.client.commandsUsed++;
	} catch (err) {
		console.error(err);
		message.reply('Command failed to execute!');
	}
};

async function cacheMembers(message: Message) {
	try {
		console.log('[CMD] Fetching members...');
		await message.guild!.members.fetch();
	} catch (err) {
		console.log('[CMD] Failed to fetch guild members: ' + err);
	}
}
