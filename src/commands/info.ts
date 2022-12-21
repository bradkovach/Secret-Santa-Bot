import { rejects } from 'assert';
import {
	CategoryChannel,
	ChannelType,
	codeBlock,
	Collection,
	EmbedBuilder,
	Guild,
	GuildBasedChannel,
	GuildChannel,
	GuildMember,
	inlineCode,
	italic,
	Message,
	NonThreadGuildBasedChannel,
	OverwriteType,
	PermissionFlagsBits,
	Role,
	TextChannel,
	User,
} from 'discord.js';
import { join } from 'path';
import { text } from 'stream/consumers';
import { sendWelcomeMessage } from '../exchange/sendWelcomeMessage';
import type { ICommand } from '../ICommand';
import { Channel } from '../model/Channel';
import { ChannelRole, NewChannelRow } from '../model/channels.table';
import { DatabaseManager } from '../model/database';
import { Exchange } from '../model/Exchange';
import { Match } from '../model/Match';
import { NewMatchRow } from '../model/matches.table';
import { Participant } from '../model/Participant';
import { ParticipantRow } from '../model/participants.table';
import { isGuildTextChannel } from '../utils/discord/isGuildTextChannel';
import { groupBy } from '../utils/pickRandom';
import { showCommandUsage } from '../utils/showCommandUsage';
import { shuffle } from '../utils/shuffle';
import { brjoin, p, passage } from '../utils/text';
import { joinEmoji } from './create';

import helpCommand from './help';
import partnerCommand from './partner';
import shippedCommand from './shipped';

const Discord = require('discord.js');
const { version } = require('../../package.json');
const os = require('os');
const config = require('../config.json');

const getUnmatched = (exchange: Exchange) =>
	DatabaseManager.getInstance()
		.selectFrom('participants')
		.where('exchange_id', '=', exchange.exchange_id)
		.where('address', '!=', '')
		.where('wishlist', '!=', '')
		// .where('participant_id', 'not in', x=>x.)
		.whereNotExists((subQuery) =>
			subQuery
				.selectFrom('matches')
				.whereRef(
					'giftee_participant_id',
					'=',
					'participants.participant_id'
				)
				.selectAll()
		)
		.selectAll()
		.call((x) => {
			console.log(x.compile());
			return x;
		})
		.execute();

const lockExchange = (
	exchange: Exchange,
	guild: Guild,
	message: Message
): Promise<boolean> => {
	return DatabaseManager.getInstance()
		.updateTable('exchanges')
		.set({
			started: true,
		})
		.where('exchange_id', '=', exchange.exchange_id)
		.executeTakeFirstOrThrow()
		.then((r) => {
			return Promise.resolve(r.numUpdatedRows === BigInt(1));
		})
		.catch((e) => {
			console.error(e);
			return Promise.resolve(false);
		});
};

const createCategoryChannel = (
	guild: Guild,
	exchange: Exchange,
	participant: Participant
): Promise<CategoryChannel> => {
	return guild.members
		.fetch(participant.discord_user_id)
		.then((member) => {
			return guild.channels
				.create({
					name: `${joinEmoji}-${member.displayName.toLowerCase()}`,
					type: ChannelType.GuildCategory,
					permissionOverwrites: [
						...[member.id, guild.client.user.id].map((user_id) => ({
							type: OverwriteType.Member,
							id: user_id,
							allow: [PermissionFlagsBits.ViewChannel],
						})),
						{
							type: OverwriteType.Role,
							id: guild.roles.everyone.id,
							deny: [PermissionFlagsBits.ViewChannel],
						},
					],
				})
				.then((categoryChannel) => {
					return persistChannelAs(categoryChannel, 'category', participant)
						.then((persisted) => {
							console.log(
								`Created 'category' channel ${categoryChannel.name} for ${guild.name} member ${member.displayName} (${persisted.insertId} => ${categoryChannel.id})`
							);
							return categoryChannel;
						})
						.catch((error) => {
							console.error(
								`Unable to persist category channel ${categoryChannel.id} for participant ${participant.participant_id}`
							);

							return guild.channels.delete(categoryChannel.id);
						})
						.then((discordChannelDeleted) => {
							console.info(`Discord channel deleted`, {
								discordChannelDeleted,
							});
							return Promise.reject(
								`Unable to persist category for participant ${participant.participant_id}`
							);
						});
				});
		});
};

