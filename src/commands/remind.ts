import {
	bold,
	codeBlock,
	EmbedBuilder,
	Guild,
	GuildMember,
	inlineCode,
	Message,
	TextChannel,
} from 'discord.js';

// Commands
import type { ICommand } from '../ICommand';
import addressCommand from '../commands/address';
import helpCommand from '../commands/help';
import leaveCommand from '../commands/leave';
import profileCommand from '../commands/profile';

import { ChannelRow } from '../model/channels.table';
import { DatabaseManager } from '../model/database';
import { ParticipantRow } from '../model/participants.table';

import { flagFromThree } from '../utils/countries';
import logger from '../utils/logger';
import { showCommandUsage } from '../utils/showCommandUsage';
import { brjoin, heading, p, passage } from '../utils/text';
import { Channel } from '../model/Channel';

const waitAndReturn = (ms: number) => (success: any) =>
	new Promise((resolve) => {
		setTimeout(() => {
			resolve(success);
		}, ms);
	});

const sendParticipantReminder = (
	channel: TextChannel,
	member: GuildMember,
	participantAndChannel: ParticipantRow & ChannelRow
) => {
	const embeds = [];

	if (participantAndChannel.address === '') {
		embeds.push(
			new EmbedBuilder()
				.setTitle(`You haven't set your address yet!`)
				.setDescription(
					passage(
						p(
							`In order to be matched for this exchange, you need to have a shipping address.`
						)
					)
				)
				.setFields([
					{
						name: `To set your address, reply...`,
						value: inlineCode(showCommandUsage(addressCommand)),
					},
				])
				.setColor('#ff0000')
		);
	}

	if (participantAndChannel.wishlist === '') {
		embeds.push(
			new EmbedBuilder()
				.setTitle(`You haven't set your profile yet!`)
				.setDescription(
					passage(
						p(
							`Your Secret Santa will be unable to pick a great gift for you unless you provide your profile.`
						)
					)
				)
				.setFields([
					{
						name: 'To set your profile, reply...',
						value: inlineCode(showCommandUsage(profileCommand)),
					},
				])
				.setColor('#ff0000')
		);
	}

	logger.info(
		`Sending reminder to ${member.displayName} to complete address and profile.`
	);

	return channel
		.send({
			content: passage(
				heading(`Hello, ${member.toString()}!`),
				p(
					`This is a quick reminder to update your Secret Santa participant information!`,
					`If your address and profile aren't filled out, we won't be able to match you to a Secret Santa!`,
					`You can update your address and profile by replying in this channel!`
				),
				p(
					`Please make sure the flag reaction to this message is set to your country.`,
					`If it isn't, ${bold(
						`react with your country's correct flag`
					)} and it will be updated.`
				),
				brjoin(
					bold('For more assistance, reply...'),
					inlineCode(showCommandUsage(helpCommand))
				),
				brjoin(
					bold(`To leave the exchange, reply...`),
					inlineCode(showCommandUsage(leaveCommand))
				)
			),
			embeds,
		})
		.then((message) => {
			if (participantAndChannel.iso_country_code) {
				message.react(
					flagFromThree(participantAndChannel.iso_country_code)
				);
			}
		});
};

//  const lines = (strings: string[]) => strings.join('\n')

//  const paragraphs = (sentences: string[][]) =>
// 	sentences.map((sentence) => sentence.join(' ')).join('\n\n');

const command: ICommand = {
	name: 'remind',
	description: 'Sends reminders to participants.',
	usage: 'remind',

	allowOwner: true,
	allowAdmin: true,
	showInHelp: false,
	respondInChannelTypes: ['participant'],
	async execute(guild: Guild, message: Message, subcommand: string) {
		// is in guild
		if (!message.member) {
			return;
		}

		message.reply(
			`Sending reminders to ${
				subcommand === 'PROD' ? 'participant' : 'test'
			} channels!`
		);

		const commandChannel = message.channel;

		return Channel.fromDiscordChannelId(commandChannel.id)
			.then((r) => r.getParticipant())
			.then((p) => p.getExchange())
			.then((e) => {
				return DatabaseManager.getInstance()
					.selectFrom('participants')
					.innerJoin(
						'channels',
						'participants.participant_id',
						'channels.participant_id'
					)
					.where('participants.exchange_id', '=', e.exchange_id)
					.where('channels.role', '=', 'participant')
					.where((w) =>
						w.where('address', '=', '').orWhere('wishlist', '=', '')
					)
					.call((qb) => {
						//console.log(qb.compile().sql);
						return qb;
					})
					.selectAll()
					.execute();
			})
			.then((participants) => {
				const allErrors: any[] = [];
				const allWarnings: string[] = [];

				return Promise.all(
					participants.map(async (p) => {
						if (p.iso_country_code === '') {
							allWarnings.push(
								`Country code not set for participant ${p.participant_id}.`
							);
						}

						try {
							const participantChannel = (await guild.channels.fetch(
								p.discord_channel_id
							)) as unknown as TextChannel;

							if (!participantChannel) {
								throw Error(
									`Unable to find Discord participant Channel for Discord Channel ID ${p.discord_channel_id}`
								);
							}

							const member = await guild.members.fetch(p.discord_user_id);

							if (!member) {
								throw Error(
									`Unable to find Discord Guild Member for Discord User ID ${p.discord_user_id}`
								);
							}

							return sendParticipantReminder(
								(subcommand === 'PROD'
									? participantChannel
									: commandChannel) as TextChannel,
								member,
								p
							).then(waitAndReturn(250));
						} catch (error) {
							allErrors.push(error);
						}
					})
				).then((reminders) => {
					const embeds: EmbedBuilder[] = [];

					if (allErrors.length > 0) {
						embeds.push(
							new EmbedBuilder()
								.setTitle(`Errors`)
								.setDescription(codeBlock(allErrors.join('\n')))
								.setColor('DarkRed')
						);
					}

					if (allWarnings.length > 0) {
						embeds.push(
							new EmbedBuilder()
								.setTitle(`Warnings`)
								.setDescription(codeBlock(allWarnings.join('\n')))
								.setColor('DarkOrange')
						);
					}

					return message.reply({
						content: `Sent ${reminders.length} reminders.`,
						embeds,
					});
				});
			})
			.catch((e) =>
				message.reply(`Unable to resolve exchange. Error: ${e}`)
			);
	},
};

export default command;
