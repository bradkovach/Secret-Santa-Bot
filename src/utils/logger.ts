import {
	Base,
	BaseGuildEmoji,
	Channel,
	ChannelType,
	Guild,
	GuildMember,
	Message,
	MessageReaction,
	TextChannel,
} from 'discord.js';
import winston from 'winston';
import { createLogger, format, transports } from 'winston';
import { printMember } from '../exchange/printMessage';
import { ChannelRole } from '../model/channels.table';
import { ExchangeRow } from '../model/exchange.table';
import { Match } from '../model/Match';
import { MatchRow } from '../model/matches.table';
import { ParticipantRow } from '../model/participants.table';
import { ShipmentRow } from '../model/shipments.table';
import { isGuildTextChannel } from './discord/isGuildTextChannel';
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
	return `[${timestamp}] ${level}: ${message}`;
});

const logger = winston.createLogger({
	format: combine(timestamp(), myFormat),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'logs/combined.log' }),
		new winston.transports.File({
			filename: 'logs/verbose.log',
			level: 'verbose',
		}),
	],
});

export const messageLogger = winston.createLogger({
	format: combine(timestamp(), myFormat),
	transports: [
		new winston.transports.File({ filename: 'logs/messages.log' }),
	],
});

export const audit = winston.createLogger({
	format: combine(timestamp(), myFormat),
	transports: [
		new winston.transports.File({ filename: 'logs/audit.log' }),
	],
});

// export const TaggedLogger = (tag: string = __filename) =>
// 	new Proxy(logger, {
// 		get<T extends winston.Logger = winston.Logger>(
// 			tgt: T,
// 			prop: keyof winston.Logger
// 		): any {
// 			if (
// 				Reflect.has(tgt, prop) &&
// 				typeof Reflect.get(tgt, prop) === 'function'
// 			) {
// 				return (...args: any[]) =>
// 					Reflect.get(tgt, prop)?.apply(null, [tag, ...args]);
// 			}

// 			return Reflect.get(tgt, prop);
// 		},
// 	});

interface DiscordObject extends Base {
	id: string;
	name: string;
	guild?: Guild;
	parent?: DiscordObject;
}

export function logJoin(
	exchange: ExchangeRow,
	participant: ParticipantRow,
	member: GuildMember
) {
	/*
		[join] [participant__member__displayName] joined exchange 1234 as participant 4321
	*/
	audit.info(
		[
			`[join]`,
			printMember(member),
			`joined Exchange ${exchange.exchange_id} as Participant ${participant.participant_id}.`,
		].join(' ')
	);
}

export function logLeave(
	exchange: ExchangeRow,
	participant: ParticipantRow,
	member: GuildMember
) {
	/*
		[leave] zombarista left exchange 1234 as participant 4321
	*/
	audit.info(
		[
			`[leave]`,
			printMember(member),
			`left Exchange ${exchange.exchange_id} as Participant ${participant.participant_id}.`,
		].join(' ')
	);
}

/**
 * a chat-gpt function to compare old value and new value
 * @param object1 anything
 * @param object2 anything
 * @returns strings of differences
 */
export function compareAndLog<T extends Object = any>(object1: T, object2: T): string[] {
	const differences: string[] = [];

	for (const key in object1) {
		if (key in object2) {
			if (object1[key] !== object2[key]) {
				differences.push(
					`[old value '${key}': ${object1[key]}] [new value '${key}': ${object2[key]}]`
				);
			}
		}
	}

	return differences;
}

export function logParticipantUpdate(
	member: GuildMember,
	oldParticipant: ParticipantRow,
	changes: Partial<ParticipantRow>
) {
	/*
		[participant update] [zombarista (1234123412341234)] updated 'profile'. [old value: "JSON OLD VALUE"] [new value "JSON NEW VALUE"]
	*/
	audit.info(
		[
			`[participant update]`,
			`${member.displayName} updated`,
			compareAndLog(oldParticipant, changes),
		].join(' ')
	);
}

const printExchange = (exchange: ExchangeRow) => {
	return [
		`[exchange ${exchange.exchange_id}${
			exchange.description ? ` '${exchange.description}'` : ''
		}]`,
	];
};

