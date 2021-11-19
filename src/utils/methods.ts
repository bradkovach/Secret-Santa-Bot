const Discord = require('discord.js');
const { query } = require('../mysql.js');
const config = require('../config.json');
const fs = require('fs');

export class Methods {
	async createNewUser(userId: string) {
		try {
			await query(
				`INSERT IGNORE INTO users 
				( userId, exchangeId, wishlist, partnerId ) 
				VALUES 
				( ?,      0,          '',       0         )
            `,
				[userId]
			);
			return true;
		} catch (err) {
			return false;
		}
	}
}
