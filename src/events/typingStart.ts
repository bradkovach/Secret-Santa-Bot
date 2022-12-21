import { Typing } from 'discord.js';
import { getOtherChannel } from '../getOtherChannel';
import { getChannel } from '../channel/getChannel';
import { client } from '../app';

export const typingStart = (typing: Typing) => {
	if (typing.user.id === client.user?.id) {
		return;
	}
	if (typing.inGuild()) {
		getChannel(typing.channel.id)
			.then((maybeChannel) => {
				if (maybeChannel && maybeChannel.role !== 'participant') {
					return getOtherChannel(maybeChannel.discord_channel_id);
				}
			})
			.then((maybeOtherChannel) => {
				if (maybeOtherChannel) {
					// logger.verbose(`forwarding typing from ${maybeOtherChannel.srcDiscordChannelId} to ${maybeOtherChannel.dstDiscordChannelId}`)
					typing.guild.channels
						.fetch(maybeOtherChannel.dstDiscordChannelId)
						.then((channel) => {
							if (channel && channel.isTextBased()) {
								channel.sendTyping();
							}
						});
				}
			});
	}
};
