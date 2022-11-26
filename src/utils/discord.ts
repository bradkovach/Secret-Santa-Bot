import { Message } from 'discord.js';
import { User } from 'discord.js';

type FnUserToString = (user: User) => string;
type FnMessageToString = (message: Message) => string;

export const logUser: FnUserToString = (user: User) =>
	`${user.tag} (${user.id})`;

export const logMessage: FnMessageToString = (message: Message) =>
	`(${message.id})`;
