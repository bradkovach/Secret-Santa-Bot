import { Collection, EmbedBuilder, Guild, Message } from 'discord.js';
import type { ICommand } from '../ICommand';

import { commands } from '../app';
import { getChannel } from '../channel/getChannel';
import { ParticipantState } from '../ParticipantState';
import { DatabaseManager } from '../model/database';
import { firstBotName } from '../utils/firstBotName';
import { ParticipantRow } from '../model/participants.table';

type Predicate<ItemType, KeyType extends string = string> = (
	cmd: ItemType,
	key: KeyType,
	all: Collection<KeyType, ItemType>
) => boolean;

export type WithRequiredKey<T, K extends keyof T> = T &
	Required<Pick<T, K>>;

function applyPredicatesToCollection<ItemType>(
	collection: Collection<string, ItemType>
): (predicates: Predicate<ItemType>[]) => Collection<string, ItemType> {
	return (predicates: Predicate<ItemType>[]) =>
		predicates.reduce(
			(cmds, predicate) => cmds.filter(predicate),
			collection
		);
}

function hasMinimumState(cmd: ICommand): boolean {
	return cmd.allowAfter !== undefined;
}

function hasMaximumState(cmd: ICommand): boolean {
	return cmd.allowBefore !== undefined;
}

function allowOwner(cmd: ICommand): boolean {
	return cmd.allowOwner;
}

function allowAdmin(cmd: ICommand): boolean {
	return cmd.allowAdmin;
}

function returnTrue<ItemType>(cmd: ItemType): boolean {
	return true;
}

function hasAllowAfter(
	cmd: ICommand
): cmd is WithRequiredKey<ICommand, 'allowAdmin'> {
	return typeof cmd.allowAfter !== 'undefined';
}

function negate<ItemType, KeyType extends string = string>(
	predicate: Predicate<ItemType, KeyType>
): Predicate<ItemType, KeyType> {
	return (
		item: ItemType,
		key: KeyType,
		all: Collection<KeyType, ItemType>
	) => !predicate(item, key, all);
}

const gt =
	(minStateExclusive: ParticipantState): Predicate<ICommand> =>
	(cmd) =>
		cmd.allowAfter !== undefined && minStateExclusive < cmd.allowAfter;

const gte =
	(minStateInclusive: ParticipantState): Predicate<ICommand> =>
	(cmd) =>
		cmd.allowAfter !== undefined && minStateInclusive <= cmd.allowAfter;

const before =
	(maxStateExclusive: ParticipantState): Predicate<ICommand> =>
	(cmd) =>
		cmd.allowBefore !== undefined && cmd.allowBefore < maxStateExclusive;
const lt = before;

const through =
	(maxStateInclusive: ParticipantState): Predicate<ICommand> =>
	(cmd) =>
		cmd.allowBefore !== undefined && cmd.allowBefore <= maxStateInclusive;
const lte = through;

function or<ItemType, KeyType extends string = string>(
	...predicates: Predicate<ItemType, KeyType>[]
): Predicate<ItemType, KeyType> {
	return (
		command: ItemType,
		key: KeyType,
		all: Collection<KeyType, ItemType>
	) => predicates.some((predicate) => predicate(command, key, all));
}

function and<ItemType, KeyType extends string = string>(
	...predicates: Predicate<ItemType, KeyType>[]
): Predicate<ItemType, KeyType> {
	return (
		command: ItemType,
		key: KeyType,
		all: Collection<KeyType, ItemType>
	) => predicates.every((predicate) => predicate(command, key, all));
}