const persistChannelAs = (
	channel: GuildChannel,
	role: ChannelRole,
	participant: Participant
) => {
	return DatabaseManager.getInstance()
		.insertInto('channels')
		.values({
			discord_channel_id: channel.id,
			role: role,
			participant_id: participant.participant_id,
		})
		.executeTakeFirstOrThrow();
};

const createExchangeMatchChannels = (
	exchange: Exchange,
	guild: Guild,
	message: Message
) =>
	getUnmatched(exchange)
		.then((participantRows) => participantRows.map(Participant.fromFields))
		.then(async (participants) => {
			return await participants.forEach(async (p) => {
				const channels = await p.getChannels();
				const member = await guild.members.fetch(p.discord_user_id);

				console.info(
					`channels for participant ${p.participant_id} in exchange ${exchange.exchange_id}`
				);

				if (!member) {
					console.info(
						`   no member in ${guild.name} => ${guild.id} for ${p.discord_user_id}`
					);
				} else {
					console.info(`   member ${member.displayName} => ${member.id}`);
				}

				const catChannelRow = channels.find(
					(ch) => ch.role === 'category'
				);

				if (!catChannelRow) {
					console.info(
						`   no category channel for ${p.participant_id} => ${p.discord_user_id}`
					);
				}

				const santaChannelRow = channels.find((ch) => ch.role === 'santa');

				if (!santaChannelRow) {
					console.info(
						`   no santa channel for ${p.participant_id} => ${p.discord_user_id}`
					);
				}

				const gifteeChannelRow = channels.find(
					(ch) => ch.role === 'giftee'
				);

				if (!gifteeChannelRow) {
					console.info(
						`   no giftee channel for ${p.participant_id} => ${p.discord_user_id}`
					);
				}
			});
		});

const createMatchChannel = (
	exchange: Exchange,
	guild: Guild,
	categoryChannel: CategoryChannel,
	participant: Participant,
	role: 'santa' | 'giftee'
): Promise<TextChannel> =>
	categoryChannel.children
		.create({
			name:
				role === 'santa'
					? `${joinEmoji}-my-giftee`
					: `${joinEmoji}-my-santa`,
			type: ChannelType.GuildText,
			topic: `You can talk to your match here.  Any messages sent will appear to them as Secret Santa.`,
			permissionOverwrites: [
				...[participant.discord_user_id, guild.client.user.id].map(
					(user_id) => ({
						type: OverwriteType.Member,
						id: user_id,
						allow: [PermissionFlagsBits.ViewChannel],
					})
				),
				{
					type: OverwriteType.Role,
					id: guild.roles.everyone.id,
					deny: [PermissionFlagsBits.ViewChannel],
				},
			],
		})
		.then((textChannel) => {
			console.log(
				`[createMatchChannel] Created ${role} channel in discord for ${participant.participant_id}`
			);
			return persistChannelAs(textChannel, role, participant)
				.then((saved) => {
					console.log(
						`[createMatchChannel] Saved ${role} channel to db for ${participant.participant_id} => ${participant.discord_user_id}`
					);
					return textChannel;
				})
				.catch((error) => {
					console.error(
						`[createMatchChannel] Unable to persist participant ${participant.participant_id} ${role} channel [${textChannel.id} ${textChannel.name}] to DB`,
						error
					);
					return guild.channels
						.delete(textChannel.id, 'Unable to persist to SS database')
						.then((successfullydelete) => {
							console.info(`[createMatchChannel]`);
							return Promise.reject(
								`Unable to create category channel; db would not persist.`
							);
						});
				});
		});

