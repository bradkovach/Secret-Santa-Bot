import { Message } from "discord.js";
import { ICommand } from "../ICommand";
import { query } from "../mysql";
import { ExchangeRow } from "../rows/ExchangeRow";
import { UserRow } from "../rows/UserRow";

import config from '../config.json';

// Commands
import setwishlist from './setwishlist';
import address from './address';
import shipped from './shipped';
import received from './received';

const command:ICommand = {
    name: "remind",
    aliases: [],
    description: "Sends reminders to participants.",
    usage: "remind",
    hasArgs: false,
    requirePartner: false,
    worksInDM: true,
    forceDMsOnly: true,
    modOnly: false,
    adminOnly: true,
    async execute (message: Message, args: string[], prefix: string){
        const user = message.author;
        const exchangeRow = (await query<ExchangeRow[]>(`SELECT * FROM exchange WHERE creatorId = ${user.id}`))[0];
        if(!exchangeRow) {
            console.log('unable to find exchange owned by creator');
        }

        const participantRows = (await query<UserRow[]>(`SELECT * FROM users WHERE exchangeId = ${exchangeRow.exchangeId}`));
        if( !participantRows ) return console.error('No participants to remind');

        participantRows.forEach(async participantRow => {
            let notificationUser = await message.client.users.fetch(participantRow.userId.toString());
            let giftRow = (await query<Pick<UserRow, "partnerId" | "tracking_number" | "received">[]>(
                `SELECT partnerId, tracking_number, received FROM users WHERE partnerId = ${participantRow.userId}`))[0];

            const santaTasks = [];
            const gifteeTasks = [];

            if( participantRow.wishlist.trim() === '' ) {
                santaTasks.push(`Complete your participant profile by DM'ing the bot with \`${config.prefix}${setwishlist.name} <profile info>\`.`)
            }

            if( participantRow.address.trim() === '' ) {
                santaTasks.push(`Provide your shipping address so your Secret Santa can send you your gift... \`${config.prefix}${address.name} <your complete address>\`.`)
            }

            if( participantRow.partnerId !== 0 ) {
                if( participantRow.tracking_number.trim() === '') {
                    santaTasks.push(`Let your giftee know you've sent their gift with \`${config.prefix}${shipped.name} <tracking number>\`.`)
                }
            } else {
                santaTasks.push(`You have not been assigned a giftee yet.  Keep an eye on your DM's for more info.`)
            }

            if( giftRow ) {
                if( giftRow.tracking_number.trim() !== '' && giftRow.received !== 1) {
                    gifteeTasks.push(`Let your santa know you received their gift with \`${config.prefix}${received.name}\`.`)
                }
            }


            let promises = [];
            if( santaTasks.length > 0 ) {
                console.log(`Sending santa reminder to ${notificationUser.username}.`)
                promises.push( notificationUser.send(`**Your Outstanding Santa Tasks**\n\n${santaTasks.map(task => `- ${task}`).join('\n')}`));
            }

            if(gifteeTasks.length > 0 ) {
                console.log(`Sending recipient reminder to ${notificationUser.username}.`)
                promises.push(notificationUser.send(`**Your Gift**\n\n${gifteeTasks.map(task => `- ${task}`).join('\n')}`))
            }

            await Promise.all(promises);

        })
    }
}

export default command;