import type { Movie } from '@/types';

interface VoteChartProps {
	movies: Movie[];
	tally: Map<string, { primary: number; transferred: number }>;
	eliminatedVotes: Map<string, number>;
}

export function VoteChart({ movies, tally, eliminatedVotes }: VoteChartProps) {
	const maxVotes = Math.max(
		...Array.from(tally.values()).map((t) => t.primary + t.transferred),
		...Array.from(eliminatedVotes.values()),
		1,
	);

	const finalMovies = movies
		.filter((m) => tally.has(m.id))
		.sort((a, b) => {
			const at = tally.get(a.id)!;
			const bt = tally.get(b.id)!;
			return (bt.primary + bt.transferred) - (at.primary + at.transferred);
		});

	const eliminatedMovies = movies
		.filter((m) => !tally.has(m.id))
		.sort((a, b) => (eliminatedVotes.get(b.id) ?? 0) - (eliminatedVotes.get(a.id) ?? 0));

	return (
		<div className="w-full space-y-3">
			<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
				Final round votes
			</p>
			<div className="space-y-2">
				{finalMovies.map((movie) => {
					const votes = tally.get(movie.id)!;
					const total = votes.primary + votes.transferred;
					const primaryPct = (votes.primary / maxVotes) * 100;
					const transferredPct = (votes.transferred / maxVotes) * 100;

					return (
						<div key={movie.id} className="flex flex-col gap-1">
							<div className="flex items-baseline justify-between gap-2 min-w-0">
								<span className="text-sm font-medium truncate">{movie.title}</span>
								<span className="text-xs font-semibold flex-shrink-0" style={{ color: 'oklch(0.8 0.12 295)' }}>
									{total} vote{total !== 1 ? 's' : ''}
								</span>
							</div>
							<div className="flex h-2 rounded-full overflow-hidden bg-white/5">
								<div className="transition-all" style={{ background: 'oklch(0.8 0.12 295)', width: `${primaryPct}%` }} title={`Primary: ${votes.primary}`} />
								<div className="transition-all" style={{ background: 'oklch(0.8 0.12 295 / 0.4)', width: `${transferredPct}%` }} title={`Transferred: ${votes.transferred}`} />
							</div>
							{votes.transferred > 0 && (
								<div className="flex justify-between gap-2 text-[10px] text-muted-foreground">
									<span>{votes.primary} primary</span>
									<span>{votes.transferred} transferred</span>
								</div>
							)}
						</div>
					);
				})}
				{eliminatedMovies.map((movie) => {
					const votes = eliminatedVotes.get(movie.id) ?? 0;
					const pct = (votes / maxVotes) * 100;

					return (
						<div key={movie.id} className="flex flex-col gap-1 opacity-40">
							<div className="flex items-baseline justify-between gap-2 min-w-0">
								<span className="text-sm font-medium truncate">{movie.title}</span>
								<span className="text-xs font-semibold flex-shrink-0 text-muted-foreground">
									{votes} vote{votes !== 1 ? 's' : ''}
								</span>
							</div>
							<div className="flex h-2 rounded-full overflow-hidden bg-white/5">
								<div className="transition-all" style={{ background: 'oklch(1 0 0 / 0.3)', width: `${pct}%` }} title={`Eliminated with ${votes} vote${votes !== 1 ? 's' : ''}`} />
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
