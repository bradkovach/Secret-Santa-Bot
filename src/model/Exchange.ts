import { Participant } from './Participant';
import { DatabaseManager } from './database';
import { ExchangeRow } from './exchange.table';
import { DiscordSnowflake } from './participants.table';

export class Exchange<IsCached extends boolean = true>
	implements ExchangeRow
{
	private _isCached: boolean = false;

	isCached(): this is Exchange<true> {
		return this._isCached;
	}

	asCached(): Exchange<true> {
		this._isCached = true;
		return this as Exchange<true>;
	}

	static fromExchangeId(exchange_id: bigint): Promise<Exchange> {
		return DatabaseManager.getInstance()
			.selectFrom('exchanges')
			.where('exchange_id', '=', exchange_id)
			.selectAll()
			.executeTakeFirstOrThrow()
			.then((e) => {
				return new Exchange(e);
			});
	}

	static fromDiscordMessageId(
		discord_message_id: DiscordSnowflake
	): Promise<Exchange<false>> {
		return DatabaseManager.getInstance()
			.selectFrom('exchanges')
			.where('discord_message_id', '=', discord_message_id)
			.selectAll()
			.executeTakeFirstOrThrow()
			.then((e) => new Exchange(e) as Exchange<false>);
	}

	private _participants?: Participant[];

	getParticipants(): Promise<Participant<false>[]> {
		return DatabaseManager.getInstance()
			.selectFrom('participants')
			.where('exchange_id', '=', this.fields.exchange_id)
			.selectAll()
			.execute()
			.then((participants) => {
				this._participants = participants.map((p) =>
					Participant.fromFields(p)
				);
				return this._participants;
			});
	}

	get exchange_id(): bigint {
		return this.fields.exchange_id;
	}
	get description(): string {
		return this.fields.description;
	}
	get discord_message_id(): DiscordSnowflake {
		return this.fields.discord_message_id;
	}
	get discord_owner_user_id(): DiscordSnowflake {
		return this.fields.discord_owner_user_id;
	}
	get started(): boolean {
		return this.fields.started;
	}

	static fromFields = (fields: ExchangeRow) => new Exchange(fields);

	private constructor(private readonly fields: ExchangeRow) {}
}
