const { query } = require('../mysql');

export async function addNewExchange(exchangeId: any, creatorId: any) {
	await query(
		`INSERT IGNORE INTO exchange (
        exchangeId,
        creatorId,
        started,
        description) VALUES (
            ?, ?, 0,''
        )
    `,
		[exchangeId, creatorId]
	);
}