const exchangeChannelsCreateAll = (
	exchange: Exchange,
	guild: Guild,
	message: Message
): Promise<TextChannel[]> => {
	return getUnmatched(exchange)
		.then((participantRows) => {
			return participantRows.map(Participant.fromFields);
		})
		.then((participants) => {
			console.log(
				`[createChannels] found ${participants.length} unmatched participants in exchange ${exchange.exchange_id}`
			);
			return Promise.all(
				participants.map((p) => {
					console.log(
						`[createChannels] creating channels for ${p.participant_id}`
					);
					return p
						.getChannels()
						.then((chs) => {
							const categoryChannelRow = chs.find(
								(ch) => ch.role === 'category'
							);

							return categoryChannelRow
								? guild.channels.fetch(
										categoryChannelRow.discord_channel_id
								  )
								: createCategoryChannel(guild, exchange, p);
						})
						.then((categoryChannel) => {
							if (!categoryChannel) {
								return Promise.reject(`Did not get a category channel`);
							}
							if (categoryChannel.type !== ChannelType.GuildCategory) {
								return Promise.reject(`Did not find a guild category`);
							}
							return categoryChannel;
						})
						.then((categoryChannel) => {
							return Promise.all([
								createMatchChannel(
									exchange,
									guild,
									categoryChannel,
									p,
									'giftee'
								),
								createMatchChannel(
									exchange,
									guild,
									categoryChannel,
									p,
									'santa'
								),
							]);
						});
				})
			).then((clumps) => clumps.flatMap((clump) => clump));
		})
		.catch((shit) => {
			return Promise.reject(shit);
		});
};

const generateMatches = (
	exchange: Exchange,
	guild: Guild,
	message: Message
): Promise<boolean> => {
	getUnmatched(exchange)
		.then((unmat) => unmat.map(Participant.fromFields))
		.then(async (pars) => {
			let groupedByCountry = groupBy(pars, (p) => p.iso_country_code);

			console.info(`[match] Matching ${pars.length} in country`);

			let members = await guild.members.fetch();

			// let indexedParticipants = new Map<bigint, Participant>(
			// 	pars.map((p) => [p.participant_id, p])
			// );
			let indexedMembers = new Map<BigInt, GuildMember>(
				pars
					.filter((p) => members.has(p.discord_user_id))
					.map((p) => [p.participant_id, members.get(p.discord_user_id)!])
			);

			groupedByCountry.forEach(async (countryPars, country) => {
				console.info(`[match]   matching in ${country}`);
				if (countryPars.length < 3) {
					console.warn(
						`[match]      Unable to match in ${country}; too few participants (${countryPars.length})`
					);
				}
				let shuffled = shuffle(countryPars);

				let countryMatches = shuffled
					.map((par, santa_idx, all) => {
						let giftee_idx =
							santa_idx === all.length - 1 ? 0 : santa_idx + 1;
						let giftee = all[giftee_idx];

						return {
							santa_participant_id: par.participant_id,
							giftee_participant_id: giftee.participant_id,
						} as NewMatchRow;
					})
					.map((match) => {
						console.info(
							`[match]      matched (${match.santa_participant_id}) ${
								indexedMembers.get(match.santa_participant_id)?.displayName
							} to (${match.giftee_participant_id}) ${
								indexedMembers.get(match.giftee_participant_id)
									?.displayName
							}`
						);
						return match;
					});

				return await DatabaseManager.getInstance()
					.insertInto('matches')
					.values(countryMatches)
					.execute()
					.then((success) => {
						console.info(`[match]   ... ${country} matches saved`, {
							success,
						});
					})
					.catch((error) => {
						console.error(`[match]   ... ${country} matches not saved!`, {
							error,
						});
					});
			});
		});
	return Promise.resolve(false);
};

const getPermissionOverwrites = (
	participantMember: GuildMember,
	botMember: GuildMember,
	everyoneRole: Role
) => [
	...[participantMember.id, botMember.id].map((user_id) => ({
		type: OverwriteType.Member,
		id: user_id,
		allow: [PermissionFlagsBits.ViewChannel],
	})),
	{
		type: OverwriteType.Role,
		id: everyoneRole.id,
		deny: [PermissionFlagsBits.ViewChannel],
	},
];

