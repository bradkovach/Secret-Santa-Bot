import {
	CategoryChannel,
	Channel,
	Guild,
	GuildMember,
	Message,
	NewsChannel,
	TextChannel,
} from 'discord.js';

export function printMessage(message: Message) {
	return `[message ${message.id}]: '${message.content.replace(
		/\n/g,
		'\\n'
	)}'`;
}

export function printGuild(guild: Guild) {
	return `[guild '${guild.name}'](${guild.id})`;
}

export function printCategoryChannel(channel: CategoryChannel) {
	return `[category '${channel.name}'](${channel.id})`;
}

export function printGuildTextChannel(channel: TextChannel | NewsChannel) {
	return `[channel '${channel.name}'](${channel.id})`;
}

export function printMember(member: GuildMember) {
	return `${member.displayName} (${member.id})`;
}

export function printDiscordEntity(
	entity: { id: string; name: string },
	label: string = ''
) {
	return `[${label} '${entity.name}'](${entity.id})`;
}

export function printChannelContext(partialChannel: Channel) {
	// const channel = await partialChannel.fetch();
	const bits = [];
	if (partialChannel.isDMBased()) {
		bits.push(`[DM channel](${partialChannel.id})`);
	} else {
		if (partialChannel.guild) {
			bits.push(printGuild(partialChannel.guild));
		}
		if (partialChannel.parent) {
			bits.push(printDiscordEntity(partialChannel.parent, 'category'));
		}
		bits.push(printDiscordEntity(partialChannel, 'channel'));
	}
	return bits.join(' > ');
}

export function printMessageContext(message: Message) {
	const bits = [];

	if (message.channel) {
		bits.push(printChannelContext(message.channel));
	}

	bits.push(printMessage(message));

	return bits.join(' > ');
}
