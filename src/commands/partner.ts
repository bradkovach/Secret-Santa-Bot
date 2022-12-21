import { EmbedBuilder, Guild, Message } from 'discord.js';
import { ParticipantState } from '../ParticipantState';
import type { ICommand } from '../ICommand';
import { DatabaseManager } from '../model/database';
import { Channel } from '../model/Channel';
import { p, passage } from '../utils/text';
import logger from '../utils/logger';

// const Discord = require('discord.js');
// const config = require('../config.json');
// const methods = require('../utils/methods');

const command: ICommand = {
	name: 'match',
	usage: 'match',
	description: 'View information about your match.',

	allowAfter: ParticipantState.HAS_GIFTEE,
	allowBefore: ParticipantState.SHIPPED_TO_GIFTEE,

	allowOwner: false,
	allowAdmin: false,
	showInHelp: false,
	respondInChannelTypes: ['participant'],

	async execute(guild: Guild, message: Message) {
		if (!message.inGuild()) {
			return;
		}
		const discord_user_id = message.author.id;
		const discord_channel_id = message.channelId;

		if (!message.member) {
			logger.info(
				`[partner] Could not get member for message, ${message.id}`
			);
			return;
		}

		const santaMember = message.member;

		const participantChannel = await DatabaseManager.getInstance()
			.selectFrom('channels')
			.where('channels.discord_channel_id', '=', discord_channel_id)
			.where('channels.role', '=', 'participant')
			.selectAll()
			.executeTakeFirst();

		if (!participantChannel) {
			return;
		}

		const otherChannels = await DatabaseManager.getInstance()
			.selectFrom('channels')
			.where(
				'channels.participant_id',
				'=',
				participantChannel.participant_id
			)
			.where('channels.role', '!=', 'participant')
			.selectAll()
			.execute();

		if (otherChannels.length === 0) {
			return message.reply(
				`You haven't been matched to a partner yet.  Please try this command again after you are matched.`
			);
		}

		const members = await guild.members.fetch();

		Channel.fromDiscordChannelId(discord_channel_id)
			.then((chan) => chan.getParticipant())
			.then((santaPart) => santaPart.getGiftees())
			.then((giftees) =>
				giftees && giftees[0]
					? Promise.resolve(giftees[0])
					: Promise.reject(`No giftees at this time`)
			)
			.then((giftee) => {
				const gifteeMember = members.get(giftee.discord_user_id);
				message.reply({
					content: passage(
						p(`Hello, ${message.member?.toString()}!`),
						p(
							`Here's information about your giftee, ${
								gifteeMember!.displayName
							}!`
						)
					),
					embeds: [
						new EmbedBuilder().setFields([
							{ name: 'Address', value: giftee.address },
							{ name: 'Profile', value: giftee.wishlist },
						]),
					],
				});
			});

		// const match = await DatabaseManager.getInstance()
		// 	.selectFrom('participants as santa')
		// 	.innerJoin(
		// 		'participants as giftee',
		// 		'santa.giftee_participant_id',
		// 		'giftee.participant_id'
		// 	)
		// 	.where(
		// 		'santa.participant_id',
		// 		'=',
		// 		participantChannel.participant_id
		// 	)
		// 	.selectAll()
		// 	.executeTakeFirst();

		// if(match) {
		// 	console.log({match});
		// }

		// const row = (
		// 	await query<UserRow[]>(getUserById, [message.author.id])
		// )[0];
		// const partnerRow = (
		// 	await query<UserRow[]>(getUserById, [row.partnerId])
		// )[0];
		// const wishList = partnerRow.wishlist || 'No preferences.';
		// const address = partnerRow.address || 'No address.';

		// const giftee = await message.client.users.fetch(
		// 	row.partnerId.toString()
		// );

		// const partnerEmbed = new MessageEmbed()
		// 	.setTitle('__Partner Information__')
		// 	.addField('You are Secret Santa for...', giftee.tag)
		// 	.addField('Profile', wishList)
		// 	.addField('Address', address)
		// 	.setColor(config.embeds_color)
		// 	.setFooter(
		// 		'Need more info? Message them with the message command! `s!help message` for more info.'
		// 	);

		// message.channel.send(partnerEmbed);
	},
};

export default command;