const exchangeChannelsRepair = async (
	exchange: Exchange,
	guild: Guild
) => {
	const channels = await guild.channels.fetch();
	const members = await guild.members.fetch();
	const botMember = await guild.members.fetchMe();
	exchange.getParticipants().then((participants) =>
		participants.map(async (participant) => {
			const channelRows = await participant.getChannels();

			const member = members.get(participant.discord_user_id);

			if (!member) {
				console.warn(
					`[repairchannels] ${participant.participant_id} => ${participant.discord_user_id} not member of guild ${guild.name} => ${guild.id}`
				);
				return;
			}

			const categoryChannelName = `${joinEmoji}-${member.displayName.toLowerCase()}`;
			const categoryCh = channelRows.find((ch) => ch.role === 'category');
			const discordCategoryChannel = await (categoryCh &&
			channels.has(categoryCh.discord_channel_id)
				? Promise.resolve(
						channels.get(categoryCh.discord_channel_id) as CategoryChannel
				  )
				: guild.channels
						.create({
							name: categoryChannelName,
							type: ChannelType.GuildCategory,
							permissionOverwrites: getPermissionOverwrites(
								member,
								botMember,
								guild.roles.everyone
							),
						})
						.then((newCh) =>
							persistChannelAs(newCh, 'category', participant).then(
								(persisted) => newCh
							)
						));

			if (!discordCategoryChannel) {
				console.error(
					`There was a problem resolving the category channel.`
				);
				return;
			}

			await discordCategoryChannel.setName(categoryChannelName);

			/**
			 * Set the participant channel up nice...
			 */
			const participantChannelName = `${joinEmoji}-bot-control`;
			const participantCh = channelRows.find(
				(ch) => ch.role === 'participant'
			);
			const discordParticipantChannel = await (participantCh &&
			channels.has(participantCh.discord_channel_id)
				? Promise.resolve(
						channels.get(participantCh.discord_channel_id) as TextChannel
				  )
				: guild.channels
						.create({
							name: participantChannelName,
							type: ChannelType.GuildText,
							parent: discordCategoryChannel.id,
							permissionOverwrites: getPermissionOverwrites(
								member,
								botMember,
								guild.roles.everyone
							),
						})
						.then((newCh) =>
							persistChannelAs(newCh, 'participant', participant).then(
								(persisted) => newCh
							)
						));

			if (!discordParticipantChannel) {
				console.error(
					`Unable to resolve participant channel for ${participant.participant_id}`
				);
				return;
			}

			await discordParticipantChannel.setName(participantChannelName);

			if (!exchange.started) {
				return;
			}

			/**
			 * Set the santa channels
			 */
			const santaChannelName = `${joinEmoji}-${member.displayName.toLowerCase()}-to-giftee`;
			const santaCh = channelRows.find((ch) => ch.role === 'santa');
			const discordSantaChannel = await (santaCh &&
			channels.has(santaCh.discord_channel_id)
				? Promise.resolve(
						channels.get(santaCh.discord_channel_id) as TextChannel
				  )
				: guild.channels
						.create({
							name: santaChannelName,
							type: ChannelType.GuildText,

							parent: discordCategoryChannel.id,
							permissionOverwrites: getPermissionOverwrites(
								member,
								botMember,
								guild.roles.everyone
							),
						})
						.then((newCh) =>
							persistChannelAs(newCh, 'santa', participant).then(
								(persisted) => newCh
							)
						));

			if (!discordSantaChannel) {
				console.error(`There was a problem resolving the santa channel`);
				return;
			}

			await discordSantaChannel.setName(santaChannelName);

			const gifteeParticipant = await participant
				.getGiftees()
				.then((giftees) => (giftees.length > 1 ? giftees[0] : undefined));
			if (gifteeParticipant) {
				const gifteeMember = members.get(
					gifteeParticipant.discord_user_id
				);
				if (gifteeMember) {
					await discordSantaChannel.setTopic(
						`Here you can communicate with your match, ${gifteeMember.displayName}.  Shhh!`
					);
				}
			}

			/**
			 * Repair Giftee Channel
			 */
			const gifteeChannelName = `${joinEmoji}-${member.displayName.toLowerCase()}-to-santa`;
			const gifteeCh = channelRows.find((ch) => ch.role === 'giftee');
			const discordGifteeChannel = await (gifteeCh &&
			channels.has(gifteeCh.discord_channel_id)
				? Promise.resolve(
						channels.get(gifteeCh.discord_channel_id) as TextChannel
				  )
				: guild.channels
						.create({
							name: gifteeChannelName,
							type: ChannelType.GuildText,
							parent: discordCategoryChannel.id,
							permissionOverwrites: getPermissionOverwrites(
								member,
								botMember,
								guild.roles.everyone
							),
						})
						.then((newCh) =>
							persistChannelAs(newCh, 'giftee', participant).then(
								(persisted) => newCh
							)
						));

			if (!discordGifteeChannel) {
				console.error(
					`There was a problem resolving the giftee channel for ${participant.participant_id} => ${gifteeCh?.discord_channel_id}.`
				);
				return;
			}

			await discordGifteeChannel.setName(gifteeChannelName);
		})
	);
};

