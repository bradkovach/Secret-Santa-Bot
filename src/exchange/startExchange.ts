import {
	codeBlock,
	EmbedBuilder,
	Guild,
	GuildMember,
	GuildScheduledEvent,
	inlineCode,
	italic,
	Message,
	NewsChannel,
	TextChannel,
	User,
} from 'discord.js';

import { Transaction } from 'kysely';
import { createPrivateChannel } from '../channel/createPrivateChannel';
import { joinEmoji } from '../commands/create';
import helpCommand from '../commands/help';
import partnerCommand from '../commands/partner';
import shippedCommand from '../commands/shipped';
import { ChannelRow } from '../model/channels.table';

import { DatabaseManager, SecretSantaSchema } from '../model/database';
import { ExchangeRow } from '../model/exchange.table';
import { MatchRow, NewMatchRow } from '../model/matches.table';
import {
	DiscordSnowflake,
	ParticipantRow,
} from '../model/participants.table';

import logger from '../utils/logger';
import { groupBy } from '../utils/pickRandom';
import { showCommandUsage } from '../utils/showCommandUsage';
import { shuffle } from '../utils/shuffle';
import { brjoin, p, passage } from '../utils/text';

import { isExchangeOwner } from './isExchangeOwner';

interface MatchContext {
	participantChannel: ChannelRow;
	asParticipantDiscordChannel: TextChannel;
	santa: ParticipantRow;
	santaGuildMember: GuildMember;
	asSantaDiscordChannel: TextChannel;
	giftee: ParticipantRow;
	gifteeGuildMember: GuildMember;
	asGifteeDiscordChannel: TextChannel;
}

// interface Match {
// 	match_id: bigint;
// 	santa_participant_id: bigint;
// 	giftee_participant_id: bigint;
// }

// type NewMatch = Omit<Match, 'match_id'>;

const sanityChecks = (
	countryToParticipants: Map<string, ParticipantRow[]>
): Promise<Map<string, ParticipantRow[]>> => {
	logger.info(`sanityChecks(countryToParticipants)`);
	return new Promise((resolve, reject) => {
		const validCountryToParticipants = new Map<string, ParticipantRow[]>();

		countryToParticipants.forEach((p, k, m) => {
			if (p.length < 3) {
				logger.warn(
					`${k} has too few participants for matching. Removed from matching!`
				);
			} else {
				validCountryToParticipants.set(k, p);
			}
		});

		if (validCountryToParticipants.size > 0) {
			resolve(validCountryToParticipants);
		} else {
			reject(
				`No country groups large enough for matching. Try again when more people have joined.`
			);
		}
	});
};

const getLockExchangeFn =
	(trx: Transaction<SecretSantaSchema>) => (exchange: ExchangeRow) => {
		logger.info(
			`lockExchangeFn(ex): locking exchange, ${exchange.exchange_id}`
		);
		return trx
			.updateTable('exchanges')
			.set({ started: true })
			.where('exchange_id', '=', exchange.exchange_id)
			.executeTakeFirstOrThrow()
			.then((ud) => {
				logger.info(
					`Locked exchange ${exchange.exchange_id} for matching.`
				);
				return exchange;
			});
	};

const groupByCountry = (participants: ParticipantRow[]) => {
	logger.info(
		`groupByCountry(): Grouping ${participants.length} by country.`
	);
	return groupBy(participants, (p) => p.iso_country_code);
};

const generateMatches = (
	participantsByCountry: Map<string, ParticipantRow[]>
): Promise<NewMatchRow[]> => {
	logger.info(`generateMatches(participants)`);
	return new Promise((resolve, reject) => {
		const matches: NewMatchRow[] = [];

		participantsByCountry.forEach((participants, country) => {
			logger.info(
				`generateMatches(): Matching ${participants.length} participants in ${country}.`
			);

			const shuffled = shuffle(participants);

			for (let santaIdx = 0; santaIdx < shuffled.length; santaIdx++) {
				let gifteeIdx =
					santaIdx === shuffled.length - 1 ? 0 : santaIdx + 1;

				let santa = shuffled[santaIdx],
					giftee = shuffled[gifteeIdx];

				matches.push({
					santa_participant_id: santa.participant_id,
					giftee_participant_id: giftee.participant_id,
				});
			}
		});

		resolve(matches);
	});
};

