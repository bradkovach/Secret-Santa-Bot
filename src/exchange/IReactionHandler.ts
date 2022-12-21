import { MessageReaction, User } from 'discord.js';
import { Channel } from '../model/Channel';
import { Exchange } from '../model/Exchange';

export interface IReactionHandler {
	name: string;
	description: string;

	emoji?: string[];

	test?: (reaction: MessageReaction) => boolean;

	execute(
		reaction: MessageReaction,
		user: User,
		exchange?: Exchange,
		channel?: Channel
	): Promise<any>;
}
