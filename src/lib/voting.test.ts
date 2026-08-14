import { describe, expect, it } from 'vitest';
import { runInstantRunoff } from '@/lib/voting';
import type { Movie } from '@/types';

const movies: Movie[] = [
	{ id: 'a', title: 'A', nominatedBy: ['p1'] },
	{ id: 'b', title: 'B', nominatedBy: ['p2'] },
	{ id: 'c', title: 'C', nominatedBy: ['p3'] },
];

describe('runInstantRunoff', () => {
	it('returns no winner when there are no valid ballots', () => {
		const result = runInstantRunoff({}, movies);
		expect(result.winners).toEqual([]);
		expect(result.finalTally.size).toBe(0);
		expect(result.eliminatedVotes.size).toBe(0);
	});

	it('elects a majority winner and records primary/transferred votes', () => {
		const result = runInstantRunoff(
			{
				p1: ['a', 'b', 'c'],
				p2: ['b', 'a', 'c'],
				p3: ['a', 'c', 'b'],
			},
			movies,
		);

		expect(result.winners.map((winner) => winner.id)).toEqual(['a']);
		expect(result.finalTally.get('a')).toEqual({ primary: 2, transferred: 1 });
		expect(result.eliminatedVotes.size).toBe(0);
	});

	it('eliminates tied low candidates and transfers their ballots', () => {
		const result = runInstantRunoff(
			{
				p1: ['a', 'b', 'c'],
				p2: ['b', 'a', 'c'],
				p3: ['c', 'b', 'a'],
				p4: ['c', 'a', 'b'],
			},
			movies,
		);

		expect(result.winners.map((winner) => winner.id)).toEqual(['c']);
		expect(result.eliminatedVotes.get('a')).toBe(1);
		expect(result.eliminatedVotes.get('b')).toBe(1);
		expect(result.finalTally.get('c')).toEqual({ primary: 2, transferred: 2 });
	});
});
