/**
 * Instant-runoff voting (ranked-choice) implementation with weighted tie-breaking.
 *
 * Given a map of peerId → ordered movie-id rankings and the full movie list,
 * returns winning movie(s) and final vote tally with primary/transferred breakdown.
 * When votes tie after weighing by ballot position, all tied candidates are returned as winners.
 */

import type { Movie, VotingMethod } from '@/types';

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

export const VOTING_METHODS: Record<VotingMethod, { name: string; brief: string; details: string }> = {
	irv: {
		name: 'Instant runoff',
		brief: 'The movie with the fewest top picks is eliminated each round until one has a majority.',
		details:
			'Each ballot counts for its highest-ranked movie still in the running. ' +
			'If no movie has more than half the votes, the movie with the fewest votes is eliminated and its votes move to each voter’s next choice. ' +
			'This repeats until one movie has a majority.',
	},
	borda: {
		name: 'Borda count',
		brief: 'Movies earn points for every rank on every ballot; the highest total wins.',
		details:
			'With N movies, a movie earns N-1 points for each ballot that ranks it first, N-2 for second, and so on down to 0 for last. ' +
			'Unranked movies earn nothing on that ballot. The movie with the most points overall wins. ' +
			'This rewards movies that are broadly acceptable, not just strongly loved by a few.',
	},
	schulze: {
		name: 'Schulze',
		brief: 'Compares every pair of movies head-to-head and finds the one with the strongest paths of victories.',
		details:
			'Every pair of movies is compared head-to-head: the one ranked higher on more ballots beats the other. ' +
			'The Schulze method then finds the strongest path of victories between each pair — a direct win or a chain of wins — ' +
			'and the movie whose strongest path to every other movie is at least as strong as the path back wins. ' +
			'It always elects the head-to-head champion when one exists.',
	},
	'ranked-pairs': {
		name: 'Ranked pairs (Tideman)',
		brief: 'Locks in head-to-head victories from strongest to weakest, skipping any that would create a cycle.',
		details:
			'Every pair of movies is compared head-to-head. The victories are sorted from the largest margin to the smallest, ' +
			'and locked in one by one, skipping any victory that would contradict an already locked, stronger one by creating a cycle. ' +
			'The movie that ends up above all others in the locked ordering wins.',
	},
};

/** Decide the winner with the poll's chosen voting method. */
export function runVote(
	method: VotingMethod,
	ballots: Record<string, string[]>,
	movies: Movie[],
): VotingResult {
	switch (method) {
		case 'borda':
			return runBorda(ballots, movies);
		case 'schulze':
			return runSchulze(ballots, movies);
		case 'ranked-pairs':
			return runRankedPairs(ballots, movies);
		default:
			return runInstantRunoff(ballots, movies);
	}
}

function toResult(
	movies: Movie[],
	scores: Map<string, number>,
): VotingResult {
	const maxScore = Math.max(...scores.values(), -Infinity);
	const winners = movies.filter((m) => scores.get(m.id) === maxScore && maxScore > 0);
	const finalTally = new Map<string, VoteTally>();
	for (const movie of movies) {
		finalTally.set(movie.id, { primary: scores.get(movie.id) ?? 0, transferred: 0 });
	}
	return { winners, finalTally, eliminatedVotes: new Map() };
}

function runBorda(ballots: Record<string, string[]>, movies: Movie[]): VotingResult {
	const validBallots = Object.values(ballots).filter((b) => b.length > 0);
	if (validBallots.length === 0 || movies.length === 0) {
		return { winners: [], finalTally: new Map(), eliminatedVotes: new Map() };
	}
	const n = movies.length;
	const scores = new Map<string, number>(movies.map((m) => [m.id, 0]));
	for (const ballot of validBallots) {
		ballot.forEach((id, rank) => {
			if (scores.has(id)) scores.set(id, (scores.get(id) ?? 0) + (n - 1 - rank));
		});
	}
	return toResult(movies, scores);
}

/** Pairwise preference counts: wins.get(a)!.get(b) = ballots ranking a above b. */
function pairwiseWins(ballots: Record<string, string[]>, movies: Movie[]): Map<string, Map<string, number>> {
	const wins = new Map<string, Map<string, number>>();
	for (const a of movies) {
		wins.set(a.id, new Map(movies.filter((b) => b.id !== a.id).map((b) => [b.id, 0])));
	}
	for (const ballot of Object.values(ballots)) {
		for (let i = 0; i < ballot.length; i++) {
			for (let j = i + 1; j < ballot.length; j++) {
				const higher = ballot[i];
				const lower = ballot[j];
				if (wins.has(higher) && wins.get(higher)!.has(lower)) {
					wins.get(higher)!.set(lower, wins.get(higher)!.get(lower)! + 1);
				}
			}
		}
	}
	return wins;
}

