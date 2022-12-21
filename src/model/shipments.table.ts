import { ColumnType, Generated } from 'kysely';

export type Bit = 0 | 1;

export interface DbShipmentRow {
	shipment_id: Generated<bigint>;
	match_id: bigint;
	tracking_number: string;
	received: boolean;
	created: ColumnType<Date, never, never>;
	updated: ColumnType<Date, never, never>;
}

export type NewShipmentRow = Omit<
	DbShipmentRow,
	'shipment_id' | 'created' | 'updated'
>;

export type ShipmentRow = NewShipmentRow & {
	shipment_id: bigint;
	created: Date;
	updated: Date;
};
