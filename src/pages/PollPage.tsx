import { usePoll } from '@/hooks/usePoll';
import { Button } from '@/components/ui/button';
import { MovieSearch, type MovieData } from '@/components/MovieSearch';
import { posterUrl, getGenreNames } from '@/lib/tmdb';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Movie } from '@/types';
import type { Phase } from '@/types';
import { storageKey } from '@/lib/identity';

interface Props {
	pollCode: string;
	displayName: string;
	autoShare?: boolean;
	isHost?: boolean;
	onLeave?: () => void;
	onSetName?: (name: string) => void;
}

function Poster({ movie, size = 'sm' }: { movie: Movie; size?: 'sm' | 'md' }) {
	const dims =
		size === 'md'
			? { width: '3.5rem', height: '5.25rem' }
			: { width: '2.75rem', height: '4.125rem' };
	return (
		<div
			className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded"
			style={{ ...dims, background: 'oklch(1 0 0 / 6%)' }}
		>
			{movie.posterPath ? (
				<img
					src={posterUrl(movie.posterPath, 'w92')}
					alt={movie.title}
					className="h-full w-full object-cover"
					loading="lazy"
				/>
			) : (
				<span className="text-sm">🎬</span>
			)}
		</div>
	);
}

function ordinal(n: number): string {
	if (n === 1) return '1st';
	if (n === 2) return '2nd';
	if (n === 3) return '3rd';
	return `${n}th`;
}

function RankBanner({ rank }: { rank: number }) {
	return (
		<div
			className="absolute top-0 left-0 overflow-hidden rounded-tl-xl pointer-events-none"
			style={{ width: '56px', height: '56px' }}
		>
			<div
				className="absolute text-center font-bold leading-none whitespace-nowrap"
				style={{
					background: 'oklch(0.8 0.12 295 / 0.72)',
					color: 'oklch(0.17 0.03 295)',
					fontSize: '12px',
					letterSpacing: '0.03em',
					width: '72px',
					padding: '2px 0',
					top: '12px',
					left: '-18px',
					transform: 'rotate(-45deg)',
				}}
			>
				{ordinal(rank)}
			</div>
		</div>
	);
}

function pollStatusText(phase: Phase, peerCount: number, ballotCount: number): string {
	if (peerCount <= 1) return "You're the only one here";
	if (phase === 'nominations') return `${peerCount} joined · nominating`;
	if (phase === 'voting') return `${peerCount} joined · ${ballotCount} voted`;
	return `${peerCount} joined · voting closed`;
}

interface MovieDetailsModalProps {
	movie: Movie | null;
	onClose: () => void;
	peerName?: string;
	onNominate?: () => void;
}

