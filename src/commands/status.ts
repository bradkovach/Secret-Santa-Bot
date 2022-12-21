import { EmbedBuilder, Guild, italic, Message } from 'discord.js';
import {
	printChannelContext,
	printMember,
	printMessage,
} from '../exchange/printMessage';
import type { ICommand } from '../ICommand';
import logger, { logAndReturnMessage } from '../utils/logger';
import { showCommandUsage } from '../utils/showCommandUsage';

import addressCommand from './address';
import { cancelEmoji, startEmoji } from './create';
import profileCommand from './profile';

import { ParticipantState } from '../ParticipantState';
import { ParticipantRow } from '../model/participants.table';
import { flagFromThree } from '../utils/countries';
import { p, passage } from '../utils/text';

const addressBlank = [
	cancelEmoji,
	`You have not provided your address to the Santa bot.`,
	`A shipping address is required for participation!`,
	`To set your address, reply`,
	'`' + showCommandUsage(addressCommand) + '`',
].join(' ');

const addressOkay = [
	startEmoji,
	`You have provided your address to the Secret Santa bot.`,
	`To change your address, reply`,
	'`' + showCommandUsage(addressCommand) + '`.',
].join(' ');

const profileBlank = [
	cancelEmoji,
	`You have not provided your participant profile to the Santa bot!`,
	`Your profile is used to help your Santa pick a great gift for you.`,
	`To set your profile, reply`,
	'`' + showCommandUsage(profileCommand) + '`',
].join(' ');

const profileOkay = [
	startEmoji,
	`You have provided your profile to the Secret Santa bot.`,
	`To change your address, reply`,
	'`' + showCommandUsage(profileCommand) + '`',
].join(' ');

const willNotBeMatched = [
	`**At this time, you will not be matched in this exchange.**`,
	`Please submit your address and profile before matching!`,
].join(' ');

const willBeMatched = passage(
	p(
		`You're all set for matching.`,
		`You will get a message from this bot when gift assignments are made!`
	),
	p(
		`Please make sure the flag reaction to this message is set to your country.`,
		`If it isn't, react with your country's correct flag and it will be updated.`
	)
);
const notSet = italic('not set');

const command: ICommand = {
	name: 'status',
	usage: 'status',
	description: 'Show your enrollment status in the gift exchange.',

	allowAfter: ParticipantState.JOINED,
	// requiresShipped: false,
	allowOwner: false,
	allowAdmin: false,
	showInHelp: true,
	respondInChannelTypes: ['participant'],
	async execute(
		guild: Guild,
		message: Message,
		subcommand: string,
		context: ParticipantRow
	) {
		if (!message) {
			return;
		}

		if (!message.member) {
			return;
		}

		const isAddressOkay = context.address.trim() !== '';
		const isProfileOkay = context.wishlist.trim() !== '';
		const isReady = isAddressOkay && isProfileOkay;

		const embed = new EmbedBuilder()
			.setTitle(`Your Participation Status`)
			.setDescription(
				[
					isAddressOkay ? addressOkay : addressBlank,
					isProfileOkay ? profileOkay : profileBlank,
				].join('\n\n')
			)
			.setFields([
				{
					name: 'Address',
					value: isAddressOkay ? context.address.trim() : notSet,
				},
				{
					name: 'Profile',
					value: isProfileOkay ? context.wishlist.trim() : notSet,
				},
			])
			.setColor(isReady ? 'DarkGreen' : 'DarkRed');

		return message
			.reply({
				content: [
					`Hello, ${message.member.toString()}!`,
					isReady ? willBeMatched : willNotBeMatched,
				].join('\n\n'),
				embeds: [embed],
			})
			.then(logAndReturnMessage)
			.then((replyMessage) => {
				const flag = flagFromThree(context.iso_country_code);
				if (flag && flag !== '') {
					replyMessage.react(flag);
				}
				return replyMessage;
			});
	},
};

export default command;
