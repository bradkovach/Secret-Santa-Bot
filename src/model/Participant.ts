import { DatabaseManager } from './database';
import { ParticipantRow } from './participants.table';
import { Match } from './Match';
import { Channel } from './Channel';
import { Exchange } from './Exchange';

export class Participant<IsCached extends boolean = false>
	implements ParticipantRow
{
	static fromExchangeIdAndDiscordUserId(
		exchange_id: bigint,
		discord_user_id: string
	): Promise<Participant> {
		return DatabaseManager.getInstance()
			.selectFrom('participants')
			.where('exchange_id', '=', exchange_id)
			.where('discord_user_id', '=', discord_user_id)
			.selectAll()
			.executeTakeFirstOrThrow()
			.then((fields) => new Participant(fields));
	}

	static fromParticipantId(
		participant_id: bigint
	): Promise<Participant<false>> {
		return DatabaseManager.getInstance()
			.selectFrom('participants')
			.where('participant_id', '=', participant_id)
			.selectAll()
			.executeTakeFirstOrThrow()
			.then(
				(fields) => Participant.fromFields(fields) as Participant<false>
			);
	}

	private _channels?: Channel<true>[];

	getChannels(force?: true): Promise<Channel<false>[]>;
	getChannels(force: boolean = false): Promise<Channel[]> {
		if (!force && this._channels) {
			return Promise.resolve(this._channels);
		}
		return DatabaseManager.getInstance()
			.selectFrom('channels')
			.where('participant_id', '=', this.fields.participant_id)
			.selectAll()
			.execute()
			.then((channels) =>
				channels.map((fields) => Channel.fromFields(fields))
			)
			.then((channels) => {
				this._channels = channels.map((c) => c.asCached());
				return channels;
			});
	}

	private _exchange?: Exchange<true>;

	getExchange(force?: true): Promise<Exchange<false>>;
	getExchange(force: boolean = false): Promise<Exchange> {
		if (!force && this._exchange) {
			return Promise.resolve(this._exchange);
		}

		if (this.fields.exchange_id) {
			return Exchange.fromExchangeId(this.fields.exchange_id).then(
				(exchange) => {
					this._exchange = exchange.asCached();
					return exchange;
				}
			);
		}

		return Promise.reject(`Unable to get exchange.`);
	}

	getMatchAsGiftee(): Promise<Match> {
		return Match.fromGifteeParticipantId(this.participant_id);
	}

	getMatchesAsSanta(): Promise<Match[]> {
		return Match.allFromSantaParticipantId(this.participant_id);
	}

	/**
	 * For lots of reasons, one santa can have many giftees
	 */
	private _giftees?: Participant<true>[];

	getGiftees(force?: true): Promise<Participant<false>[]>;
	getGiftees(force: boolean = false): Promise<Participant[]> {
		if (!force && this._giftees) {
			return Promise.resolve(this._giftees);
		}

		return Match.allFromSantaParticipantId(this.fields.participant_id)
			.then((matches) => {
				return Promise.all(
					matches.map((match) => match.getGifteeParticipant())
				);
			})
			.then((gifteeParticipants) => {
				this._giftees = gifteeParticipants.map((m) => m.asCached());
				return gifteeParticipants;
			});
	}

	private _santa?: Participant<true>;

	getSanta(force?: true): Promise<Participant<false>>;
	getSanta(force: boolean = false): Promise<Participant> {
		if (!force && this._santa) {
			return Promise.resolve(this._santa);
		}
		return Match.fromGifteeParticipantId(this.fields.participant_id)
			.then((match) => match.getSantaParticipant())
			.then((santa) => {
				this._santa = santa.asCached();
				return santa;
			});
	}

	private _isCached: boolean = false;

	isCached(): this is Participant<true> {
		return this._isCached;
	}

	asCached(): Participant<true> {
		this._isCached = true;
		return this as unknown as Participant<true>;
	}

	get participant_id(): bigint {
		return this.fields.participant_id;
	}

	get exchange_id(): bigint {
		return this.fields.exchange_id;
	}

	get discord_user_id(): string {
		return this.fields.discord_user_id;
	}

	get wishlist(): string {
		return this.fields.wishlist;
	}

	get address(): string {
		return this.fields.address;
	}

	get iso_country_code(): string {
		return this.fields.iso_country_code;
	}

	static fromFields = (fields: ParticipantRow) => new Participant(fields);

	private constructor(private readonly fields: ParticipantRow) {}
}
