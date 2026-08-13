/**
 * usePoll – central hook that owns the Trystero room + Yjs event log.
 *
 * Returns the current derived PollState plus action dispatchers.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { joinRoom } from '@/lib/trystero';
import { selfId, storageKey } from '@/lib/identity';
import { createEventLog } from '@/lib/eventLog';
import type { PollState, Movie } from '@/types';
import type { MovieData } from '@/components/MovieSearch';

export function usePoll(pollCode: string, displayName: string, isHost: boolean) {
	const logRef = useRef(createEventLog(storageKey(`yjs.${pollCode}`)));
	const roomRef = useRef<ReturnType<typeof joinRoom> | null>(null);
	const [state, setState] = useState<PollState>({
		phase: 'nominations',
		hostId: null,
		settings: null,
		peers: {},
		movies: [],
		ballots: {},
		winner: null,
	});

	// Connect to room immediately when pollCode is set
	useEffect(() => {
		const log = logRef.current;
		const room = joinRoom(pollCode);
		roomRef.current = room;

		log.connectRoom(room);
		const unsubscribe = log.subscribe(setState);

		return () => {
			unsubscribe();
			room.leave();
			roomRef.current = null;
		};
	}, [pollCode]);

	// Announce ourselves; host also emits poll_created if this is a new poll
	useEffect(() => {
		if (!displayName) return;
		const log = logRef.current;
		if (isHost && !log.getEvents().some((e) => e.type === 'poll_created')) {
			log.append({ type: 'poll_created', peerId: selfId, settings: { hostId: selfId }, timestamp: Date.now() });
		}
		log.append({ type: 'peer_joined', peerId: selfId, name: displayName, timestamp: Date.now() });
	}, [displayName, isHost]);

	const nominateMovie = useCallback((movieData: MovieData) => {
		const movie: Movie = { ...movieData, nominatedBy: selfId };
		logRef.current.append({
			type: 'nomination',
			peerId: selfId,
			movie,
			timestamp: Date.now(),
		});
	}, []);

	const submitBallot = useCallback((ranking: string[]) => {
		logRef.current.append({
			type: 'ballot',
			peerId: selfId,
			ranking,
			timestamp: Date.now(),
		});
	}, []);

	const advancePhase = useCallback(() => {
		logRef.current.append({ type: 'phase_advanced', peerId: selfId, timestamp: Date.now() });
	}, []);

	return { state, selfId, nominateMovie, submitBallot, advancePhase };
}