function runSchulze(ballots: Record<string, string[]>, movies: Movie[]): VotingResult {
	const validBallots = Object.values(ballots).filter((b) => b.length > 0);
	if (validBallots.length === 0 || movies.length === 0) {
		return { winners: [], finalTally: new Map(), eliminatedVotes: new Map() };
	}
	const wins = pairwiseWins(ballots, movies);
	const ids = movies.map((m) => m.id);

	// Strength of the direct preference between each pair
	const p = new Map<string, Map<string, number>>();
	for (const i of ids) {
		p.set(i, new Map());
		for (const j of ids) {
			if (i === j) continue;
			const ij = wins.get(i)!.get(j) ?? 0;
			const ji = wins.get(j)!.get(i) ?? 0;
			p.get(i)!.set(j, ij > ji ? ij : 0);
		}
	}

	// Strongest paths (Floyd-Warshall)
	for (const k of ids) {
		for (const i of ids) {
			if (i === k) continue;
			for (const j of ids) {
				if (j === i || j === k) continue;
				p.get(i)!.set(j, Math.max(p.get(i)!.get(j)!, Math.min(p.get(i)!.get(k)!, p.get(k)!.get(j)!)));
			}
		}
	}

	// Display score: how many candidates this one beats via strongest paths
	const scores = new Map<string, number>();
	const winnerIds: string[] = [];
	for (const i of ids) {
		let unbeaten = true;
		let beatenCount = 0;
		for (const j of ids) {
			if (i === j) continue;
			if (p.get(j)!.get(i)! > p.get(i)!.get(j)!) unbeaten = false;
			if (p.get(i)!.get(j)! > p.get(j)!.get(i)!) beatenCount++;
		}
		scores.set(i, beatenCount);
		if (unbeaten) winnerIds.push(i);
	}
	const winners = movies.filter((m) => winnerIds.includes(m.id));
	const finalTally = new Map<string, VoteTally>();
	for (const movie of movies) {
		finalTally.set(movie.id, { primary: scores.get(movie.id) ?? 0, transferred: 0 });
	}
	return { winners, finalTally, eliminatedVotes: new Map() };
}

function runRankedPairs(ballots: Record<string, string[]>, movies: Movie[]): VotingResult {
	const validBallots = Object.values(ballots).filter((b) => b.length > 0);
	if (validBallots.length === 0 || movies.length === 0) {
		return { winners: [], finalTally: new Map(), eliminatedVotes: new Map() };
	}
	const wins = pairwiseWins(ballots, movies);
	const ids = movies.map((m) => m.id);

	// All pairwise victories, strongest margin first
	const pairs: Array<{ winner: string; loser: string; margin: number; votes: number }> = [];
	for (const i of ids) {
		for (const j of ids) {
			if (i === j) continue;
			const ij = wins.get(i)!.get(j) ?? 0;
			const ji = wins.get(j)!.get(i) ?? 0;
			if (ij > ji) pairs.push({ winner: i, loser: j, margin: ij - ji, votes: ij });
		}
	}
	pairs.sort((a, b) => b.margin - a.margin || b.votes - a.votes);

	// Lock pairs, skipping any that would create a cycle
	const locked = new Map<string, Set<string>>(); // winner -> losers
	const wouldCycle = (from: string, to: string): boolean => {
		// Adding from->to creates a cycle if `to` already reaches `from`
		const seen = new Set<string>();
		const stack = [to];
		while (stack.length > 0) {
			const cur = stack.pop()!;
			if (cur === from) return true;
			if (seen.has(cur)) continue;
			seen.add(cur);
			for (const next of locked.get(cur) ?? []) stack.push(next);
		}
		return false;
	};
	for (const { winner, loser } of pairs) {
		if (!wouldCycle(winner, loser)) {
			if (!locked.has(winner)) locked.set(winner, new Set());
			locked.get(winner)!.add(loser);
		}
	}

	// Winners: candidates nothing locked above
	const hasIncoming = new Set<string>();
	for (const losers of locked.values()) {
		for (const loser of losers) hasIncoming.add(loser);
	}
	const winnerIds = ids.filter((id) => !hasIncoming.has(id));
	const winners = movies.filter((m) => winnerIds.includes(m.id));
	const finalTally = new Map<string, VoteTally>();
	for (const movie of movies) {
		finalTally.set(movie.id, { primary: locked.get(movie.id)?.size ?? 0, transferred: 0 });
	}
	return { winners, finalTally, eliminatedVotes: new Map() };
}
