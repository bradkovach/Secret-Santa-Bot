import { ChannelRole } from './model/channels.table';
import { DatabaseManager } from './model/database';
import { DiscordSnowflake } from './model/participants.table';

const otherChannelCache = new Map<string, MessagePortal>();

export function getOtherChannel(discord_channel_id: DiscordSnowflake): Promise<MessagePortal> {
	if (otherChannelCache.has(discord_channel_id)) {
		return Promise.resolve(otherChannelCache.get(discord_channel_id)!);
	}
	return DatabaseManager.getInstance()
		.selectFrom('channels as srcChannel')
		.innerJoin(
			'participants as srcParticipant',
			'srcChannel.participant_id',
			'srcParticipant.participant_id'
		)
		.innerJoin('matches', (join) =>
			join
				.onRef(
					'srcParticipant.participant_id',
					'=',
					'matches.giftee_participant_id'
				)
				.orOnRef(
					'srcParticipant.participant_id',
					'=',
					'matches.santa_participant_id'
				)
		)
		.innerJoin('channels as dstChannel', (join) =>
			join
				.onRef(
					'matches.giftee_participant_id',
					'=',
					'dstChannel.participant_id'
				)
				.orOnRef(
					'matches.santa_participant_id',
					'=',
					'dstChannel.participant_id'
				)
		)
		.innerJoin('participants as dstParticipant', (join) =>
			join.onRef(
				'dstChannel.participant_id',
				'=',
				'dstParticipant.participant_id'
			)
		)
		.where('srcChannel.discord_channel_id', '=', discord_channel_id)
		.whereRef(
			'srcChannel.participant_id',
			'!=',
			'dstChannel.participant_id'
		)
		.where((wb) =>
			wb
				.where((whenSanta) =>
					whenSanta
						.where('srcChannel.role', '=', 'santa')
						.where('dstChannel.role', '=', 'giftee')
						.whereRef(
							'matches.santa_participant_id',
							'=',
							'srcParticipant.participant_id'
						)
				)
				.orWhere((whenGiftee) =>
					whenGiftee
						.where('srcChannel.role', '=', 'giftee')
						.where('dstChannel.role', '=', 'santa')
						.whereRef(
							'matches.giftee_participant_id',
							'=',
							'srcParticipant.participant_id'
						)
				)
		)
		.select([
			'srcParticipant.discord_user_id as srcDiscordUserId',
			'srcChannel.discord_channel_id as srcDiscordChannelId',
			'srcChannel.role as srcChannelRole',

			'dstParticipant.discord_user_id as dstDiscordUserId',
			'dstChannel.discord_channel_id as dstDiscordChannelId',
			'dstChannel.role as dstChannelRole',
		])
		.executeTakeFirstOrThrow()
		.then((other: MessagePortal) => {
			otherChannelCache.set(discord_channel_id, other);
			return other;
		});
}

export interface MessagePortal {
	srcDiscordUserId: DiscordSnowflake;
	srcDiscordChannelId: DiscordSnowflake;
	srcChannelRole: ChannelRole,

	dstDiscordUserId: DiscordSnowflake;
	dstDiscordChannelId: DiscordSnowflake;
	dstChannelRole: ChannelRole,
}
