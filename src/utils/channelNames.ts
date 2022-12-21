import { GuildMember } from 'discord.js';
import { joinEmoji } from '../commands/create';

export const getCategoryChannelName = (member: GuildMember) =>
	`${joinEmoji}-${member.displayName.toLowerCase()}`;
export const getParticipantChannelName = (member: GuildMember) =>
	`${joinEmoji}-bot-control`;
export const getSantaChannelName = (member: GuildMember) =>
	`${joinEmoji}-${member.displayName.toLowerCase()}-to-match`;
export const getGifteeChannelName = (member: GuildMember) =>
	`${joinEmoji}-${member.displayName.toLowerCase()}-to-santa`;
