import {
	Guild,
	Message,
	MessageCreateOptions,
	MessagePayload,
} from 'discord.js';

import { ChannelRole } from '../model/channels.table';
import { DatabaseManager } from '../model/database';
import { ParticipantRow } from '../model/participants.table';
import { logMessage } from '../utils/discord';
import { isGuildTextChannel } from '../utils/discord/isGuildTextChannel';

import logger, { logAndReturnMessage } from '../utils/logger';

export async function sendMessageToChannel(
	guild: Guild,
	participant: ParticipantRow,
	channelRole: ChannelRole,
	message: string | MessagePayload | MessageCreateOptions
): Promise<Message> {
	let channelRow = await DatabaseManager.getInstance()
		.selectFrom('channels')
		.where('participant_id', '=', participant.participant_id)
		.where('role', '=', channelRole)
		.selectAll()
		.executeTakeFirst();

	if (!channelRow) {
		logger.warn(
			`Unable to send message to ${channelRole} channel for participant ${participant.participant_id}`
		);
		throw Error(
			`Unable to resolve ${channelRole} channel for participant ${participant.participant_id}`
		);
	}

	let channel = await guild.channels.fetch(channelRow.discord_channel_id);

	if (!channel) {
		throw Error(
			`Unable to find ${channelRole} channel ${channelRow.channel_id} in '${guild.name}' guild (${guild.id})`
		);
	}

	if (!isGuildTextChannel(channel)) {
		throw Error(`Channel is not guild text channel.`);
	}

	return channel.send(message).then(logAndReturnMessage);
}