function MovieDetailsModal({ movie, onClose, peerName, onNominate }: MovieDetailsModalProps) {
	const [genres, setGenres] = useState<string[]>([]);

	useEffect(() => {
		if (movie?.genreIds) {
			getGenreNames(movie.genreIds).then(setGenres);
		}
	}, [movie?.genreIds]);

	if (!movie) return null;

	const rating = movie.rating ? Math.round(movie.rating * 10) / 10 : null;

	return (
		<div
			className="fixed inset-0 z-50 flex md:items-center md:justify-center p-0 md:p-4"
			style={{ background: 'oklch(0 0 0 / 0.6)' }}
			onClick={onClose}
		>
			<div
				className="glass-card w-full h-screen md:h-auto md:max-h-[80vh] md:max-w-2xl overflow-y-auto flex flex-col md:rounded-xl rounded-none"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header with buttons */}
				<div className="flex items-center justify-between gap-3 border-b border-white/10 p-6">
					<button
						className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
						style={{
							background: 'oklch(0.8 0.12 295 / 0.15)',
							color: 'oklch(0.8 0.12 295)',
						}}
						onClick={onClose}
					>
						Back
					</button>
					{onNominate && (
						<button
							className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
							style={{
								background: 'oklch(0.8 0.12 295)',
								color: 'oklch(0.17 0.03 295)',
							}}
							onClick={onNominate}
						>
							Nominate
						</button>
					)}
				</div>

				{/* Content */}
				<div className="flex flex-col md:flex-row gap-5 overflow-y-auto p-6">
					{/* Poster */}
					<div className="flex justify-center md:justify-start md:flex-shrink-0">
						{movie.posterPath ? (
							<img
								src={posterUrl(movie.posterPath, 'w185')}
								alt={movie.title}
								className="rounded-xl object-cover"
								style={{ width: '150px', height: '225px' }}
							/>
						) : (
							<div
								className="flex items-center justify-center rounded-xl text-4xl"
								style={{ width: '150px', height: '225px', background: 'oklch(1 0 0 / 6%)' }}
							>
								🎬
							</div>
						)}
					</div>

					{/* Right: Details */}
					<div className="min-w-0 flex-1">
						<h2 className="text-xl font-bold leading-tight">{movie.title}</h2>

						{movie.year && (
							<p className="mt-1 text-sm text-muted-foreground">{movie.year}</p>
						)}

						{rating && (
							<p className="mt-2 text-sm">
								<span className="font-semibold" style={{ color: 'oklch(0.8 0.12 295)' }}>
									★ {rating}
								</span>
								<span className="text-muted-foreground">/10</span>
							</p>
						)}

						{genres.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-2">
								{genres.map((genre) => (
									<span
										key={genre}
										className="rounded-full px-2.5 py-1 text-xs font-medium"
										style={{
											background: 'oklch(0.8 0.12 295 / 0.12)',
											color: 'oklch(0.8 0.12 295)',
											border: '1px solid oklch(0.8 0.12 295 / 0.25)',
										}}
									>
										{genre}
									</span>
								))}
							</div>
						)}

						{movie.overview && (
							<>
								<p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
									Plot
								</p>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									{movie.overview}
								</p>
							</>
						)}

						{peerName && (
							<p className="mt-4 text-xs text-muted-foreground">
								Nominated by <span className="font-medium">{peerName}</span>
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function GenreTagsSm({ genreIds }: { genreIds: number[] }) {
	const [genres, setGenres] = useState<string[]>([]);

	useEffect(() => {
		getGenreNames(genreIds).then(setGenres);
	}, [genreIds]);

	if (genres.length === 0) return null;

	return (
		<div className="mt-1 flex flex-wrap gap-1">
			{genres.slice(0, 2).map((genre) => (
				<span
					key={genre}
					className="rounded px-1.5 py-0.5 text-[10px] font-medium opacity-70"
					style={{
						background: 'oklch(0.8 0.12 295 / 0.1)',
						color: 'oklch(0.8 0.12 295)',
					}}
				>
					{genre}
				</span>
			))}
			{genres.length > 2 && (
				<span className="text-[10px] opacity-50">+{genres.length - 2}</span>
			)}
		</div>
	);
}

function ShareModal({ pollCode, onClose }: { pollCode: string; onClose: () => void }) {
	const url = `${window.location.origin}/${pollCode}`;
	const [copied, setCopied] = useState(false);
	const canShare = typeof navigator.share === 'function';

	function copyUrl() {
		navigator.clipboard.writeText(url).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}

	function shareUrl() {
		navigator.share({ title: 'Movie Night Polls', url });
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
			style={{ background: 'oklch(0 0 0 / 0.6)' }}
			onClick={onClose}
		>
			<div
				className="glass-card w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-6 flex flex-col gap-5"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between">
					<p className="text-sm font-semibold">Invite to poll</p>
					<button
						className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
						onClick={onClose}
					>
						✕
					</button>
				</div>

				<div className="flex justify-center">
					<div className="flex flex-col items-center gap-1">
						<span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Room code</span>
						<span className="font-mono text-4xl font-bold tracking-[0.18em] text-center">{pollCode}</span>
					</div>
				</div>

				<div className="flex justify-center">
					<div className="rounded-xl p-3" style={{ background: 'oklch(1 0 0)' }}>
						<QRCodeSVG value={url} size={180} />
					</div>
				</div>

				<div
					className="flex items-center gap-2 rounded-lg px-3 py-2"
					style={{ background: 'oklch(1 0 0 / 0.06)', border: '1px solid oklch(1 0 0 / 0.1)' }}
				>
					<span className="flex-1 truncate font-mono text-xs text-muted-foreground">{url}</span>
					<button
						className="shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors"
						style={{
							background: copied ? 'oklch(0.8 0.12 295 / 0.2)' : 'oklch(0.8 0.12 295 / 0.1)',
							color: 'oklch(0.8 0.12 295)',
						}}
						onClick={copyUrl}
					>
						{copied ? '✓ Copied' : 'Copy'}
					</button>
				</div>

				{canShare && (
					<button
						className="w-full rounded-xl py-3 text-sm font-medium transition-colors"
						style={{ background: 'oklch(0.8 0.12 295)', color: 'oklch(0.17 0.03 295)' }}
						onClick={shareUrl}
					>
						Share via…
					</button>
				)}
			</div>
		</div>
	);
}

function NameEditModal({ current, onSave, onCancel }: { current: string; onSave: (name: string) => void; onCancel: () => void }) {
	const [name, setName] = useState(current);
	return (
		<div
			className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
			style={{ background: 'oklch(0 0 0 / 0.6)', backdropFilter: 'blur(4px)' }}
			onClick={onCancel}
		>
			<div
				className="glass-card w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-6 flex flex-col gap-4"
				onClick={(e) => e.stopPropagation()}
			>
				<p className="font-semibold text-base">Change your name</p>
				<input
					className="cinema-input"
					value={name}
					autoFocus
					onChange={(e) => setName(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()); }}
				/>
				<div className="flex gap-3">
					<button
						className="flex-1 rounded-xl py-2.5 text-sm font-medium"
						style={{ background: 'oklch(1 0 0 / 0.07)', color: 'oklch(1 0 0 / 0.7)' }}
						onClick={onCancel}
					>Cancel</button>
					<button
						className="flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-30"
						style={{ background: 'oklch(0.8 0.12 295)', color: 'oklch(0.17 0.03 295)' }}
						disabled={!name.trim()}
						onClick={() => name.trim() && onSave(name.trim())}
					>Save</button>
				</div>
			</div>
		</div>
	);
}

function PhaseConfirmModal({
	phase, nominationCount, ballotCount, peerCount, onConfirm, onCancel,
}: {
	phase: 'nominations' | 'voting';
	nominationCount: number;
	ballotCount: number;
	peerCount: number;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	const isNominations = phase === 'nominations';
	const stat = isNominations
		? { label: 'people nominated', value: nominationCount }
		: { label: 'people voted', value: ballotCount };
	const canConfirm = isNominations ? nominationCount >= 2 : ballotCount > 0;
	const blocker = isNominations
		? nominationCount < 2 ? 'At least 2 nominations are needed to start voting.' : null
		: ballotCount === 0 ? 'No votes have been submitted yet.' : null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
			style={{ background: 'oklch(0 0 0 / 0.6)', backdropFilter: 'blur(4px)' }}
			onClick={onCancel}
		>
			<div
				className="glass-card w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-6 flex flex-col gap-4"
				onClick={(e) => e.stopPropagation()}
			>
				<p className="font-semibold text-base">
					{isNominations ? 'Start voting?' : 'Reveal results?'}
				</p>

				<div
					className="rounded-xl px-4 py-3 flex items-center justify-between"
					style={{ background: 'oklch(1 0 0 / 0.05)', border: '1px solid oklch(1 0 0 / 0.1)' }}
				>
					<span className="text-sm text-muted-foreground">{stat.label}</span>
					<span className="font-semibold tabular-nums">{stat.value} / {peerCount}</span>
				</div>

				{blocker && (
					<p className="text-sm text-muted-foreground/70">{blocker}</p>
				)}

				<div className="flex gap-3">
					<button
						className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors"
						style={{ background: 'oklch(1 0 0 / 0.07)', color: 'oklch(1 0 0 / 0.7)' }}
						onClick={onCancel}
					>
						Cancel
					</button>
					<button
						className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-30"
						style={canConfirm ? { background: 'oklch(0.8 0.12 295)', color: 'oklch(0.17 0.03 295)' } : { background: 'oklch(1 0 0 / 0.07)', color: 'oklch(1 0 0 / 0.4)' }}
						disabled={!canConfirm}
						onClick={onConfirm}
					>
						{isNominations ? 'Start voting' : 'Reveal results'}
					</button>
				</div>
			</div>
		</div>
	);
}

function NamePromptOverlay({ onSubmit }: { onSubmit: (name: string) => void }) {
	const [name, setName] = useState('');

	function submit() {
		if (!name.trim()) return;
		onSubmit(name.trim());
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
			style={{ background: 'oklch(0 0 0 / 0.7)', backdropFilter: 'blur(4px)' }}
		>
			<div
				className="glass-card w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-6 flex flex-col gap-5"
			>
				<div>
					<p className="text-base font-semibold">You've been invited!</p>
					<p className="mt-1 text-sm text-muted-foreground">Enter your name to join the poll.</p>
				</div>
				<div className="flex flex-col gap-3">
					<input
						className="cinema-input"
						placeholder="Your name"
						value={name}
						autoFocus
						onChange={(e) => setName(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && submit()}
					/>
					<button
						className="w-full rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-40"
						style={{ background: 'oklch(0.8 0.12 295)', color: 'oklch(0.17 0.03 295)' }}
						disabled={!name.trim()}
						onClick={submit}
					>
						Join poll
					</button>
				</div>
			</div>
		</div>
	);
}

export function PollPage({ pollCode, displayName, autoShare = false, isHost = false, onLeave: _onLeave, onSetName }: Props) {
	const { state, selfId, nominateMovie, submitBallot, advancePhase } = usePoll(
		pollCode,
		displayName,
		isHost,
	);
	const [ranking, setRanking] = useState<string[]>(() => {
		try {
			const stored = localStorage.getItem(storageKey(`ranking.${pollCode}`));
			return stored ? (JSON.parse(stored) as string[]) : [];
		} catch { return []; }
	});
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const [insertBeforeId, setInsertBeforeId] = useState<string | null>(null);
	const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
	const [pendingNomination, setPendingNomination] = useState<MovieData | null>(null);
	const [shareOpen, setShareOpen] = useState(autoShare);
	const [confirmPhase, setConfirmPhase] = useState(false);
	const [nameEditOpen, setNameEditOpen] = useState(false);
	const [localDisplayName, setLocalDisplayName] = useState(displayName);
	const [rankingDragActive, setRankingDragActive] = useState(false);
	const [nominationDragOver, setNominationDragOver] = useState(false);

	useEffect(() => {
		localStorage.setItem(storageKey(`ranking.${pollCode}`), JSON.stringify(ranking));
	}, [ranking, pollCode]);

	const hasNominated = state.movies.some((m) => m.nominatedBy === selfId);
	const hasVoted = Boolean(state.ballots[selfId]);
	const peerCount = Object.keys(state.peers).length;
	const ballotCount = Object.keys(state.ballots).length;
	const currentUserName = localDisplayName || displayName || state.peers[selfId]?.name || 'Guest';
	const statusText = pollStatusText(state.phase, peerCount, ballotCount);

	function resetDrag() {
		setDraggedId(null);
		setInsertBeforeId(null);
		setRankingDragActive(false);
		setNominationDragOver(false);
	}

	function addToRanking(id: string) {
		setRanking((prev) => prev.includes(id) ? prev : [...prev, id]);
	}

	function removeFromRanking(id: string) {
		setRanking((prev) => prev.filter((x) => x !== id));
	}

	function handleDragStart(id: string) {
		const currentRanking = ranking;
		setTimeout(() => {
			setDraggedId(id);
			const idx = currentRanking.indexOf(id);
			setInsertBeforeId(idx !== -1 ? (currentRanking[idx + 1] ?? null) : null);
		}, 0);
	}

	function handleRankingItemDragOver(e: React.DragEvent, id: string) {
		e.preventDefault();
		e.stopPropagation();
		setRankingDragActive(true);
		const rect = (e.currentTarget as Element).getBoundingClientRect();
		const inTopHalf = e.clientY < rect.top + rect.height / 2;
		if (inTopHalf) {
			setInsertBeforeId(id);
		} else {
			const displayRanking = ranking.filter((rid) => rid !== draggedId);
			const idx = displayRanking.indexOf(id);
			setInsertBeforeId(idx === displayRanking.length - 1 ? null : displayRanking[idx + 1]);
		}
	}

	function handleRankingSectionDragOver(e: React.DragEvent) {
		e.preventDefault();
		setRankingDragActive(true);
	}

	function handleRankingSectionDragLeave(e: React.DragEvent) {
		if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) {
			setRankingDragActive(false);
			setInsertBeforeId(null);
		}
	}

	function handleRankingSectionDrop(e: React.DragEvent) {
		e.preventDefault();
		if (!draggedId) { resetDrag(); return; }
		setRanking((prev) => {
			const without = prev.filter((id) => id !== draggedId);
			if (insertBeforeId === null) return [...without, draggedId];
			const idx = without.indexOf(insertBeforeId);
			return idx === -1 ? [...without, draggedId] : [...without.slice(0, idx), draggedId, ...without.slice(idx)];
		});
		resetDrag();
	}

	function handleNominationSectionDragOver(e: React.DragEvent) {
		e.preventDefault();
		setNominationDragOver(true);
	}

	function handleNominationSectionDragLeave(e: React.DragEvent) {
		if (!(e.currentTarget as Element).contains(e.relatedTarget as Node))
			setNominationDragOver(false);
	}

	function handleNominationSectionDrop(e: React.DragEvent) {
		e.preventDefault();
		if (draggedId && ranking.includes(draggedId)) removeFromRanking(draggedId);
		resetDrag();
	}

	if (state.phase === 'results') {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center gap-5 px-6 py-14 text-center">
				<div
					className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
					style={{
						background: 'oklch(0.8 0.12 295 / 0.12)',
						boxShadow:
							'0 0 40px -8px oklch(0.8 0.12 295 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.08)',
						border: '1px solid oklch(0.8 0.12 295 / 0.25)',
					}}
				>
					🏆
				</div>

				{state.winner && (
					<div className="flex flex-col items-center gap-4">
						{state.winner.posterPath && (
							<img
								src={posterUrl(state.winner.posterPath, 'w185')}
								alt={state.winner.title}
								className="w-28 rounded-xl shadow-2xl"
								style={{ boxShadow: '0 0 40px -10px oklch(0.8 0.12 295 / 0.4)' }}
							/>
						)}
						<div>
							<p
								className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
								style={{ color: 'oklch(0.8 0.12 295)' }}
							>
								Tonight's pick
							</p>
							<h2
								className="text-3xl font-bold tracking-tight"
								style={{ letterSpacing: '-0.025em' }}
							>
								{state.winner.title}
							</h2>
							{state.winner.year && (
								<p className="mt-1 text-sm text-muted-foreground">{state.winner.year}</p>
							)}
						</div>
					</div>
				)}

				{!state.winner && (
					<div>
						<h2 className="text-2xl font-bold">No winner</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Not enough ballots to determine a winner.
						</p>
					</div>
				)}

				<p className="text-xs text-muted-foreground/50">Decided by ranked choice voting</p>
				<button
					className="mt-4 rounded-xl px-6 py-2.5 text-sm font-medium transition-colors"
					style={{ background: 'oklch(1 0 0 / 0.07)', color: 'oklch(1 0 0 / 0.6)' }}
					onClick={() => _onLeave?.()}
				>
					← Back to home
				</button>
			</div>
		);
	}

	const canRank = state.movies.length >= 1 && !hasVoted;
	const unranked = state.movies.filter((m) => !ranking.includes(m.id));

	return (
		<div className="mx-auto flex min-h-svh w-full max-w-lg flex-col">
			{/* Header */}
			<header
				className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
				style={{
					background: 'oklch(0.09 0.014 265 / 0.85)',
					backdropFilter: 'blur(16px)',
					borderBottom: '1px solid oklch(1 0 0 / 7%)',
				}}
			>
				<div className="min-w-0">
					<p className="text-sm font-semibold tracking-tight">🎬 Movie Night Polls</p>
					<p className="truncate text-sm text-foreground/90">
						Hello, <button
							className="font-bold underline-offset-2 hover:underline transition-all"
							style={{ color: 'oklch(0.8 0.12 295)' }}
							onClick={() => setNameEditOpen(true)}
						>{currentUserName}</button>{isHost && <span className="ml-1">👑</span>}
					</p>
				</div>
				<button
					className="flex items-center gap-1.5 rounded-full pl-3 pr-2 py-1 font-mono text-xs font-semibold tracking-[0.18em] transition-colors"
					style={{
						background: 'oklch(0.8 0.12 295 / 0.12)',
						color: 'oklch(0.8 0.12 295)',
						border: '1px solid oklch(0.8 0.12 295 / 0.25)',
					}}
					onClick={() => setShareOpen(true)}
				>
					{pollCode}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-70">
						<path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.475l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z" />
					</svg>
				</button>
			</header>

			<div className="flex justify-center px-5 pt-4">
				<div
					className="rounded-full px-4 py-1.5 text-xs font-semibold text-center"
					style={{
						background: 'oklch(0.8 0.12 295 / 0.12)',
						color: 'oklch(0.8 0.12 295)',
						border: '1px solid oklch(0.8 0.12 295 / 0.25)',
					}}
				>
					{statusText}
				</div>
			</div>

			<main className="flex flex-1 flex-col gap-4 px-5 py-5">
				{/* Nominate — only during nominations phase, only until user has nominated */}
				{state.phase === 'nominations' && !hasNominated && (
					<section className="glass-card p-5 relative z-[1]">
						<p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
							Nominate
						</p>
						<MovieSearch onSelect={setPendingNomination} />
					</section>
				)}

				{/* Rankings section */}
				{(canRank || hasVoted) && (
					<section
						className="glass-card p-5 transition-colors"
						style={{
							borderColor: canRank && draggedId && !ranking.includes(draggedId) ? 'oklch(0.8 0.12 295 / 0.4)' : undefined,
							background: canRank && draggedId && !ranking.includes(draggedId) ? 'oklch(0.8 0.12 295 / 0.06)' : undefined,
						}}
						onDragOver={canRank ? handleRankingSectionDragOver : undefined}
						onDragLeave={canRank ? handleRankingSectionDragLeave : undefined}
						onDrop={canRank ? handleRankingSectionDrop : undefined}
					>
						<div className="mb-3 flex items-center justify-between">
							<p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
								Your ranking
							</p>
							{hasVoted ? (
								<span className="text-[10px] font-medium" style={{ color: 'oklch(0.8 0.12 295)' }}>✓ Submitted</span>
							) : ranking.length > 0 && (
								<p className="text-[10px] text-muted-foreground/50">{ranking.length} of {state.movies.length}</p>
							)}
						</div>

						{(() => {
							const displayRanking = ranking.filter((id) => id !== draggedId);
							const previewRanking = draggedId
								? insertBeforeId !== null
									? (() => { const idx = displayRanking.indexOf(insertBeforeId); return idx === -1 ? [...displayRanking, draggedId] : [...displayRanking.slice(0, idx), draggedId, ...displayRanking.slice(idx)]; })()
									: [...displayRanking, draggedId]
								: ranking;
							const rankMap = new Map(previewRanking.map((id, i) => [id, i + 1]));
							const dropSlot = (key: string) => (
								<li
									key={key}
									className="pointer-events-none rounded-xl border-2 border-dashed min-h-[100px] transition-all"
									style={{ borderColor: 'oklch(0.8 0.12 295 / 0.5)', background: 'oklch(0.8 0.12 295 / 0.04)' }}
								/>
							);
							if (displayRanking.length === 0 && !rankingDragActive) return (
								<div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
									<p className="text-2xl opacity-30">↑</p>
									<p className="text-sm text-muted-foreground/50">Drag nominations here to rank them</p>
								</div>
							);
							return (
								<ul className="space-y-2">
									{displayRanking.flatMap((id) => {
										const movie = state.movies.find((m) => m.id === id)!;
										if (!movie) return [];
										return [
											...(draggedId && insertBeforeId === id ? [dropSlot(`slot-before-${id}`)] : []),
											<li
												key={id}
												className="relative flex items-center gap-3 rounded-xl p-3 min-h-[100px] transition-all overflow-hidden"
												style={{
													background: 'oklch(0.8 0.12 295 / 0.08)',
													cursor: canRank ? 'grab' : 'default',
												}}
												draggable={canRank}
												onDragStart={canRank ? () => handleDragStart(id) : undefined}
												onDragOver={canRank ? (e) => handleRankingItemDragOver(e, id) : undefined}
												onDragEnd={canRank ? resetDrag : undefined}
											>
												<RankBanner rank={rankMap.get(id) ?? 1} />
												<span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-xs font-bold opacity-40 select-none">☰</span>
												<Poster movie={movie} size="sm" />
												<div className="min-w-0 flex-1">
													<p className="line-clamp-2 text-sm font-medium leading-tight pr-5">{movie.title}</p>
													<div className="mt-1 flex items-center gap-1.5">
														{movie.year && <span className="text-xs text-muted-foreground">{movie.year}</span>}
														{movie.rating && (
															<span className="text-xs" style={{ color: 'oklch(0.8 0.12 295)' }}>
																★ {Math.round(movie.rating * 10) / 10}
															</span>
														)}
													</div>
													{movie.genreIds && movie.genreIds.length > 0 && (
														<GenreTagsSm genreIds={movie.genreIds} />
													)}
												</div>
												<div className="flex flex-shrink-0 flex-col items-end justify-end h-full">
													<button
														className="text-lg leading-none"
														onClick={(e) => { e.stopPropagation(); setSelectedMovie(movie); }}
														title="Movie details"
													>ⓘ</button>
													<p className="text-[10px] text-muted-foreground text-right mt-1">
														{state.peers[movie.nominatedBy]?.name ?? '?'}
													</p>
												</div>
												{canRank && (
													<button
														className="absolute top-2 right-2 opacity-25 hover:opacity-80 transition-opacity text-xs leading-none"
														onClick={(e) => { e.stopPropagation(); removeFromRanking(id); }}
														title="Remove from ranking"
													>✕</button>
												)}
											</li>,
										];
									})}
									{draggedId && insertBeforeId === null && dropSlot('slot-end')}
								</ul>
							);
						})()}

						{state.phase === 'nominations' && !hasVoted && (
							<p className="mt-4 text-center text-sm text-muted-foreground/60">
								Voting hasn’t started yet — the host will open it once nominations are in.
							</p>
						)}
						{state.phase === 'voting' && !hasVoted && ranking.length === state.movies.length && (
							<Button
								className="mt-4 w-full rounded-xl font-semibold glow-amber transition-all hover:scale-[1.01] active:scale-[0.98]"
								onClick={() => submitBallot(ranking)}
							>
								Submit ballot
							</Button>
						)}
						{hasVoted && (
							<div
								className="mt-4 rounded-xl p-3 text-center text-sm font-medium"
								style={{
									background: 'oklch(0.8 0.12 295 / 0.07)',
									border: '1px solid oklch(0.8 0.12 295 / 0.18)',
									color: 'oklch(0.8 0.12 295)',
								}}
							>
								✓ Ballot submitted — waiting for everyone else
							</div>
						)}
					</section>
				)}

				{/* Nominations */}
				{state.movies.length > 0 && !hasVoted && (
					<section
						className="glass-card p-5 transition-colors"
						style={{
							borderColor: nominationDragOver && draggedId && ranking.includes(draggedId) ? 'oklch(0.56 0.022 270 / 0.35)' : undefined,
							background: nominationDragOver && draggedId && ranking.includes(draggedId) ? 'oklch(1 0 0 / 7%)' : undefined,
						}}
						onDragOver={handleNominationSectionDragOver}
						onDragLeave={handleNominationSectionDragLeave}
						onDrop={handleNominationSectionDrop}
					>
						<p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
							Nominated — {state.movies.length}
							{canRank && unranked.length < state.movies.length && (
								<span className="ml-2 font-normal opacity-50">· {unranked.length} remaining</span>
							)}
						</p>
						<ul className="space-y-2">
							{unranked.filter((m) => m.id !== draggedId).map((movie) => (
								<li
									key={movie.id}
									className="flex items-center gap-3 rounded-xl p-3 transition-all min-h-[100px]"
									style={{
										background: 'oklch(0.8 0.12 295 / 0.08)',
										opacity: draggedId === movie.id ? 0 : 1,
										cursor: canRank ? 'grab' : 'default',
									}}
									draggable={canRank}
									onClick={canRank ? () => addToRanking(movie.id) : undefined}
									onDragStart={canRank ? () => handleDragStart(movie.id) : undefined}
									onDragEnd={canRank ? resetDrag : undefined}
								>
									<span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-xs font-bold opacity-40 select-none">☰</span>
									<Poster movie={movie} size="sm" />
									<div className="min-w-0 flex-1">
										<p className="line-clamp-2 text-sm font-medium leading-tight">{movie.title}</p>
										<div className="mt-1 flex items-center gap-1.5">
											{movie.year && (
												<span className="text-xs text-muted-foreground">{movie.year}</span>
											)}
											{movie.rating && (
												<span className="text-xs" style={{ color: 'oklch(0.8 0.12 295)' }}>
													★ {Math.round(movie.rating * 10) / 10}
												</span>
											)}
										</div>
										{movie.genreIds && movie.genreIds.length > 0 && (
											<GenreTagsSm genreIds={movie.genreIds} />
										)}
									</div>
									<div className="flex flex-shrink-0 flex-col items-end justify-between h-full">
										<button
											className="text-lg leading-none"
											onClick={(e) => { e.stopPropagation(); setSelectedMovie(movie); }}
											title="Movie details"
										>
											ⓘ
										</button>
										<p className="text-[10px] text-muted-foreground text-right">
											{state.peers[movie.nominatedBy]?.name ?? '?'}
										</p>
									</div>
								</li>
							))}
						</ul>
					</section>
				)}


			</main>

			{/* Footer */}
			<footer className="px-5 pb-8 pt-2">

				{isHost && state.phase === 'nominations' && (
					<Button
						className="w-full rounded-xl font-semibold glow-amber transition-all hover:scale-[1.01] active:scale-[0.98]"
						onClick={() => setConfirmPhase(true)}
					>
						Start voting →
					</Button>
				)}
				{isHost && state.phase === 'voting' && (
					<Button
						variant="destructive"
						className="w-full rounded-xl font-medium opacity-60 transition-opacity hover:opacity-100"
						onClick={() => setConfirmPhase(true)}
					>
						End voting &amp; reveal results
					</Button>
				)}
			</footer>

			<MovieDetailsModal
				movie={pendingNomination ? ({ ...pendingNomination, nominatedBy: selfId } as Movie) : selectedMovie}
				onClose={() => {
					if (pendingNomination) setPendingNomination(null);
					else setSelectedMovie(null);
				}}
				peerName={pendingNomination ? undefined : (selectedMovie ? state.peers[selectedMovie.nominatedBy]?.name : undefined)}
				onNominate={pendingNomination ? () => {
					nominateMovie(pendingNomination);
					setPendingNomination(null);
				} : undefined}
			/>

			{confirmPhase && (state.phase === 'nominations' || state.phase === 'voting') && (
				<PhaseConfirmModal
					phase={state.phase}
					nominationCount={state.movies.length}
					ballotCount={ballotCount}
					peerCount={peerCount}
					onConfirm={() => { advancePhase(); setConfirmPhase(false); }}
					onCancel={() => setConfirmPhase(false)}
				/>
			)}

			{shareOpen && (
				<ShareModal pollCode={pollCode} onClose={() => setShareOpen(false)} />
			)}

			{nameEditOpen && (
				<NameEditModal
					current={currentUserName}
					onSave={(name) => {
						localStorage.setItem(storageKey('displayName'), name);
						setLocalDisplayName(name);
						setNameEditOpen(false);
					}}
					onCancel={() => setNameEditOpen(false)}
				/>
			)}

			{!displayName && onSetName && (
				<NamePromptOverlay onSubmit={onSetName} />
			)}
		</div>
	);
}
