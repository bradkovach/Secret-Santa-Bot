import { Message, TextChannel, User } from 'discord.js';
import { createPrivateChannel } from '../channel/createPrivateChannel';
import { joinEmoji } from '../commands/create';
import { DatabaseManager } from '../model/database';
import { ExchangeRow } from '../model/exchange.table';
import { ensureParticipant } from '../participant/ensureParticipant';
import logger from '../utils/logger';
import { printMember } from './printMessage';
import { sendWelcomeMessage } from './sendWelcomeMessage';

export async function joinExchange(
	exchange: ExchangeRow,
	message: Message,
	user: User
) {
	if (!message.member) {
		// not in a guild
		return;
	}

	const channel = await message.channel.fetch();
	const guild = await message.member.guild.fetch();
	const everyoneRole = guild.roles.everyone;

	let participant = await ensureParticipant(exchange.exchange_id, user.id);
	const member = await guild.members.fetch(participant.discord_user_id);

	if (
		channel.isTextBased() &&
		!channel.isDMBased() &&
		!channel.isVoiceBased() &&
		!channel.isThread() &&
		channel.parent
	) {
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
			`${joinEmoji}-${member.displayName}`,
			'Interact with the Secret Santa bot here.  Send `santa! help` for a list of my commands.'
		)
			.then((ch: TextChannel) => sendWelcomeMessage(guild, ch, user))
			.then((message) =>
				logger.info(`Sent welcome message to ${printMember(member)}`)
			);
	}
} //1047739051580600351
