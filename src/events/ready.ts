import helpCommand from '../commands/help';
import { ActivityType, PermissionFlagsBits } from 'discord.js';
import { showCommandUsage } from '../utils/showCommandUsage';
import { client, resolvedConfig } from '../app';

export function ready(): void {
	client.user!.setActivity(showCommandUsage(helpCommand), {
		name: showCommandUsage(helpCommand),
		type: ActivityType.Watching,
	});

	const permissions = [
		// General Permissions
		PermissionFlagsBits.ManageChannels,

		// Text Permissions
		PermissionFlagsBits.ViewChannel,
		PermissionFlagsBits.SendMessages,
		PermissionFlagsBits.ManageMessages,
		PermissionFlagsBits.EmbedLinks,
		PermissionFlagsBits.AttachFiles,
		PermissionFlagsBits.ReadMessageHistory,
		PermissionFlagsBits.MentionEveryone,

		PermissionFlagsBits.AddReactions,
	];
	//
	const qs: Record<string, string> = {
		client_id: resolvedConfig.applicationId,
		permissions: permissions.reduce((all, perm) => all + perm).toString(),
		scope: ['bot', 'applications.commands'].join(' '),
	};
	const authUrl = new URL('https://discord.com/api/oauth2/authorize');
	authUrl.searchParams.set('client_id', resolvedConfig.applicationId);
	authUrl.searchParams.set('permissions', qs.permissions);
	authUrl.searchParams.set('scope', qs.scope);
	const authUrlString = authUrl.toString();

	console.log('-'.repeat(authUrlString.length));
	console.log('Discord Bot Authorization URL');
	console.log(authUrlString);
	console.log('-'.repeat(authUrlString.length));

	console.log(`[APP] Bot is ready`);
}