const getSaveMatchesFn =
	(trx: Transaction<SecretSantaSchema>) =>
	(newMatches: NewMatchRow[]): Promise<MatchRow[]> => {
		logger.info(
			`saveMatchesFn(newMatches): saving ${newMatches.length} matches`
		);
		return Promise.all(
			newMatches.map((newMatch) =>
				trx
					.insertInto('matches')
					.values(newMatch)
					.executeTakeFirstOrThrow()
					.then((ir) => {
						return {
							match_id: ir.insertId,
							...newMatch,
						} as MatchRow;
					})
			)
		);
	};

/**
 * Creates a function that will create discord channels and persist them to db in transaction
 * @param trx Transaction to use for the operation, so this can be undone if necessary.
 * @returns A function that can be used to create santa channel
 */
function getCreateSantaChannelsFn(
	trx: Transaction<SecretSantaSchema>,
	guild: Guild,
	channel: TextChannel | NewsChannel,
	bot_discord_id: DiscordSnowflake
) {
	logger.info(
		`getCreateSantaChannelsFn(): returning transaction-ready function.`
	);
	return (matches: MatchRow[]): Promise<MatchContext[]> =>
		Promise.all(matches)
			.then((matches) => {
				return Promise.all(
					matches.map(async (match) => {
						logger.info(
							`matching: fetching santa (${match.santa_participant_id}) and giftee (${match.giftee_participant_id})`
						);

						return {
							...match,
							participantChannel: await trx
								.selectFrom('channels')
								.where('participant_id', '=', match.santa_participant_id)
								.where('role', '=', 'participant')
								.selectAll()
								.executeTakeFirstOrThrow(),
							santa: await trx
								.selectFrom('participants')
								.where('participant_id', '=', match.santa_participant_id)
								.selectAll()
								.executeTakeFirstOrThrow(),
							giftee: await trx
								.selectFrom('participants')
								.where('participant_id', '=', match.giftee_participant_id)
								.selectAll()
								.executeTakeFirstOrThrow(),
						};
					})
				);
			})
			.then((matches) => {
				logger.info(`matching: getting guild members`);
				return Promise.all(
					matches.map(async (match) => ({
						...match,
						santaGuildMember: await guild.members.fetch(
							match.santa.discord_user_id
						),
						gifteeGuildMember: await guild.members.fetch(
							match.giftee.discord_user_id
						),
					}))
				);
			})
			.then((matches) => {
				return Promise.all(
					matches.map(async (match) => {
						logger.info(`matching: Creating discord channels`);
						return {
							...match,
							asParticipantDiscordChannel: await guild.channels.fetch(
								match.participantChannel.discord_channel_id
							),
							asSantaDiscordChannel: await createPrivateChannel(
								channel.parent!,
								guild.roles.everyone,
								match.santa,
								bot_discord_id,
								'santa',
								`${joinEmoji}-${match.santaGuildMember.displayName}-to-giftee`,
								`Messages to this channel will be anonymously sent to your giftee, ${match.gifteeGuildMember.displayName}.`
							),
							asGifteeDiscordChannel: await createPrivateChannel(
								channel.parent!,
								guild.roles.everyone,
								match.santa,
								bot_discord_id,
								'giftee',
								`${joinEmoji}-${match.santaGuildMember.displayName}-to-santa`,
								`Messages to this channel will be sent to your Secret Santa.`
							),
						};
					})
				);
			})
			.then((matches) =>
				matches.map(
					(match) =>
						({
							// giftee
							giftee: match.giftee,
							gifteeGuildMember: match.gifteeGuildMember,

							// santa
							santa: match.santa,
							santaGuildMember: match.santaGuildMember,

							// channels
							asParticipantDiscordChannel:
								match.asParticipantDiscordChannel,
							asSantaDiscordChannel: match.asSantaDiscordChannel,
							asGifteeDiscordChannel: match.asGifteeDiscordChannel,
						} as MatchContext)
				)
			);
}

function sendMatchNotifications(
	guild: Guild,
	channelGroups: MatchContext[]
): Promise<Message<true>[]> {
	return Promise.all(
		channelGroups.map((g) =>
			g.asParticipantDiscordChannel.send({
				content: passage(
					p(`Hello, ${g.santaGuildMember.toString()}!`),
					p(
						`The Secret Santa exchange has begun and you have been matched to another participant!`,
						`Your match and your Secret Santa are *not* the same person.`
					),
					brjoin(
						italic(`If you need any assistance with this bot, send...`),
						showCommandUsage(helpCommand)
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
									`You have been matched to ${g.gifteeGuildMember.toString()}!`,
									`You can secretly message your match by using the ${g.asSantaDiscordChannel.toString()} channel.`
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
									italic(`If you don't have a tracking number, send...`),
									inlineCode(`santa! shipped none`)
								)
							)
						)
						.setFields([
							{ name: 'Address', value: g.giftee.address },
							{
								name: 'Profile',
								value: g.giftee.wishlist,
							},
						]),
					new EmbedBuilder()
						.setTitle('Your Santa')
						.setDescription(
							[
								'You have also been matched with a Secret Santa!',
								`You can message your Secret Santa using the ${g.asGifteeDiscordChannel.toString()} channel.`,
							].join(' ')
						),
				],
			})
		)
	);
}