const notifyMatches = async (
	exchange: Exchange,
	guild: Guild,
	message: Message
) => {
	const channels = await guild.channels.fetch();
	const members = await guild.members.fetch();

	return (
		DatabaseManager.getInstance()
			.selectFrom('matches')
			.innerJoin(
				'participants as santa',
				'matches.santa_participant_id',
				'santa.participant_id'
			)
			.innerJoin(
				'participants as giftee',
				'matches.giftee_participant_id',
				'giftee.participant_id'
			)
			.innerJoin(
				'channels',
				'santa.participant_id',
				'channels.participant_id'
			)
			.innerJoin(
				'channels as santaChannel',
				'santa.participant_id',
				'santaChannel.participant_id'
			)
			.innerJoin(
				'channels as gifteeChannel',
				`santa.participant_id`,
				'gifteeChannel.participant_id'
			)
			.where('santa.exchange_id', '=', exchange.exchange_id)
			.where('channels.role', '=', 'participant')
			.where('santaChannel.role', '=', 'santa')
			.where('gifteeChannel.role', '=', 'giftee')

			/** DEBUGGING */
			// .where('santa.discord_user_id', '=', '817241236959920138')
			/** END DEBUGGING */

			.selectAll('matches')

			.select('santa.discord_user_id as santa_discord_user_id')

			.select(
				'santaChannel.discord_channel_id as as_santa_discord_channel_id'
			)
			.select(
				'gifteeChannel.discord_channel_id as as_giftee_discord_channel_id'
			)

			.select('giftee.wishlist as giftee_wishlist')
			.select('giftee.address as giftee_address')
			.select('giftee.discord_user_id as giftee_discord_user_id')
			.select(
				'channels.discord_channel_id as santa_participant_discord_channel_id'
			)
			.execute()
			.then(async (matches) => {
				console.info(
					`[notify] sending notifications to ${guild.name} => ${guild.id} participants.`
				);

				return await matches.map(async (row, idx) => {
					const channel = channels.get(
						row.santa_participant_discord_channel_id
					);
					const santaMember = members.get(row.santa_discord_user_id);
					const gifteeMember = members.get(row.giftee_discord_user_id);

					const asSantaDiscordChannel = channels.get(
						row.as_santa_discord_channel_id
					);
					const asGifteeDiscordChannel = channels.get(
						row.as_giftee_discord_channel_id
					);

					if (!santaMember) {
						console.error(`no santa member`, { row });
						return;
					}

					if (!gifteeMember) {
						console.error(`no giftee member`, { row });
						return;
					}

					if (!asGifteeDiscordChannel) {
						console.error(`missing giftee dc`, { row });
						return;
					}

					if (!asSantaDiscordChannel) {
						console.error(`missing santa dc`, { row });
						return;
					}

					console.info(
						`[notify]   (${idx + 1}/${matches.length}) notifying [${
							santaMember.displayName
						} ${santaMember.id}] of match to [${
							gifteeMember.displayName
						} ${gifteeMember.id}]... `
					);

					if (channel && channel.isTextBased()) {
						return await channel.send({
							content: passage(
								p(`Hello, ${santaMember.toString()}!`),
								p(
									`The Secret Santa exchange has begun and you have been matched to another participant!`,
									`Your match and your Secret Santa are *not* the same person.`
								),
								brjoin(
									italic(
										`If you need any assistance with this bot, send...`
									),
									inlineCode(showCommandUsage(helpCommand))
								),
								p(
									`If you need help with something the bot doesn't know about, message a moderator of **${guild.name}**.`,
									`Have Fun!`
								)
							),
							embeds: [
								new EmbedBuilder()
									.setTitle('Your Match')
									.setDescription(
										passage(
											p(
												`You have been matched to ${gifteeMember.toString()}!`,
												`You can secretly message your match by using the ${asSantaDiscordChannel.toString()} channel.`
											),
											brjoin(
												italic(
													`You can always get your match's up-to-date information with...`
												),
												inlineCode(showCommandUsage(partnerCommand))
											),
											brjoin(
												italic(
													`When you have shipped your gift, mark it as shipped with...`
												),
												inlineCode(showCommandUsage(shippedCommand))
											),
											brjoin(
												italic(
													`If you don't have a tracking number, send...`
												),
												inlineCode(`santa! shipped none`)
											)
										)
									)
									.setFields([
										{ name: 'Address', value: row.giftee_address },
										{
											name: 'Profile',
											value: row.giftee_wishlist,
										},
									]),
								new EmbedBuilder()
									.setTitle('Your Santa')
									.setDescription(
										[
											'You have also been matched with a Secret Santa!',
											`You can message your Secret Santa using the ${asGifteeDiscordChannel.toString()} channel.`,
										].join(' ')
									),
							],
						});
					}
				});
			})
	);
};

