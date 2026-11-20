/**
 * useKnownPolls – live summaries of every poll this device knows about.
 *
 * Joins the Trystero room of each known poll (unless it is already closed)
 * so the home page list stays up to date and this device helps relay P2P
 * state for those rooms. Rooms that turn out to be closed are left again.
 */

import { useEffect, useState } from 'react';
import type { Room } from 'trystero';
import { joinRoom } from '@/lib/trystero';
import { createEventLog } from '@/lib/eventLog';
import { storageKey } from '@/lib/identity';
import { getKnownPolls, forgetPoll } from '@/lib/knownPolls';
import type { Phase } from '@/types';

export interface PollSummary {
	code: string;
	phase: Phase;
	winnerTitles: string[];
}

export function useKnownPolls(): { summaries: PollSummary[]; dismiss: (code: string) => void } {
	const [summaries, setSummaries] = useState<PollSummary[]>([]);

	useEffect(() => {
		const codes = getKnownPolls();
		const cleanups: Array<() => void> = [];

		for (const code of codes) {
			const log = createEventLog(storageKey(`yjs.${code}`));
			let room: Room | null = null;

			const update = () => {
				const state = log.getState();
				setSummaries((prev) => {
					const next = prev.filter((s) => s.code !== code);
					next.push({ code, phase: state.phase, winnerTitles: state.winner.map((m) => m.title) });
					next.sort((a, b) => codes.indexOf(a.code) - codes.indexOf(b.code));
					return [...next];
				});
				// Leave the room once we learn the poll is closed
				if (state.phase === 'results' && room) {
					room.leave();
					room = null;
				}
			};

			update();
			const unsubscribe = log.subscribe(update);
			cleanups.push(unsubscribe);

			// Only join rooms that are not already closed locally
			if (log.getState().phase !== 'results') {
				room = joinRoom(code);
				log.connectRoom(room);
				cleanups.push(() => { if (room) room.leave(); });
			}
		}

		return () => cleanups.forEach((fn) => fn());
	}, []);

	function dismiss(code: string) {
		forgetPoll(code);
		setSummaries((prev) => prev.filter((s) => s.code !== code));
	}

	return { summaries, dismiss };
}
