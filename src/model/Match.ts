import { Participant } from './Participant';
import { DatabaseManager } from './database';
import { MatchRow } from './matches.table';
import { Shipment } from './Shipment';
import { NewShipmentRow } from './shipments.table';

export class Match<IsCached extends boolean = false> implements MatchRow {
	static allFromSantaParticipantId(
		santa_participant_id: bigint
	): Promise<Match<false>[]> {
		return DatabaseManager.getInstance()
			.selectFrom('matches')
			.where('santa_participant_id', '=', santa_participant_id)
			.selectAll()
			.execute()
			.then((matches) =>
				matches.map((m) => Match.fromFields(m) as Match<false>)
			);
	}

	static fromGifteeParticipantId(
		giftee_participant_id: bigint
	): Promise<Match<false>> {
		return DatabaseManager.getInstance()
			.selectFrom('matches')
			.where('giftee_participant_id', '=', giftee_participant_id)
			.selectAll()
			.executeTakeFirstOrThrow()
			.then((fields) => new Match(fields) as Match<false>);
	}

	private _isCached: boolean = false;

	isCached(): this is Match<true> {
		return this._isCached;
	}

	asCached(): Match<true> {
		this._isCached = true;
		return this as Match<true>;
	}

	private _santa?: Participant<true>;

	getSantaParticipant(force?: true): Promise<Participant<false>>;
	getSantaParticipant(force: boolean = false): Promise<Participant> {
		if (!force && this._santa) {
			return Promise.resolve(this._santa);
		}

		return Participant.fromParticipantId(
			this.fields.santa_participant_id
		).then((santaParticipant) => {
			this._santa = santaParticipant.asCached();
			return santaParticipant as Participant<false>;
		});
	}

	private _giftee?: Participant<true>;

	getGifteeParticipant(force?: true): Promise<Participant<false>>;
	getGifteeParticipant(force: boolean = false): Promise<Participant> {
		if (!force && this._giftee) {
			return Promise.resolve(this._giftee);
		}

		return Participant.fromParticipantId(
			this.fields.giftee_participant_id
		).then((gifteeParticipant) => {
			this._giftee = gifteeParticipant.asCached();
			return gifteeParticipant;
		});
	}

	private _shipments?: Shipment<true>[];

	getShipments(force: boolean = false): Promise<Shipment[]> {
		if (!force && this._shipments) {
			return Promise.resolve(this._shipments);
		}
		return DatabaseManager.getInstance()
			.selectFrom('shipments')
			.where('match_id', '=', this.match_id)
			.selectAll()
			.execute()
			.then((shipmentRows) => {
				const shipments = shipmentRows.map(Shipment.fromFields);
				this._shipments = shipments.map((s) => s.asCached());
				return shipments;
			});
	}

	createShipment(tracking_number: string) {
		const newShipment: NewShipmentRow = {
			match_id: this.match_id,
			tracking_number,
			received: false,
		};
		return DatabaseManager.getInstance()
			.insertInto('shipments')
			.values(newShipment)
			.executeTakeFirstOrThrow()
			.then((insertResult) => {
				if (insertResult && insertResult.insertId) {
					return Shipment.fromShipmentId(insertResult.insertId);
				} else {
					return Promise.reject(
						'Unable to get inserted shipment_id for new shipment.'
					);
				}
			});
	}

	get match_id(): bigint {
		return this.fields.match_id;
	}

	get santa_participant_id(): bigint {
		return this.fields.giftee_participant_id;
	}

	get giftee_participant_id(): bigint {
		return this.fields.giftee_participant_id;
	}

	static fromFields = (fields: MatchRow): Match => new Match(fields);

	private constructor(private fields: MatchRow) {}
}