const command: ICommand = {
	name: 'help',
	usage: 'help',
	description: 'Shows all bot commands.',

	allowOwner: false,
	allowAdmin: false,
	showInHelp: true,
	respondInChannelTypes: [],

	async execute(
		guild: Guild,
		message: Message,
		subcommand: string,
		participant: ParticipantRow
	) {
		const commandToField = (command: ICommand) => ({
			value: command.description,
			name: `\`${firstBotName()}! ${command.usage}\``,
		});
		if (subcommand == '') {
			const embeds: EmbedBuilder[] = [
				new EmbedBuilder()
					.setDescription(`These commands can be used anywhere.`)
					.setFields(
						commands
							.filter((cmd) => cmd.showInHelp)
							.filter((cmd) => cmd.respondInChannelTypes.length === 0)
							.mapValues(commandToField)
							.toJSON()
					),
			];

			if (!message.member) {
				return;
			}

			if (!message.channel) {
				return;
			}

			const knownChannel = await getChannel(message.channelId);

			//let participantState = ParticipantState.NOT_JOINED;

			if (knownChannel) {
				const participantAsSanta = await DatabaseManager.getInstance()
					.selectFrom('participants')
					.where('participant_id', '=', knownChannel.participant_id)
					.selectAll()
					.executeTakeFirst();

				// participantState = ParticipantState.JOINED;

				// if (participantAsSanta) {
				// 	if (participantAsSanta.giftee_participant_id) {
				// 		participantState += ParticipantState.MATCHED;
				// 	}
				// 	const gifteeTrackingInfo = await DatabaseManager.getInstance()
				// 		.selectFrom('participants')
				// 		.where(
				// 			'giftee_participant_id',
				// 			'=',
				// 			knownChannel.participant_id
				// 		)
				// 		.select([
				// 			'participant_id as santa_participant_id',
				// 			'tracking_number',
				// 			'received',
				// 		])
				// 		.executeTakeFirst();

				// 	if (gifteeTrackingInfo) {
				// 		if (gifteeTrackingInfo.tracking_number !== '') {
				// 			participantState += ParticipantState.SHIPPED_BY_SANTA;
				// 		}
				// 		if (gifteeTrackingInfo.received) {
				// 			participantState += ParticipantState.RECIEVED;
				// 		}
				// 	}
				// }

				function named(name: string) {
					return (command: ICommand) => command.name === name;
				}

				embeds.push(
					new EmbedBuilder()
						.setDescription(
							`You can use these commands before you are matched to another participant in the exchange.`
						)
						.setFields(
							applyPredicatesToCollection(commands)([
								hasAllowAfter,
								or(named('leave')),
							])
								.mapValues(commandToField)
								.toJSON()
						)
				);

				function labeledDebug(label: string) {
					return function <T>(subject: T, idx: number, all: T[]): T {
						console.debug(label, subject);
						return subject;
					};
				}

				embeds.push(
					new EmbedBuilder()
						.setDescription(
							`You can use these commands at any time during the exchange.`
						)
						.setFields(
							applyPredicatesToCollection(commands)([
								hasAllowAfter,
								or(named('match'), named('status'), named('shipments')),
							]).map(commandToField)
						)
				);

				embeds.push(
					new EmbedBuilder()
						.setDescription(
							`You can use these commands to ship a gift to your giftee.`
						)
						.setFields(
							applyPredicatesToCollection(commands)([
								or(
									named('profile'),
									named('address'),
									named('match'),
									named('shipped')
								),
							]).map(commandToField)
						)
				);

				embeds.push(
					new EmbedBuilder()
						.setDescription(
							`You can use these commands after your Santa has shipped your gift.`
						)
						.setFields(
							applyPredicatesToCollection(commands)([named('received')])
								.mapValues(commandToField)
								.toJSON()
						)
				);
			} else {
			}

			return message.reply({
				content: `Here are the commands I can understand.`,
				embeds: embeds,
			});
		} else if (commands.has(subcommand)) {
			const cmd = commands.get(subcommand)!;
			return message.reply({
				content: `Here is some help with the \`${cmd.name}\` command.`,
				embeds: [new EmbedBuilder().addFields([cmd].map(commandToField))],
			});
		}
	},
};

export default command;
