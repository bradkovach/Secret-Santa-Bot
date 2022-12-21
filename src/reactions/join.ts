import { TextChannel } from 'discord.js';
import { createPrivateChannel } from '../channel/createPrivateChannel';
import { joinEmoji } from '../commands/create';

import { IReactionHandler } from '../exchange/IReactionHandler';
import { printMember } from '../exchange/printMessage';
import { sendWelcomeMessage } from '../exchange/sendWelcomeMessage';

import { DatabaseManager } from '../model/database';

import { ensureParticipant } from '../participant/ensureParticipant';
import { getParticipantChannelName } from '../utils/channelNames';
import { isGuildTextChannel } from '../utils/discord/isGuildTextChannel';

import logger, { logAndReturnMessage } from '../utils/logger';

const join: IReactionHandler = {
	name: 'join',
	description: 'Join the gift exchange!',
	emoji: [joinEmoji],
	async execute(reaction, user, richExchange?, richChannel?) {
		if (!richExchange) {
			return;
		}

		if (richExchange.started) {
			console.log(
				'User attempted to join an exchange that has already started.'
			);
			return;
		}

		const message = await reaction.message.fetch();
		if (!message.member) {
			return;
		}

		const member = await message.member.fetch();
		if (!member) {
			return;
		}

		const channel = await message.channel.fetch();
		if (!channel) {
			return;
		}

		const guild = await member.guild.fetch();
		if (!guild) {
			return;
		}

		const participant = await ensureParticipant(
			richExchange.exchange_id,
			user.id
		);

		const everyoneRole = guild.roles.everyone;

		if (isGuildTextChannel(channel) && channel.parent) {
			const category = await channel.parent.fetch();
			const countOfChannels = await DatabaseManager.getInstance()
				.selectFrom('channels')
				.where('channels.participant_id', '=', participant.participant_id)
				.where('channels.role', '=', 'participant')
				.select([
					(x) => x.fn.count('channels.participant_id').as('channelCount'),
				])
				.executeTakeFirstOrThrow();
			if (countOfChannels && countOfChannels.channelCount > 0) {
				return;
			}
			return await createPrivateChannel(
				category,
				everyoneRole,
				participant,
				message.client.user.id,
				'participant',
				getParticipantChannelName(message.member),
				'Interact with the Secret Santa bot here.  Send `santa! help` for a list of my commands.'
			)
				.then((ch: TextChannel) => sendWelcomeMessage(guild, ch, user))
				.then(logAndReturnMessage);
		}

		return Promise.resolve();
	},
};

export default join;
