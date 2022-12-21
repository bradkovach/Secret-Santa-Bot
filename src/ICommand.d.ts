import type { Message } from 'discord.js';
import { ParticipantState } from './ParticipantState';
import type { ChannelRole } from './model/channels.table';

export interface ICommand {
	name: string;
	description: string;
	usage: string;
	showInHelp: boolean;

	allowBefore?: ParticipantState;
	allowAfter?: ParticipantState;

	allowOwner: boolean; //
	allowAdmin: boolean; //
	respondInChannelTypes: ChannelRole[];

	protectInvocation?: boolean;

	execute(
		guild: Guild,
		message: Message,
		subcommand: string,
		metadata: any
	): Promise<any>;
}
