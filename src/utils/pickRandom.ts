import { MessageEmbed } from 'discord.js';
import { Message } from 'discord.js';
import { query } from '../mysql';
import { UserRow } from '../rows/UserRow';
import config from '../config.json';
import messageCommand from '../commands/message';
import shippedCommand from '../commands/shipped';
import { shuffle } from './shuffle';

export async function pickRandom(
	message: Message,
	exchangeId: number,
	prefix: string
) {
	const rows = await query<UserRow[]>(`SELECT * 
	FROM users 
	WHERE exchangeId = ${exchangeId} 
	AND TRIM(wishlist) <> '' 
	AND TRIM(address) <> ''`);
	var userIds: number[] = rows.map((row) => row.userId);

	shuffle(userIds);

	for (var i = 0; i < userIds.length; i++) {
		var partnerId =
			// if this the last user in the array...
			i == userIds.length - 1
				? // assign them to the first person in the array
				  userIds[0]
				: // otherwise assign them to the next person
				  userIds[i + 1];

		try {
			await query<never>(
				`UPDATE users SET partnerId = ${partnerId} WHERE userId = ${userIds[i]}`
			);
			const partnerInfo = (
				await query<UserRow[]>(
					`SELECT * FROM users WHERE userId = ${partnerId}`
				)
			)[0];
			const user = await message.client.users.fetch(userIds[i].toString());

			const startEmbed = new MessageEmbed()
				.setTitle('__Secret Santa Started!__')
				.setDescription(
					[
						`You were chosen to gift <@${partnerId}> 🎄`,
						`You can send them an anonymous message with ${prefix}${messageCommand.name} <your secret message>`,
						`When you have shipped your gift, reply with \`${prefix}${shippedCommand.name} <tracking number>\`.`,
					].join('\n')
				)
				.addField('Giftee Profile', partnerInfo.wishlist)
				.addField('Giftee Address', partnerInfo.address)
				.setFooter('Shhhhhhhhh')
				.setColor(config.embeds_color);

			await user.send(startEmbed);
		} catch (err) {
			console.log(
				'[START.JS] Unable to fetch a user while picking randomly: ' + err
			);
		}
	}
}
