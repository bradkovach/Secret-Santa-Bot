import { ChannelRow } from '../model/channels.table';
import { DatabaseManager } from '../model/database';

const channelCacheByDiscordId = new Map<string, ChannelRow>();

export const getChannel = async (discordChannelId: string) => {
	if (channelCacheByDiscordId.has(discordChannelId)) {
		// logger.verbose(`Returning known channel from cache, ${discordChannelId}`);
		return channelCacheByDiscordId.get(discordChannelId);
	}

	const channel = await DatabaseManager.getInstance()
		.selectFrom('channels')
		.where('channels.discord_channel_id', '=', discordChannelId)
		.selectAll()
		.executeTakeFirst();

	if (channel) {
		channelCacheByDiscordId.set(discordChannelId, channel);
		return channel;
	} else {
		return null;
	}
};