export async function startExchange(
	exchange: ExchangeRow,
	user: User,
	message: Message<boolean>,
	channel: TextChannel | NewsChannel
) {
	// return;
	const kdb = DatabaseManager.getInstance();
	const isOwner = await isExchangeOwner(exchange.exchange_id, user.id);
	if (!isOwner) {
		return;
	}

	if (!channel.parent) {
		return;
	}

	const discord_owner_user_id = user.id;
	const guild = await channel.guild.fetch();

	guild.channels.create({
		name: '',
	});

	try {
		const exchange = await kdb
			.selectFrom('exchanges')
			.where('discord_owner_user_id', '=', discord_owner_user_id)
			.where('started', '=', false)
			.selectAll()
			.executeTakeFirstOrThrow();

		if (!exchange) {
			return;
		}

		const createdDiscordChannelIds: string[] = [];

		kdb
			.transaction()
			.execute((trx) => {
				const lockExchange = getLockExchangeFn(trx);
				const saveMatches = getSaveMatchesFn(trx);
				const createSantaChannels = getCreateSantaChannelsFn(
					trx,
					guild,
					channel,
					message.client.user.id
				);
				return lockExchange(exchange)
					.then((exchange) =>
						trx
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
							.execute()
					)
					.then((participants) => groupByCountry(participants))
					.then((participants) => sanityChecks(participants))
					.then((participantsByCountry) =>
						generateMatches(participantsByCountry)
					)
					.then((newMatches) => saveMatches(newMatches))
					.then((savedMatches) => createSantaChannels(savedMatches))
					.then((channelGroups) => {
						// these are remembered in case the entire process fails and they need to be deleted
						channelGroups.forEach((c) => {
							createdDiscordChannelIds.push(
								c.asGifteeDiscordChannel.id,
								c.asSantaDiscordChannel.id
							);
						});
						return channelGroups;
					})
					.then((channels) => sendMatchNotifications(guild, channels));
				// .then((resolvedChannels) => crea(resolvedChannels));
			})
			.then((allDone) => {
				message.reply(`Participants have been matched! Have fun!`);
			})
			.catch((reason) => {
				message.reply(
					passage(p('Unable to start this exchange!'), [
						codeBlock(reason.toString()),
					])
				);
				logger.error(
					`Unable to start this exchange.  There was an issue matching participants.  Error was '${reason}'.`
				);
				logger.info(
					`Attempting to remove santa/giftee channels from Discord.`
				);

				Promise.all(
					createdDiscordChannelIds.map((channelId) => {
						logger.info(`Deleting Discord channel ${channelId}`);
						return guild.channels
							.delete(channelId)
							.then(() => {
								logger.info(`...DELETED Discord channel ${channelId}.`);
								return channelId;
							})
							.catch((err) => {
								logger.warn(
									`...UNABLE TO DELETE Discord channel ${channelId}. Error: '${err}'`
								);
							});
					})
				).then((allDeleted) => {
					logger.info(
						`${allDeleted.length} Santa/Giftee channels removed from Discord`
					);
				});
			});

		/*
		// if (participants.length > 2) {
		// 	await kdb
		// 		.updateTable('exchanges')
		// 		.set({
		// 			started: true,
		// 		})
		// 		.where('exchange_id', '=', exchange.exchange_id)
		// 		.execute();

		// 	const statusMessage = await message.reply(
		// 		`Shuffling participants and starting the exchange!`
		// 	);

		// 	// group by country
		// 	const groupedByCountryCode = groupBy(
		// 		participants,
		// 		(p) => p.iso_country_code
		// 	);

		// 	groupedByCountryCode.forEach(
		// 		async (countryParticipants, countryCode) => {
		// 			// if group too small, error
		// 			if (countryParticipants.length < 2) {
		// 				logger.info(
		// 					`Unable to match in country ${countryCode} due to too few participants.`
		// 				);
		// 				return;
		// 			}
		// 			// get participant_id list
		// 			const participant_ids = countryParticipants.map(
		// 				(p) => p.participant_id
		// 			);

		// 			// shuffle
		// 			shuffle(participant_ids);

		// 			logger.info('shuffling participants...');

		// 			kdb.transaction().execute(async (trx) => {
		// 				for (var i = 0; i < participant_ids.length; i++) {
		// 					const santa_participant_id = participant_ids[i];
		// 					const giftee_participant_id =
		// 						// if this is the last person in the group...
		// 						i === participant_ids.length - 1
		// 							? // assign them the first person in the group
		// 							  participant_ids[0]
		// 							: // otherwise assign to the next person
		// 							  participant_ids[i + 1];
		// 					await trx
		// 						.updateTable('participants')
		// 						.set({
		// 							giftee_participant_id,
		// 						})
		// 						.where('participant_id', '=', santa_participant_id)
		// 						.executeTakeFirstOrThrow();
		// 				}
		// 			});
		// 		}
		// 	);

		// 	const matchedParticipants = (await kdb
		// 		.selectFrom('participants')
		// 		.where('exchange_id', '=', exchange.exchange_id)
		// 		.where('giftee_participant_id', 'is not', null)
		// 		.selectAll()
		// 		.execute()) as WithRequiredKey<
		// 		Participant,
		// 		'giftee_participant_id'
		// 	>[];

		// 	const participantMap = new Map<bigint, Participant>();

		// 	matchedParticipants.forEach((p) => {
		// 		participantMap.set(p.participant_id, p);
		// 	});

		// 	const guildMembers = await guild.members.fetch();

		// 	matchedParticipants.forEach((santaParticipant) => {
		// 		if (!santaParticipant.giftee_participant_id) {
		// 			logger.warn(`Somehow, santaParticipant did not have a giftee`);
		// 			return;
		// 		}

		// 		let gifteeParticipant = participantMap.get(
		// 			santaParticipant.giftee_participant_id
		// 		);

		// 		if (!gifteeParticipant) {
		// 			logger.warn(`gifteeParticipant was null`);
		// 			return;
		// 		}
		// 		let santaMember = guildMembers.get(
		// 			santaParticipant.discord_user_id
		// 		);
		// 		let gifteeMember = guildMembers.get(
		// 			gifteeParticipant.discord_user_id
		// 		);
		// 		if (!santaMember) {
		// 			logger.warn(
		// 				`participant ${santaParticipant.participant_id} is not a member of guild ${guild.name}.`
		// 			);
		// 			return;
		// 		}

		// 		if (!gifteeMember) {
		// 			logger.warn(
		// 				`${gifteeParticipant.participant_id} is not a member of guild ${guild.name}.`
		// 			);
		// 			return;
		// 		}

		// 		logger.info(
		// 			[
		// 				`[${guild.name}]`,
		// 				printMember(santaMember),
		// 				`matched to`,
		// 				printMember(gifteeMember),
		// 			].join(' ')
		// 		);

		// 		Promise.all([
		// 			createPrivateChannel(
		// 				channel.parent!,
		// 				guild.roles.everyone,
		// 				santaParticipant,
		// 				message.client.user,
		// 				'santa',
		// 				`${joinEmoji}-${santaMember.displayName}-to-giftee`,
		// 				`Messages to this channel will be anonymously sent to your giftee, ${gifteeMember.displayName}.`
		// 			),
		// 			createPrivateChannel(
		// 				channel.parent!,
		// 				guild.roles.everyone,
		// 				santaParticipant,
		// 				message.client.user,
		// 				'giftee',
		// 				`${joinEmoji}-${santaMember.displayName}-to-santa`,
		// 				`Messages to this channel will be sent to your Secret Santa.`
		// 			),
		// 			Promise.resolve(santaMember),
		// 			Promise.resolve(gifteeMember),
		// 		]).then(
		// 			([
		// 				toGifteeChannel,
		// 				toSantaChannel,
		// 				santaMember,
		// 				gifteeMember,
		// 			]) => {
		// 				sendMessageToChannel(guild, santaParticipant, 'participant');
		// 			}
		// 		);
		// 	});
		// } else {
		// 	let startReacts = message.reactions.cache.find(
		// 		(reaction) => reaction.emoji.name === startEmoji
		// 	);
		// 	startReacts?.remove().then((removed) => message.react(startEmoji));
		// 	message.reply(
		// 		`There aren't enough participants to start this exchange!  Wait for more participants and try again later.`
		// 	);
		// }
		*/
	} catch (e) {
		message.reply(`You cannot start a gift exchange here.`);
		logger.warn(e);
	}
}
