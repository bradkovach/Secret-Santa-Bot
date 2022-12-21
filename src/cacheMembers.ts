import { Message } from 'discord.js';

export async function cacheMembersByMessage(message: Message) {
	try {
		console.log('[CMD] Fetching members...');
		await message.guild!.members.fetch();
	} catch (err) {
		console.log('[CMD] Failed to fetch guild members: ' + err);
	}
}
