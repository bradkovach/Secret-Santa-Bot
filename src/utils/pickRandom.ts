import { Message } from 'discord.js';

export function groupBy<K, V>(
	list: Array<V>,
	keyGetter: (input: V) => K
): Map<K, Array<V>> {
	const map = new Map<K, Array<V>>();

	list.forEach((item) => {
		const key = keyGetter(item);
		const collection = map.get(key);
		if (!collection) {
			map.set(key, [item]);
		} else {
			collection.push(item);
		}
	});
	return map;
}

export async function pickRandom(
	message: Message,
	exchangeId: number,
	prefix: string
) {
	// const userRows = await query<UserRow[]>(
	// 	`SELECT *
	// FROM users
	// WHERE exchangeId = ?
	// AND TRIM(wishlist) <> ''
	// AND TRIM(address) <> ''
	// AND TRIM(iso_country_code) <> ''`,
	// 	[exchangeId]
	// );
	// let groupedByCountryCode = groupBy(userRows, (r) => r.iso_country_code);
	// groupedByCountryCode.forEach(async (groupedUserRows, countryCode) => {
	// 	if (groupedUserRows.length < 2) {
	// 		return logger.info(`Unable to match in country ${countryCode}.`);
	// 	}
	// 	logger.info(
	// 		`Processing ${groupedUserRows.length} participants in ${countryCode}`
	// 	);
	// 	const userIds = groupedUserRows.map((row) => row.userId);
	// 	shuffle(userIds);
	// 	for (var i = 0; i < userIds.length; i++) {
	// 		var partnerId =
	// 			// if this the last user in the array...
	// 			i == userIds.length - 1
	// 				? // assign them to the first person in the array
	// 				  userIds[0]
	// 				: // otherwise assign them to the next person
	// 				  userIds[i + 1];
	// 		try {
	// 			await query<never>(
	// 				`UPDATE users SET partnerId = ? WHERE userId = ?`,
	// 				[partnerId, userIds[i]]
	// 			);
	// 			const partnerRow = (
	// 				await query<UserRow[]>(`SELECT * FROM users WHERE userId = ?`, [
	// 					partnerId,
	// 				])
	// 			)[0];
	// 			const santaUser = await message.client.users.fetch(
	// 				userIds[i].toString()
	// 			);
	// 			const gifteeUser = await message.client.users.fetch(
	// 				partnerId.toString()
	// 			);
	// 			const startEmbed = new EmbedBuilder()
	// 				.setTitle('__Secret Santa Started!__')
	// 				.setDescription(
	// 					[
	// 						`You were chosen to gift ${gifteeUser.toString()} 🎄`,
	// 						`You can send them an anonymous message with \`${prefix}${messageCommand.name} giftee <your secret message>\`.`,
	// 						`When you have shipped your gift, reply with \`${prefix}${shippedCommand.name} <tracking number>\`.`,
	// 					].join('\n')
	// 				)
	// 				.addFields([
	// 					{name: "Giftee Profile", value: partnerRow.wishlist},
	// 					{name: "Giftee Address", value: partnerRow.standardized_address}
	// 				])
	// 				// .addField('Giftee Profile', partnerRow.wishlist)
	// 				// .addField('Giftee Address', partnerRow.standardized_address)
	// 				.setFooter({'text': 'Shhhhhhhh...'})
	// 				// .setColor(config.embeds_color);
	// 			await santaUser
	// 				.send({ embeds: [startEmbed]})
	// 				.then((newMessage) =>
	// 					logger.info(
	// 						`[utils/pickRandom] ${logUser(
	// 							santaUser
	// 						)} chosen to be Secret Santa for ${logUser(gifteeUser)}`
	// 					)
	// 				);
	// 		} catch (err) {
	// 			logger.error(
	// 				'[START.JS] Unable to fetch a user while picking randomly: ' +
	// 					err
	// 			);
	// 		}
	// 	}
	// });
}
