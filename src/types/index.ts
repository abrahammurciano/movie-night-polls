// ─── Domain Types ────────────────────────────────────────────────────────────

export type PeerId = string;

export type Phase = 'nominations' | 'voting' | 'results';

export interface PollSettings {
	hostId: PeerId;
	maxNominationsPerUser?: number;
}

export interface Movie {
	id: string;
	title: string;
	nominatedBy: PeerId;
	tmdbId?: number;
	year?: number;
	posterPath?: string;
	genreIds?: number[];
	rating?: number;
	overview?: string;
}

/** A single event in the shared, append-only event log */
export type PollEvent =
	| { type: 'poll_created'; peerId: PeerId; settings: PollSettings; timestamp: number }
	| { type: 'peer_joined'; peerId: PeerId; name: string; timestamp: number }
	| { type: 'nomination'; peerId: PeerId; movie: Movie; timestamp: number }
	| { type: 'phase_advanced'; peerId: PeerId; timestamp: number }
	| { type: 'ballot'; peerId: PeerId; ranking: string[]; timestamp: number };

/** Reduced state computed from the event log */
export interface PollState {
	phase: Phase;
	hostId: PeerId | null;
	settings: PollSettings | null;
	peers: Record<PeerId, { name: string }>;
	movies: Movie[];
	ballots: Record<PeerId, string[]>;
	winner: Movie[];
	finalTally: Map<string, { primary: number; transferred: number }>;
	eliminatedVotes: Map<string, number>;
}
