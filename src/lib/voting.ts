/**
 * Instant-runoff voting (ranked-choice) implementation with weighted tie-breaking.
 *
 * Given a map of peerId → ordered movie-id rankings and the full movie list,
 * returns winning movie(s) and final vote tally with primary/transferred breakdown.
 * When votes tie after weighing by ballot position, all tied candidates are returned as winners.
 */

import type { Movie } from '@/types';

export interface VoteTally {
	primary: number;
	transferred: number;
}

export interface VotingResult {
	winners: Movie[];
	finalTally: Map<string, VoteTally>;
	eliminatedVotes: Map<string, number>;
}

export function runInstantRunoff(
	ballots: Record<string, string[]>,
	movies: Movie[],
): VotingResult {
	const validBallots = Object.values(ballots).filter((b) => b.length > 0);
	if (validBallots.length === 0 || movies.length === 0) {
		return { winners: [], finalTally: new Map(), eliminatedVotes: new Map() };
	}

	const remaining = new Set(movies.map((m) => m.id));
	const eliminatedVotes = new Map<string, number>();
	let lastTally = new Map<string, number>();

	while (remaining.size > 1) {
		// Count first-choice votes among still-active candidates
		const tally = new Map<string, number>();
		for (const id of remaining) tally.set(id, 0);

		for (const ballot of validBallots) {
			const top = ballot.find((id) => remaining.has(id));
			if (top) tally.set(top, (tally.get(top) ?? 0) + 1);
		}

		lastTally = tally;

		// Check for majority
		const total = validBallots.length;
		for (const [id, count] of tally) {
			if (count > total / 2) {
				const movie = movies.find((m) => m.id === id);
				if (movie) {
					const finalTally = computeVoteBreakdown(validBallots, new Set([id]));
					return { winners: [movie], finalTally, eliminatedVotes };
				}
				return { winners: [], finalTally: new Map(), eliminatedVotes };
			}
		}

		// Find candidates with fewest votes
		const minVotes = Math.min(...tally.values());
		const toEliminate = new Set(
			Array.from(tally.entries())
				.filter(([, count]) => count === minVotes)
				.map(([id]) => id)
		);

		// If only one candidate to eliminate, do it
		if (toEliminate.size === 1) {
			const id = Array.from(toEliminate)[0];
			eliminatedVotes.set(id, tally.get(id) ?? 0);
			remaining.delete(id);
		} else {
			// Multiple tied for elimination - use weighted scoring to break tie
			const weights = getWeightedScores(validBallots, toEliminate);
			const minWeight = Math.min(...Array.from(weights.values()));
			const lowestWeighted = Array.from(weights.entries())
				.filter(([, w]) => w === minWeight)
				.map(([id]) => id);

			lowestWeighted.forEach((id) => {
				eliminatedVotes.set(id, tally.get(id) ?? 0);
				remaining.delete(id);
			});
		}
	}

	// Movies with zero votes in all rounds also count as eliminated with 0
	for (const movie of movies) {
		if (!remaining.has(movie.id) && !eliminatedVotes.has(movie.id)) {
			eliminatedVotes.set(movie.id, 0);
		}
	}

	const winners = Array.from(remaining)
		.map((id) => movies.find((m) => m.id === id)!)
		.filter((m) => m !== undefined);

	const finalTally = computeVoteBreakdown(validBallots, remaining);
	return { winners, finalTally, eliminatedVotes };
}

function computeVoteBreakdown(ballots: string[][], finalCandidates: Set<string>): Map<string, VoteTally> {
	const breakdown = new Map<string, VoteTally>();

	for (const id of finalCandidates) {
		breakdown.set(id, { primary: 0, transferred: 0 });
	}

	for (const ballot of ballots) {
		for (let rank = 0; rank < ballot.length; rank++) {
			const id = ballot[rank];
			if (finalCandidates.has(id)) {
				const tally = breakdown.get(id)!;
				if (rank === 0) {
					tally.primary += 1;
				} else {
					tally.transferred += 1;
				}
				break;
			}
		}
	}

	return breakdown;
}

function getWeightedScores(ballots: string[][], candidateIds: Set<string>): Map<string, number> {
	const scores = new Map<string, number>();

	for (const id of candidateIds) {
		scores.set(id, 0);
	}

	for (const ballot of ballots) {
		for (let rank = 0; rank < ballot.length; rank++) {
			const id = ballot[rank];
			if (candidateIds.has(id)) {
				const score = ballot.length - rank;
				scores.set(id, (scores.get(id) ?? 0) + score);
			}
		}
	}

	return scores;
}
