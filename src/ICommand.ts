import { Message } from "discord.js";

export interface ICommand {
	name: string;
	aliases: string[];
	description: string;
	hasArgs: boolean;
	requirePartner: boolean;
	worksInDM: boolean;
	forceDMsOnly: boolean;
	modOnly: boolean;
	adminOnly: boolean;

	execute(message: Message, args: string[], prefix: string): Promise<any>;
}
