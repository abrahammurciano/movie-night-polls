import { describe, expect, it } from 'vitest';
import { createEventLog } from '@/lib/eventLog';
import type { Movie, PollState } from '@/types';

function movie(id: string, tmdbId: number): Movie {
	return { id, tmdbId, title: id, nominatedBy: [] };
}

function latestState(log: ReturnType<typeof createEventLog>): { get: () => PollState } {
	let state: PollState | undefined;
	log.subscribe((next) => {
		state = next;
	});
	return {
		get() {
			if (!state) throw new Error('state was not emitted');
			return state;
		},
	};
}

describe('createEventLog', () => {
	it('enforces nomination limits and merges duplicate TMDB nominations', () => {
		const log = createEventLog();
		const current = latestState(log);

		log.append({
			type: 'poll_created',
			peerId: 'host',
			settings: { hostId: 'host', maxNominationsPerUser: 2 },
			timestamp: 1,
		});
		log.append({ type: 'peer_joined', peerId: 'p1', name: 'P1', timestamp: 2 });
		log.append({ type: 'peer_joined', peerId: 'p2', name: 'P2', timestamp: 3 });
		log.append({ type: 'nomination', peerId: 'p1', movie: movie('m1', 1), timestamp: 4 });
		log.append({ type: 'nomination', peerId: 'p2', movie: movie('m2', 1), timestamp: 5 });
		log.append({ type: 'nomination', peerId: 'p1', movie: movie('m3', 2), timestamp: 6 });
		log.append({ type: 'nomination', peerId: 'p1', movie: movie('m4', 3), timestamp: 7 });

		const state = current.get();
		expect(state.movies).toHaveLength(2);
		expect(state.movies[0].tmdbId).toBe(1);
		expect(state.movies[0].nominatedBy.sort()).toEqual(['p1', 'p2']);
		expect(state.movies.map((entry) => entry.tmdbId)).not.toContain(3);
	});

	it('only lets the host advance phases and computes winner in results', () => {
		const log = createEventLog();
		const current = latestState(log);

		log.append({
			type: 'poll_created',
			peerId: 'host',
			settings: { hostId: 'host', maxNominationsPerUser: 2 },
			timestamp: 1,
		});
		log.append({ type: 'nomination', peerId: 'host', movie: movie('winner', 1), timestamp: 2 });
		log.append({ type: 'phase_advanced', peerId: 'intruder', timestamp: 3 });
		log.append({ type: 'ballot', peerId: 'p1', ranking: ['winner'], timestamp: 4 });

		expect(current.get().phase).toBe('nominations');
		expect(current.get().ballots).toEqual({});

		log.append({ type: 'phase_advanced', peerId: 'host', timestamp: 5 });
		log.append({ type: 'ballot', peerId: 'p1', ranking: ['winner'], timestamp: 6 });
		log.append({ type: 'phase_advanced', peerId: 'host', timestamp: 7 });

		const state = current.get();
		expect(state.phase).toBe('results');
		expect(state.ballots).toEqual({ p1: ['winner'] });
		expect(state.winner.map((entry) => entry.id)).toEqual(['winner']);
	});
});
