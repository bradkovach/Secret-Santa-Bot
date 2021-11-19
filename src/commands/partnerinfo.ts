import { MessageEmbed } from 'discord.js';
import { Message } from 'discord.js';
import { ICommand } from '../ICommand';
import { query } from '../mysql';
import { UserRow } from '../rows/UserRow';

const Discord = require('discord.js');
const config = require('../config.json');
const methods = require('../utils/methods');

const command: ICommand = {
	name: 'partnerinfo',
	aliases: ['status'],
	usage: 'partnerinfo',
	description: 'View information about your your giftee/partner.',
	hasArgs: false,
	requirePartner: true,
	worksInDM: true,
	forceDMsOnly: true,
	modOnly: false,
	adminOnly: false,

	async execute(message: Message, args: string[], prefix: string) {
		const row = (
			await query<UserRow[]>(
				`SELECT * FROM users WHERE userId = ${message.author.id}`
			)
		)[0];
		const partnerRow = (
			await query<UserRow[]>(
				`SELECT * FROM users WHERE userId = ${row.partnerId}`
			)
		)[0];
		const wishList = partnerRow.wishlist || 'No preferences.';
		const address = partnerRow.address || 'No address.';

		const partnerEmbed = new MessageEmbed()
			.setTitle('__Partner Information__')
			.addField('You are Secret Santa for...', '<@' + row.partnerId + '>')
			.addField('Profile', wishList)
			.addField('Address', address)
			.setColor(config.embeds_color)
			.setFooter('Need more info? Message them with the message command!');

		message.channel.send(partnerEmbed);
	},
};

export default command;
