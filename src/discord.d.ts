import { ICommand } from './ICommand';

declare module 'discord.js' {
	export interface Client {
		commands: Collection<unknown, ICommand>;
		commandsUsed: number;
		sets: { bannedUsers: Set<string>; adminUsers: Set<string> };
		fullLockdown: boolean;
	}
	export interface Command {
		name: string;
		description: string;
		execute: (message: Message, args: string[]) => Promise<any>;
	}
}
