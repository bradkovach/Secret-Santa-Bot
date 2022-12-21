// prettier-ignore
export enum ParticipantState {
	NOT_JOINED 			= 0,
	JOINED 				= 1 << 0,
	HAS_GIFTEE 			= 1 << 1,
	HAS_SANTA 			= 1 << 2,
	SHIPPED_BY_SANTA 	= 1 << 3,
	RECIEVED 			= 1 << 4,
	SHIPPED_TO_GIFTEE 	= 1 << 5,
	RECEIVED_BY_GIFTEE 	= 1 << 6
}