export function logMatch(
	exchange: ExchangeRow,
	match: MatchRow,
	santaMember: GuildMember,
	gifteeMember: GuildMember
) {
	/*
		[match] [santa_display_name (1234123412341234)] matched to [giftee_display_name (4321432143214321)] in [exchange 1234 'Whistleface']. [match {MATCH JSON OBJECT}]
	*/
	audit.info(
		[
			`[match]`,
			printMember(santaMember),
			`matched to`,
			printMember(gifteeMember),
			'in',
			printExchange(exchange),
			`[match ${JSON.stringify(match)}]`,
		].join(' ')
	);
}

export const printShipment = (shipment: ShipmentRow) => {
	return `[shipment: ${JSON.stringify(shipment)}]`;
};

export function logShipmentSent(
	santaMember: GuildMember,
	gifteeMember: GuildMember,
	shipment: ShipmentRow
) {
	/*
		[shipped] [santa__member__displayName (12341234123412341234)] shipped a gift to [giftee__member__displayName (43214321432143214321)]. [shipment: {SHIPMENT JSON OBJECT}]
	*/
	audit.info(
		[
			`[shipped]`,
			printMember(santaMember),
			`shipped a gift to`,
			printMember(gifteeMember),
			printShipment(shipment),
		].join(' ')
	);
}

export function logShipmentReceived(
	santaMember: GuildMember,
	gifteeMember: GuildMember,
	shipment: ShipmentRow
) {
	/*
		[received] [giftee__member__displayName (43214321432143214321)] received shipment ${shipment_id} from [santa__member__displayName (12341234123412341234)]. [shipment: {SHIPMENT JSON OBJECT}]
		[received] [DandelionQu33n (43214321432143214321)] received shipment 13 from [zombarista (12341234123412341234)] [shipment: {shipment_id: 13, tracking_number: "", received: true, created: 'yyyy-mm-dd hh:mm:ss', modified: 'yyyy-mm-dd hh:mm:ss'}]
	*/
	audit.info([
		`[received]`,
		printMember(gifteeMember),
		`received shipment ${shipment.shipment_id} from`,
		printMember(santaMember),
		`[shipment ${JSON.stringify(shipment)}]`,
	]);
}

export function logForwardedMessage(
	incomingChannelRole: ChannelRole,
	incomingMember: GuildMember,
	incomingChannel: TextChannel,

	outgoingChannelRole: ChannelRole,
	outgoingMember: GuildMember,
	outgoingChannel: TextChannel,

	content: string
) {
	/*
		[forward] santa zombarista => giftee dandelionqu33n "json string representation of message" [from #-zombarista-to-giftee 1234123412341234] [to $-dandelionqu33n-to-santa 4321432143214321] 
	*/
	audit.info(
		[
			`[forward]`,
			`${incomingChannelRole} ${incomingMember.displayName} => ${outgoingChannelRole} ${outgoingMember.displayName}`,
			JSON.stringify(content),
			`[from ${incomingChannel.name} ${incomingChannel.id}]`,
			`[to ${outgoingChannel.name} ${outgoingChannel.id}]`,
		].join(' ')
	);
}

export function logForwardedReaction(incomingReaction: MessageReaction) {}

export const logAndReturnChannel = (channel: Channel): Channel => {
	const logChunks: string[] = [`[created discord channel]`];

	if (!channel.isDMBased()) {
		logChunks.push(
			`[${ChannelType[channel.type]} '${channel.name}' ${channel.id}]`
		);
		if (channel.parent) {
			logChunks.push(
				`[parent ${ChannelType[channel.parent.type]} '${
					channel.parent.name
				}' ${channel.parent.id}]`
			);
		}
	} else {
		logChunks.push(`[type ${ChannelType[channel.type]} ${channel.id}]`);
	}

	return channel;
};

export const logAndReturnMessage = (
	message: Message,
	context?: string
): Message => {
	const messageChunks: string[] = [`[message]`];
	const client = message.client;

	if (context) {
		messageChunks.push(`[${context}]`);
	}

	messageChunks.push(JSON.stringify(message.content));

	if (message.member) {
		messageChunks.push(
			`[${
				message.member.id === client.user.id ? 'outgoing' : 'incoming'
			} from ${message.member.displayName} ${message.author.id}]`
		);
	}

	if (message.channel && !message.channel.isDMBased()) {
		messageChunks.push(
			`[to channel ${message.channel.name} ${message.channel.id}]`
		);
	}

	if (message.embeds.length > 0) {
		messageChunks.push(`[embeds: ${message.embeds.length}]`);
	}

	messageLogger.info(messageChunks.join(' '));

	return message;
};

export default logger;
