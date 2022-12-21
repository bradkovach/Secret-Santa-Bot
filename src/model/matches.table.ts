import { Generated } from 'kysely';

export interface DbMatchRow {
	match_id: Generated<bigint>;
	santa_participant_id: bigint;
	giftee_participant_id: bigint;
}

export type NewMatchRow = Omit<DbMatchRow, 'match_id'>;

export type MatchRow = NewMatchRow & { match_id: bigint };