function isDefined<ExpectedType>(subject: any): subject is ExpectedType {
	return subject !== null && subject !== undefined;
}

const listGuildChannels = (guild: Guild) => {
	let v = ChannelType.GuildText;
	return guild.channels.fetch().then((channels) => {
		if (channels) {
			printChannelTree(
				channels as Collection<string, NonThreadGuildBasedChannel>
			);
		}
		// return (
		// 	channels
		// 		//.filter((ch) => ch && ch.name && ch.name.indexOf(joinEmoji) > -1)
		// 		.map((ch) =>
		// 			ch
		// 				? `${ch.id} (${ChannelType[ch.type]}) => '${ch.name}'${
		// 						ch.parent
		// 							? ` [parent ${ch.parentId} => '${ch.parent.name}']`
		// 							: ''
		// 				  }`
		// 				: ''
		// 		)
		// 		.forEach((ch) => console.info(ch))
		// );
	});
};

const moveChannels = (
	exchange: Exchange,
	guild: Guild,
	message: Message
) => {
	return exchange.getParticipants().then((pars) => {
		Promise.allSettled(
			pars.map(async (par) => {
				const channels = await par.getChannels();
				if (channels.length === 0) {
					return;
				}

				const catChannel = channels.find((ch) => ch.role === 'category');

				if (!catChannel) {
					console.log(
						`[moveChannels] ${par.participant_id} does not have a category channel`
					);
					return;
				}

				const nonCatChannels = channels.filter(
					(ch) => ch.role !== 'category'
				);
				return await Promise.all(
					nonCatChannels
						.filter((ch) =>
							guild.channels.cache.has(ch.discord_channel_id)
						)
						.map((ch) => guild.channels.cache.get(ch.discord_channel_id))
						.map((ch) =>
							ch!.edit({ parent: catChannel.discord_channel_id })
						)
				)
					.then((moved) => {
						console.log(
							`[moveChannels] moved ${nonCatChannels.length} beneath ${catChannel.discord_channel_id}`
						);
						return true;
					})
					.catch((error) => {
						console.log(
							`[moveChannels] unable to move ${nonCatChannels.length}`
						);
						return false;
					});
			})
		);
	});
};

const exchangeChannelsList = (exchange: Exchange, guild: Guild) => {
	return Promise.all([guild.members.fetch(), guild.channels.fetch()]).then(
		([members, channels]) => {
			console.log(
				`[exchange channels list] Printing channels for ${guild.name}`
			);

			exchange.getParticipants().then((pars) =>
				pars.forEach(async (par) => {
					const member = members.get(par.discord_user_id);

					if (!member) {
						console.log(
							`[showchannels] Participant [${par.participant_id} => ${par.discord_user_id}] is not a member of ${guild.name}.`
						);
						return;
					}

					const channelRows = await par.getChannels();

					console.log(`[showchannels]   ${member.displayName}`);

					channelRows.forEach((channelRow) => {
						const discordChan = channels.get(
							channelRow.discord_channel_id
						);

						console.log(
							`[showchannels]      ${channelRow.role} => ${channelRow.discord_channel_id}`
						);
						if (discordChan) {
							console.log(
								`[showchannels]         ${discordChan.name} => ${discordChan.id}`
							);
							if (discordChan.parent) {
								console.log(
									`[showchannels]            parent: ${discordChan.parent.name} => ${discordChan.parent.id}`
								);
							}
						}
					});
				})
			);
		}
	);
};

