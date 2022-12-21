import { Participant } from './Participant';
import { ChannelRole, ChannelRow } from './channels.table';
import { DatabaseManager } from './database';

export class Channel<IsCached extends boolean = false>
	implements ChannelRow
{
	private _isCached: boolean = false;

	isCached(): this is Channel<true> {
		return this._isCached;
	}

	asCached(): Channel<true> {
		this._isCached = true;
		return this as Channel<true>;
	}
	static fromDiscordChannelId(
		discord_channel_id: string
	): Promise<Channel> {
		return DatabaseManager.getInstance()
			.selectFrom('channels')
			.where('discord_channel_id', '=', discord_channel_id)
			.selectAll()
			.executeTakeFirstOrThrow()
			.then((fields) => new Channel(fields) as Channel<false>);
	}

	static fromChannelId(channel_id: bigint): Promise<Channel> {
		return DatabaseManager.getInstance()
			.selectFrom('channels')
			.where('channel_id', '=', channel_id)
			.selectAll()
			.executeTakeFirstOrThrow()
			.then((fields) => new Channel(fields));
	}

	private _participant?: Participant<true>;

	getParticipant(force?: true): Promise<Participant<false>>;
	getParticipant(force: boolean = false): Promise<Participant> {
		if (!force && this._participant) {
			return Promise.resolve(this._participant);
		}

		if (this.fields.participant_id) {
			return Participant.fromParticipantId(
				this.fields.participant_id
			).then((participant) => {
				this._participant = participant.asCached();
				return participant;
			});
		}

		return Promise.reject(
			`Unable to find participant for channel ${this.fields.channel_id}`
		);
	}

	get channel_id(): bigint {
		return this.fields.channel_id;
	}

	get discord_channel_id(): string {
		return this.fields.discord_channel_id;
	}

	get participant_id(): bigint {
		return this.fields.participant_id;
	}

	get role(): ChannelRole {
		return this.fields.role;
	}

	static fromFields = (fields: ChannelRow) => new Channel(fields);

	private constructor(private fields: ChannelRow) {}
}
