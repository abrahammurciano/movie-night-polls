/**
 * Decentralized event log backed by a Yjs Y.Array.
 *
 * Each peer appends PollEvent objects locally; Yjs CRDTs guarantee
 * eventual consistency across all connected peers.
 *
 * Trystero is used as the transport layer to sync Yjs updates.
 */

import * as Y from 'yjs';
import type { Room } from 'trystero';
import type { PollEvent, PollState, Phase } from '@/types';
import { runInstantRunoff } from '@/lib/voting';

const DOC_KEY = 'events';

export interface EventLog {
	doc: Y.Doc;
	append: (event: PollEvent) => void;
	getEvents: () => PollEvent[];
	subscribe: (cb: (state: PollState) => void) => () => void;
	connectRoom: (room: Room) => void;
}

export function createEventLog(persistKey?: string): EventLog {
	const doc = new Y.Doc();
	const events = doc.getArray<PollEvent>(DOC_KEY);

	if (persistKey) {
		const stored = localStorage.getItem(persistKey);
		if (stored) {
			try {
				Y.applyUpdate(doc, Uint8Array.from(atob(stored), (c) => c.charCodeAt(0)));
			} catch { /* ignore corrupt data */ }
		}
		doc.on('update', () => {
			const state = Y.encodeStateAsUpdate(doc);
			localStorage.setItem(persistKey, btoa(Array.from(state, (b) => String.fromCharCode(b)).join('')));
		});
	}

	function append(event: PollEvent) {
		doc.transact(() => {
			events.push([event]);
		});
	}

	function getEvents(): PollEvent[] {
		return events.toArray();
	}

	function computeState(): PollState {
		const state: PollState = {
			phase: 'nominations' as Phase,
			hostId: null,
			settings: null,
			peers: {},
			movies: [],
			ballots: {},
			winner: [],
			finalTally: new Map(),
			eliminatedVotes: new Map(),
		};

		for (const event of events.toArray()) {
			switch (event.type) {
				case 'poll_created':
					if (state.hostId === null) {
						state.hostId = event.peerId;
						state.settings = event.settings;
					}
					break;
				case 'peer_joined':
					state.peers[event.peerId] = { name: event.name };
					break;
				case 'nomination':
					if (state.phase === 'nominations') {
						const maxNominations = state.settings?.maxNominationsPerUser ?? 1;
						const userNominationCount = state.movies.filter((m) => m.nominatedBy.includes(event.peerId)).length;
						if (userNominationCount < maxNominations) {
							const existing = event.movie.tmdbId !== undefined
								? state.movies.find((m) => m.tmdbId === event.movie.tmdbId)
								: undefined;
							if (existing) {
								if (!existing.nominatedBy.includes(event.peerId))
									existing.nominatedBy = [...existing.nominatedBy, event.peerId];
							} else {
								state.movies.push({ ...event.movie, nominatedBy: [event.peerId] });
							}
						}
					}
					break;
				case 'phase_advanced':
					if (event.peerId === state.hostId) {
						if (state.phase === 'nominations') state.phase = 'voting';
						else if (state.phase === 'voting') {
							state.phase = 'results';
							const result = runInstantRunoff(state.ballots, state.movies);
							state.winner = result.winners;
							state.finalTally = result.finalTally; state.eliminatedVotes = result.eliminatedVotes;
						}
					}
					break;
				case 'ballot':
					if (state.phase === 'voting')
						state.ballots[event.peerId] = event.ranking;
					break;
			}
		}

		return state;
	}

	function subscribe(cb: (state: PollState) => void): () => void {
		const handler = () => cb(computeState());
		events.observe(handler);
		return () => events.unobserve(handler);
	}

	function connectRoom(room: Room) {
		const action = room.makeAction<Uint8Array>('yjsUpdate');

		// Send full state to newly connected peers
		room.onPeerJoin = () => {
			void action.send(Y.encodeStateAsUpdate(doc));
		};

		// Broadcast full state on every local update.
		// Full state (not just the delta) ensures peers with a stale state vector
		// can always apply the update without missing prior operations.
		doc.on('update', (_delta: Uint8Array, origin: unknown) => {
			if (origin !== 'remote') {
				void action.send(Y.encodeStateAsUpdate(doc));
			}
		});

		// Apply incoming state snapshots
		action.onMessage = (snapshot) => {
			Y.applyUpdate(doc, snapshot, 'remote');
		};
	}

	return { doc, append, getEvents, subscribe, connectRoom };
}
