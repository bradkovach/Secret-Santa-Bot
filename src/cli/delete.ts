import util from 'util';
import { captureRejections } from 'events';
import { Database } from '../Database';
import { UserRow } from '../rows/UserRow';
import { Console } from 'console';

let args = process.argv;

console.log({ args });

const database = Database.getInstance();

database.with(async (conn) => {
	const pQuery = (query: string, args: any[]) =>
		new Promise((resolve, reject) => {
			conn.query(query, args, (error, result) => {
				if (error) {
					return reject(error);
				} else {
					return resolve(result);
				}
			});
		});

	let quitterRow = (
		(await pQuery(`SELECT * FROM users WHERE userId = ?`, [
			args[2],
		])) as unknown as UserRow[]
	)[0];
	let santaRow = (
		(await pQuery(`SELECT * FROM users WHERE partnerId = ?`, [
			args[2],
		])) as unknown as UserRow[]
	)[0];
	let gifteeId = quitterRow.partnerId;

	console.log('Run these commands in the database...');
	console.log(`DELETE FROM users WHERE userId = ${quitterRow.userId};`);
	console.log(
		`UPDATE users SET partnerId = ${gifteeId} WHERE userId = ${santaRow.userId};`
	);

	// pQuery(`DELETE FROM users WHERE userId = ?`, [quitterRow.userId])
	//     .then(deleted => {
	//         console.log(`Santa ${quitterRow.userId} removed from exchange.`)
	//         return pQuery(`UPDATE users SET partnerId = ? WHERE userId = ?`, [gifteeId, santaRow.userId])})
	//     .then(
	//         allSuccess => {
	//             console.log(`Giftee ${gifteeId} reassigned to ${santaRow.userId}`);
	//         },
	//         anyError => {
	//             console.log(`Error reassigning quitting santa...`, { anyError });
	//         }
	//     )
});
