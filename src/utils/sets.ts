const config = require('../config.json');

//contains all banned user ids
var bannedUsers: Set<string> = new Set();

// Admin IDs, add yourself to this in config.json
const adminUsers: Set<string> = new Set(config.adminUsers);

export const sets =  {
	bannedUsers,
	adminUsers,
};
