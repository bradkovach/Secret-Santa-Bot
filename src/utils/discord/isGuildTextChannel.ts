import {
	Channel,
	TextChannel,
	GuildChannel,
	ThreadChannel,
	GuildTextChannelType,
	ChannelType,
} from 'discord.js';

export const isGuildTextChannel = (
	channel: Channel
): channel is TextChannel & GuildChannel => {
	return channel.type === ChannelType.GuildText;
};
