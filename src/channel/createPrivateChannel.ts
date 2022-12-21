import { channel } from 'diagnostics_channel';
import {
	CategoryChannel,
	ChannelType,
	OverwriteType,
	PermissionFlagsBits,
	Role,
	TextChannel,
} from 'discord.js';
import { ChannelRole } from '../model/channels.table';
import { DatabaseManager } from '../model/database';
import {
	DiscordSnowflake,
	ParticipantRow,
} from '../model/participants.table';
import logger from '../utils/logger';

export async function createPrivateChannel(
	category: CategoryChannel,
	everyoneRole: Role,
	participant: ParticipantRow,
	bot_discord_user_id: DiscordSnowflake,
	role: ChannelRole,
	name: string,
	topic: string
): Promise<TextChannel> {
	return await category.children
		.create({
			type: ChannelType.GuildText,
			name: name,
			topic: topic,
			permissionOverwrites: [
				...[participant.discord_user_id, bot_discord_user_id].map(
					(user_id) => ({
						type: OverwriteType.Member,
						id: user_id,
						allow: [PermissionFlagsBits.ViewChannel],
					})
				),
				{
					type: OverwriteType.Role,
					id: everyoneRole.id,
					deny: [PermissionFlagsBits.ViewChannel],
				},
			],
		})
		.then((newChannel: TextChannel) => {
			return DatabaseManager.getInstance()
				.insertInto('channels')
				.values({
					participant_id: participant.participant_id,
					role: role,
					discord_channel_id: newChannel.id,
				})
				.executeTakeFirst()
				.then((inserted) => {
					return newChannel;
				})
				.catch((error) => {
					logger.info(
						`Unable to persist channel reference; Deleting discord channel ${newChannel.id}/${newChannel.name}.`
					);
					newChannel.delete();
					return Promise.reject(error);
				});
		});
}
