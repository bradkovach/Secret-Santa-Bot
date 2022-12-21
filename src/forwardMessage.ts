import { Guild, Message } from 'discord.js';
import { printChannelContext, printMember } from './exchange/printMessage';
import { getOtherChannel } from './getOtherChannel';
import { isGuildTextChannel } from './utils/discord/isGuildTextChannel';
import logger, {
	logForwardedMessage,
	messageLogger,
} from './utils/logger';
import { msgToMsgCache } from './commandhandler';

export const forwardMessage = async (
	guild: Guild,
	incomingMessage: Message
) => {
	const fwdInfo = await getOtherChannel(incomingMessage.channelId);

	if (!fwdInfo) {
		return;
	}

	const srcChannel = await incomingMessage.channel.fetch();

	if (!srcChannel) {
		logger.error(
			`[forward] Unable to find source channel ${fwdInfo.srcDiscordChannelId} in guild.`
		);
		return;
	}

	if (!isGuildTextChannel(srcChannel)) {
		logger.error(
			`[forward] Source channel ${fwdInfo.srcDiscordChannelId} is not a guild text channel.`
		);
		return;
	}

	const dstChannel = await guild.channels.fetch(
		fwdInfo.dstDiscordChannelId
	);

	if (!dstChannel) {
		logger.error(
			`[forward] Unable to find forward channel ${fwdInfo.dstDiscordChannelId} in guild.`
		);
		return;
	}

	if (!isGuildTextChannel(dstChannel)) {
		logger.error(
			`[forward] Dest channel ${fwdInfo.dstDiscordChannelId} is not a guild text channel.`
		);
		return;
	}

	const srcMember = await guild.members.fetch(fwdInfo.srcDiscordUserId);
	const dstMember = await guild.members.fetch(fwdInfo.dstDiscordUserId);
	const botMember = await guild.members.fetch(guild.client.user.id);

	const santaMember =
		fwdInfo.srcChannelRole === 'santa' ? srcMember : dstMember;
	const gifteeMember =
		fwdInfo.srcChannelRole === 'giftee' ? srcMember : dstMember;

	// replace all mentions of santa user w santa bot
	const newContent =
		fwdInfo.dstChannelRole === 'giftee'
			? incomingMessage.content
					.replace(
						new RegExp(botMember.toString(), 'g'),
						gifteeMember.toString()
					)
					.replace(
						new RegExp(santaMember.toString(), 'g'),
						botMember.toString()
					)
			: `From @${gifteeMember.displayName}: ` +
			  incomingMessage.content.replace(
					new RegExp(botMember.toString(), 'g'),
					santaMember.toString()
			  );

	if (isGuildTextChannel(dstChannel)) {
		dstChannel.send(newContent).then((outgoingMessage) => {
			logForwardedMessage(
				fwdInfo.srcChannelRole,
				srcMember,
				srcChannel,

				fwdInfo.dstChannelRole,
				dstMember,
				dstChannel,

				newContent
			);
			msgToMsgCache.set(incomingMessage.id, outgoingMessage);
			msgToMsgCache.set(outgoingMessage.id, incomingMessage);
		});
	}
};
