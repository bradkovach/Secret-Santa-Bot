import { isDataView } from 'util/types';
import { db, query } from '../mysql';

import axios from 'axios';

const https = require('https');

(async function () {
	function buildRecordForAddress(address: string, idx: any) {
		return {
			RecordID: idx.toString(),
			// "Organization": "",
			AddressLine1: address,
			// "AddressLine2": "",
			// "AddressLine3": "",
			// "AddressLine4": "",
			// "AddressLine5": "",
			// "AddressLine6": "",
			// "AddressLine7": "",
			// "AddressLine8": "",
			// "DoubleDependentLocality": "",
			// "DependentLocality": "",
			// "Locality": "",
			// "SubAdministrativeArea": "",
			// "AdministrativeArea": "",
			// "PostalCode": "",
			// "SubNationalArea": "",
			// "Country": ""
		};
	}

	console.log(`getting addresses from db`);
	let addressRows = await query<
		{ userId: String; address: string; iso_country_code: string }[]
	>(
		`SELECT userId, address, iso_country_code FROM users WHERE address <> '' AND standardized_address = ''`
	);

	let globalAddressRequest = {
		TransmissionReference: `secret-santa-${Date.now()}`,
		CustomerID: '',
		Options: 'LineSeparator:LF',
		Records: addressRows.map((row) =>
			buildRecordForAddress(row.address, row.userId)
		),
	};

	let batchId = Date.now(),
		// key = 'W2PoEDrdvNKwH0QV9pWHzZ**';
		key = 'Ney4LsmNQgN1j8gqMX-QeH**nSAcwXpxhQ0PC2lXxuDAZ-**';

	let promises = addressRows.map((addressRow: any, idx: number) => {
		return axios
			.get(
				`https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress`,
				{
					params: {
						t: `secret-santa--${batchId}--${addressRow.userId}--${idx}`,
						id: key,
						opt: 'LineSeparator:LF',
						a1: addressRow.address,
						format: 'JSON',
						//ctry: addressRow.iso_country_code
					},
				}
			)
			.then(
				(success) => {
					console.log(`${addressRow.address}`);
					const { data } = success;
					// console.log('=> ', {req: success.request});

					if (data.TotalRecords === '0') {
						console.log('=> Unable to validate', { data });
						return Promise.reject();
					} else {
						console.log(
							'\t [update] => ',
							data.Records[0].FormattedAddress
						);
						return query<never>(
							`UPDATE users SET standardized_address = ?, iso_country_code = ? WHERE userId = ?`,
							[
								data.Records[0].FormattedAddress,
								data.Records[0].CountryISO3166_1_Alpha3,
								addressRow.userId,
							]
						);
					}
				},
				(error) => {
					console.log(
						`Unable to validate ${addressRow.address} for user ${addressRow.userId}.`,
						{ error }
					);
				}
			);
	});

	Promise.all(promises).then(
		(allSuccess) => {
			console.log('all records processed');
			// db.end();
		},
		(anyError) => console.error('an error may have occurred', anyError)
	);
})();
