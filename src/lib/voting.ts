/**
 * Instant-runoff voting (ranked-choice) implementation.
 *
 * Given a map of peerId → ordered movie-id rankings and the full movie list,
 * returns the winning movie, or null if no movies/ballots exist.
 */

import type { Movie } from '@/types';

export function runInstantRunoff(
	ballots: Record<string, string[]>,
	movies: Movie[],
): Movie | null {
	const validBallots = Object.values(ballots).filter((b) => b.length > 0);
	if (validBallots.length === 0 || movies.length === 0) return null;

	const remaining = new Set(movies.map((m) => m.id));

	while (remaining.size > 1) {
		// Count first-choice votes among still-active candidates
		const tally = new Map<string, number>();
		for (const id of remaining) tally.set(id, 0);

		for (const ballot of validBallots) {
			const top = ballot.find((id) => remaining.has(id));
			if (top) tally.set(top, (tally.get(top) ?? 0) + 1);
		}

		// Check for majority
		const total = validBallots.length;
		for (const [id, count] of tally) {
			if (count > total / 2) {
				return movies.find((m) => m.id === id) ?? null;
			}
		}

		// Eliminate candidate(s) with fewest votes
		const minVotes = Math.min(...tally.values());
		for (const [id, count] of tally) {
			if (count === minVotes) remaining.delete(id);
		}
	}

	const [winnerId] = remaining;
	return movies.find((m) => m.id === winnerId) ?? null;
}
