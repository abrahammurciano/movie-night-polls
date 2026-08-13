/**
 * Trystero room factory.
 *
 * Uses the Nostr relay strategy for signaling (peer discovery only).
 * All data flows directly peer-to-peer over WebRTC after connection.
 * Nostr announces immediately (no dormancy delay), making it ideal for
 * real-time use.
 */

import { joinRoom as trysteroJoinRoom } from 'trystero/nostr';
import type { Room, JoinRoomConfig } from 'trystero';

const APP_ID = 'movie-night-polls';

const RELIABLE_NOSTR_RELAYS = [
	'wss://nos.lol',
	'wss://relay.nostr.band',
	'wss://relay.primal.net',
];

export function joinRoom(pollCode: string): Room {
	return trysteroJoinRoom(
		{ appId: APP_ID, relayConfig: { urls: RELIABLE_NOSTR_RELAYS } } as JoinRoomConfig,
		pollCode,
	);
}
