import {
	bold,
	codeBlock,
	Guild,
	inlineCode,
	italic,
	Message,
	TextChannel,
	User,
} from 'discord.js';
import addressCommand from '../commands/address';
import leaveCommand from '../commands/leave';
import wishlistCommand from '../commands/profile';
import { showCommandUsage } from '../utils/showCommandUsage';
import { resolvedConfig } from '../app';
import { firstBotName } from '../utils/firstBotName';
import { brjoin, heading, p, passage } from '../utils/text';
import { create } from 'domain';

export function sendWelcomeMessage(
	guild: Guild,
	channel: TextChannel,
	user: User
): Promise<Message<true>> {
	const welcome = passage(
		heading(`Welcome to the ${guild.name} Secret Santa exchange!`),
		p(
			'I will let you know when names are drawn!',
			'Before names are drawn, you need to set your profile and your address.',
			'If you do not set your profile and address, you will not be selected for the exchange.',
			`Don't worry about being too specific, or too vague.`,
			`You and your Secret Santa can chat once you're matched.`
		)
	);
	const createYourProfile = passage(
		heading(`1. Create Your Profile`),
		p(
			`Before we can match you to another participant, you need to submit your profile.`,
			`Your profile will be provided to your Secret Santa so they can send you a gift you'll like.`
		),
		brjoin(
			italic(`To set your profile, reply to me...`),
			codeBlock(showCommandUsage(wishlistCommand)),
			italic(`For example, to set your profile, you could reply...`),
			codeBlock(
				[
					`${firstBotName()}${resolvedConfig.prefix}`,
					wishlistCommand.name,
					`I really like motorcycles, techno, and cooking.`,
					`My favorite TV Show is Breaking Bad.`,
					`My favorite food is Coconut Curry.`,
					`I have one dog, named Ratchet, and one cat, named Clank.`,
					`I like tinkering with electronics.`,
				].join(' ')
			)
		)
	);
	const setYourAddress = passage(
		heading('2. Set Your Address'),
		p(
			`You need to provide a shipping address to participate in Secret Santa.`,
			'If you provide your physical address, your Santa will see the complete address.',
			'Use a work address or a public mailbox if you do not want your real address to be shared.',
			`Please make sure your address contains your country.`,
			`Due to pandemic embargoes, some countries are not accepting mail from other countries.`
		),
		brjoin(
			italic('To set your address, reply to me...'),
			codeBlock(showCommandUsage(addressCommand)),
			italic('For example, to set your address, you could reply...'),
			codeBlock(
				[
					`${firstBotName()}${resolvedConfig.prefix}`,
					addressCommand.name,
					[
						user.username,
						`1600 Pensylvania Avenue, N.W.`,
						`Washington, DC 20500`,
						`USA`,
					].join('; '),
				].join(' ')
			)
		)
	);
	const toLeave = passage(
		heading('Leaving/Quitting The Exchange'),
		p(
			`You can leave the exchange if you joined by accident, or if you are unable to participate.`,
			`You must withdraw from the exchange before names are drawn.`,
			`If you need to leave the Secret Santa exchange *after* names are drawn, please contact a moderator or administrator of ${bold(
				guild.name
			)}.`
		),
		brjoin(
			italic(`To leave the exchange, reply...`),
			codeBlock(showCommandUsage(leaveCommand))
		)
	);

	return channel
		.send(welcome)
		.then((welcomeMessage) => welcomeMessage.reply(createYourProfile))
		.then((createProfileMsg) => createProfileMsg.reply(setYourAddress))
		.then((setAddressMsg) => setAddressMsg.reply(toLeave));
}
