import { DatabaseManager } from './database';
import { NewShipmentRow, ShipmentRow } from './shipments.table';

export class Shipment<IsCached extends boolean = false>
	implements ShipmentRow
{
	get shipment_id() {
		return this.fields.shipment_id;
	}

	get match_id() {
		return this.fields.match_id;
	}

	get tracking_number() {
		return this.fields.tracking_number;
	}

	get received() {
		return this.fields.received;
	}

	get created() {
		return this.fields.created;
	}

	get updated() {
		return this.fields.updated;
	}

	private _isCached: boolean = false;

	isCached(): this is Shipment<true> {
		return this._isCached;
	}

	asCached(): Shipment<true> {
		this._isCached = true;
		return this;
	}

	setReceived(received: boolean): this {
		this.fields.received = received;
		return this;
	}

	setTrackingNumber(tracking_number: string): this {
		this.fields.tracking_number = tracking_number;
		return this;
	}

	static fromShipmentId(shipment_id: bigint): Promise<Shipment<false>> {
		return DatabaseManager.getInstance()
			.selectFrom('shipments')
			.where('shipment_id', '=', shipment_id)
			.selectAll()
			.executeTakeFirstOrThrow()
			.then(Shipment.fromFields);
	}

	static fromTrackingNumber(
		tracking_number: string
	): Promise<Shipment<false>> {
		return DatabaseManager.getInstance()
			.selectFrom('shipments')
			.where('tracking_number', '=', tracking_number)
			.selectAll()
			.executeTakeFirstOrThrow()
			.then(Shipment.fromFields);
	}

	static fromFields(fields: ShipmentRow): Shipment {
		return new Shipment(fields);
	}

	constructor(private fields: ShipmentRow) {}
}