interface CommandTree {
	[key: string]: CommandTree | (() => any);
}

function parseCommand(
	message: Message,
	command: string,
	commands: CommandTree
) {
	const parts = command.trim().split(/\s+/);
	let currentNode: CommandTree | (() => any) = commands;

	for (const part of parts) {
		if (typeof currentNode === 'object' && part in currentNode) {
			currentNode = currentNode[part];
		} else {
			for (const key in currentNode) {
				if (
					typeof currentNode === 'object' &&
					key.toLowerCase() === part.toLowerCase()
				) {
					currentNode = currentNode[key];
					break;
				}
			}
			if (typeof currentNode !== 'function' && typeof currentNode !== 'object') {
				return message.reply(`Command not found: ${part}`);
			}
		}
	}

	if (typeof currentNode === 'function') {
		const result = currentNode();
		const promise =
			result instanceof Promise ? result : Promise.resolve(result);
		return promise
			.then(() => {
				return message.reply('Command executed successfully.');
			})
			.catch((error) => {
				return message.reply(`Error executing command: ${error}`);
			});
	} else {
		return message.reply('Command is not a function.');
	}
}

function printChannelTree(
	channels: Collection<string, GuildChannel>,
	predicate?: (channel: GuildChannel) => boolean
) {
	const rootChannels = channels.filter(
		(channel) =>
			(!channel.parentId || channel.type === ChannelType.GuildCategory) &&
			(!predicate || predicate(channel))
	);
	rootChannels.forEach((channel) => printChannel(channel, channels, 0));
}

function printChannel(
	channel: GuildChannel,
	channels: Collection<string, GuildChannel>,
	depth: number,
	predicate?: (channel: GuildChannel) => boolean
) {
	console.log(' '.repeat(depth * 2) + channel.name + ` (${channel.id})`);
	const childChannels = channels.filter(
		(c) =>
			c.parentId === channel.id &&
			c.type !== ChannelType.GuildCategory &&
			(!predicate || predicate(c))
	);
	childChannels.forEach((child) =>
		printChannel(child, channels, depth + 1, predicate)
	);
}

const command: ICommand = {
	name: 'info',
	usage: 'info',
	description: 'Displays various information about the bot.',

	allowOwner: false,
	allowAdmin: true,
	showInHelp: false,
	respondInChannelTypes: [],

	async execute(guild: Guild, message: Message, subcommand: string, info) {
		//message.reply('info command is not yet implemented');

		const botMember = guild.members.me;
		const everyoneRole = guild.roles.everyone;

		return Channel.fromDiscordChannelId(message.channelId)
			.then((c) => c.getParticipant())
			.then((p) => p.getExchange())
			.then((exchange) => {
				const commandTree: CommandTree = {
					guild: {
						channels: {
							list: () => listGuildChannels(guild),
						},
					},
					exchange: {
						lock: () => lockExchange(exchange, guild, message),
						channels: {
							list: () => exchangeChannelsList(exchange, guild),
							repair: () => exchangeChannelsRepair(exchange, guild),
							create: {
								all: () =>
									exchangeChannelsCreateAll(exchange, guild, message),
								categories: () => Promise.reject(`Not yet implemented`),
								text: () => Promise.reject(`Not yet implemented`),
								match: () =>
									createExchangeMatchChannels(exchange, guild, message),
							},
							move: () => moveChannels(exchange, guild, message),
						},
						match: {
							all: () => generateMatches(exchange, guild, message),
							notify: () => notifyMatches(exchange, guild, message),
						},
					},
				};

				return parseCommand(message, subcommand, commandTree);
			})
			.catch((error) => {
				console.error(`[manual match > ${subcommand}] failed`, {
					e: error,
				});
			});
	},
};

export default command;
