import { Client, User } from 'discord.js';
import { Database } from '../Database';
import { UserRow } from '../rows/UserRow';

import config from '../config.json';
import { groupBy } from '../utils/pickRandom';
import { logUser } from '../utils/discord';
import chalk from 'chalk';
import {
	withDisposable,
	withDisposableAsync,
} from '../utils/withDisposable';
import { flagFromThree, flagFromTwo } from '../utils/countries';

let db = Database.getInstance();

interface SantaMap {
	[santaId: string]: string;
}

const invalidUser = (id: string | number) =>
	`${chalk.red.bold('!!')} invalid user (${id})`;

db.with((connection) => {
	return new Promise((done, crash) => {
		const dbUserCache: Record<number, UserRow> = {},
			discordUserCache: Record<string, User> = {},
			santaMap: SantaMap = {};

		const client = new Client({
			messageCacheMaxSize: 50,
			messageCacheLifetime: 300,
			messageSweepInterval: 500,
			disableMentions: 'everyone',
			partials: ['MESSAGE', 'REACTION', 'GUILD_MEMBER', 'USER'],
		});
		withDisposableAsync(
			client,
			'destroy'
		)((client) => {
			return new Promise((resolve, reject) => {
				client.on('ready', () => {
					connection.query(
						`SELECT * FROM users WHERE wishlist<> '' and address<> '' and partnerId <> 0 ORDER BY userId ASC`,
						async (err: any, rows: UserRow[]) => {
							if (err) {
								return reject(err);
							}

							if (rows) {
								await rows.forEach(async (row) => {
									try {
										const user = await client.users.fetch(
											row.userId.toString()
										);
										if (row && user) {
											dbUserCache[row.userId] = row;
											discordUserCache[row.userId] = user;
										}
										//console.log(`Fetched ${row.userId} from discord`);
									} catch (error) {
										console.error(`Unable to cache user ${row.userId}.`);
									}
								});
								console.log(
									`Cached ${Object.keys(dbUserCache).length} db rows`
								);
								console.log(
									`Cached ${
										Object.keys(discordUserCache).length
									} discord users`
								);

								console.log(`Indexing Santas`);
								await rows.forEach(async (row) => {
									if (
										row.userId &&
										row.partnerId &&
										discordUserCache[row.userId]
									) {
										santaMap[row.userId.toString()] =
											row.partnerId.toString();
									} else {
										console.error(
											`Problem indexing Santa ${row.userId} for ${row.partnerId}`
										);
									}
								});

								const groupedSantas = groupBy(
									rows,
									(row) => row.iso_country_code
								);

								console.log(`Printing Santas`);
								groupedSantas.forEach((santaRows, country, all) => {
									console.log(flagFromThree(country),country);
									santaRows.forEach((santaRow, idx) => {
										const santaId = santaRow.userId,
											gifteeId = santaRow.partnerId,
											discordSanta = discordUserCache[santaId],
											discordGiftee = discordUserCache[gifteeId],
											santaString = discordSanta
												? logUser(discordSanta)
												: invalidUser(santaId),
											gifteeString = discordGiftee
												? logUser(discordGiftee)
												: invalidUser(gifteeId);

										const good = chalk.bold.green;
										const bad = chalk.bold;
										const santaHighlighter =
											santaRow.tracking_number.trim() !== ''
												? good
												: chalk.bold.redBright;
										const gifteeHighlighter =
											santaRow.received === 1 ? good : chalk.grey;
										console.log(
											`\t${santaHighlighter(
												santaString
											)} => ${gifteeHighlighter(gifteeString)}`
										);
									});
								});

								console.log(`Printing santa assignment loops...`);
								groupedSantas.forEach((santaRows, countryCode, all) => {
									console.log(flagFromThree(countryCode), countryCode);

									let santasVisited: Record<string, boolean> = {};

									let currentSantaIdx = 0;
									while (santaRows.length > 0) {
										let currentSanta = santaRows.splice(
											currentSantaIdx,
											1
										)[0];
										const santaId = currentSanta.userId,
											gifteeId = currentSanta.partnerId,
											isShipped =
												currentSanta.tracking_number.trim() !== '',
											isReceived = currentSanta.received === 1,
											discordSanta = discordUserCache[santaId];
										if (gifteeId !== 0) {
											const discordGiftee = discordUserCache[gifteeId];

											const santaString = discordSanta
												? logUser(discordSanta)
												: invalidUser(santaId);
											const gifteeString = discordGiftee
												? logUser(discordGiftee)
												: invalidUser(gifteeId);
											const santaHighlighter = isShipped
												? chalk.bold.green
												: chalk.bold.redBright;
											const gifteeHighlighter = isReceived
												? chalk.bold.green
												: isShipped
												? chalk.bold.yellow
												: chalk.grey;

											// const asCsv = `${discordSanta.tag},${discordSanta.id},${discordGiftee.tag},${discordGiftee.id},${currentSanta.tracking_number},${currentSanta.received}`;
											const asDashboard = `\t${santaHighlighter(
												santaString
											)} => ${gifteeHighlighter(gifteeString)}${
												isReceived
													? ''
													: ` ${currentSanta.tracking_number}`
											}`;
											console.log(asDashboard);

											// remember we were here
											santasVisited[santaId.toString()] = true;

											// if next santa has already been visited, reset currentSantaIdx to 0
											if (santasVisited[gifteeId.toString()]) {
												currentSantaIdx = 0;
												// if we still have rows to print, but we have a new cycle, print a break
												if (santaRows.length > 0) {
													console.log('\t-- new cycle --');
												}
											} else {
												currentSantaIdx = santaRows.findIndex(
													({ userId }) => userId === gifteeId
												);
											}
										} else {
											console.error(`\t${santaId} => ${gifteeId}.`);
											currentSantaIdx = 0;
										}
									}
									console.log('\t--');

									if (santaRows.length > 0) {
										console.error(
											`\tUnable to validate matches for ${santaRows.length} ${countryCode} users!`
										);
										santaRows.forEach((santa: UserRow) =>
											console.log(
												`\t - ${discordUserCache[santa.userId.toString()]}`
											)
										);
									} else {
										console.log(
											`\tAll ${countryCode} Santas matched to a Giftee.`
										);
									}
								});
							}
							client.destroy();
							return resolve(true);
						}
					);
				});

				client.on('error', async () => reject());

				client.login(config.botToken);
			});
		})
			.then(done)
			.catch(crash);
	});
})
	.then((result) => console.log(`ALL DONE. No errors.`, { result }))
	.catch((error) => console.error(`Completed with error`, { error }));
