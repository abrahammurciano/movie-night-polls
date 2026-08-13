import { useEffect, useRef, useState } from 'react';
import { searchMovies, posterUrl, tmdbConfigured, type TmdbMovie } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import type { Movie } from '@/types';

export type MovieData = Omit<Movie, 'nominatedBy'>;

interface Props {
	onSelect: (movie: MovieData) => void;
	disabled?: boolean;
}

function toMovieData(tmdb: TmdbMovie): MovieData {
	return {
		id: crypto.randomUUID(),
		tmdbId: tmdb.id,
		title: tmdb.title,
		year: tmdb.release_date ? parseInt(tmdb.release_date.slice(0, 4), 10) : undefined,
		posterPath: tmdb.poster_path ?? undefined,
		genreIds: tmdb.genre_ids,
		rating: tmdb.vote_average,
		overview: tmdb.overview,
	};
}

function FallbackInput({ onSelect, disabled }: Props) {
	const [title, setTitle] = useState('');

	function submit() {
		if (!title.trim()) return;
		onSelect({ id: crypto.randomUUID(), title: title.trim() });
		setTitle('');
	}

	return (
		<div className="flex gap-2">
			<input
				className="cinema-input flex-1"
				placeholder="Enter movie title…"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				onKeyDown={(e) => e.key === 'Enter' && submit()}
				disabled={disabled}
			/>
			<Button
				className="rounded-xl px-4 glow-amber-sm"
				onClick={submit}
				disabled={disabled || !title.trim()}
			>
				Add
			</Button>
		</div>
	);
}

function TmdbSearch({ onSelect, disabled }: Props) {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<TmdbMovie[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function onClickOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', onClickOutside);
		return () => document.removeEventListener('mousedown', onClickOutside);
	}, []);

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			setLoading(false);
			setOpen(false);
			return;
		}
		setLoading(true);
		const timer = setTimeout(async () => {
			const movies = await searchMovies(query);
			setResults(movies);
			setLoading(false);
			setOpen(movies.length > 0);
		}, 320);
		return () => clearTimeout(timer);
	}, [query]);

	function handleSelect(tmdb: TmdbMovie) {
		onSelect(toMovieData(tmdb));
		setQuery('');
		setResults([]);
		setOpen(false);
	}

	return (
		<div ref={containerRef} className="relative">
			<div className="relative">
				<input
					className="cinema-input pr-9"
					placeholder="Search for a movie…"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					disabled={disabled}
				/>
				{loading && (
					<span
						className="absolute right-3 top-1/2 -translate-y-1/2 select-none text-lg leading-none text-muted-foreground/40"
						style={{ animation: 'spin 1s linear infinite' }}
					>
						⟳
					</span>
				)}
			</div>

			{open && results.length > 0 && (
				<ul
					className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl shadow-2xl"
					style={{
						background: 'oklch(0.135 0.016 265)',
						border: '1px solid oklch(1 0 0 / 11%)',
					}}
				>
					{results.map((movie, i) => {
						const year = movie.release_date?.slice(0, 4);
						return (
							<li
								key={movie.id}
								className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors"
								style={{
									borderBottom:
										i < results.length - 1 ? '1px solid oklch(1 0 0 / 6%)' : 'none',
								}}
								onMouseEnter={(e) =>
								((e.currentTarget as HTMLElement).style.background =
									'oklch(1 0 0 / 4%)')
								}
								onMouseLeave={(e) =>
									((e.currentTarget as HTMLElement).style.background = 'transparent')
								}
								onMouseDown={(e) => {
									e.preventDefault();
									handleSelect(movie);
								}}
							>
								<div
									className="flex h-14 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded"
									style={{ background: 'oklch(1 0 0 / 6%)' }}
								>
									{movie.poster_path ? (
										<img
											src={posterUrl(movie.poster_path, 'w92')}
											alt={movie.title}
											className="h-full w-full object-cover"
											loading="lazy"
										/>
									) : (
										<span className="text-base">🎬</span>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium leading-tight">
										{movie.title}
									</p>
									{year && (
										<p className="mt-0.5 text-xs text-muted-foreground">{year}</p>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

export function MovieSearch({ onSelect, disabled }: Props) {
	return tmdbConfigured ? (
		<TmdbSearch onSelect={onSelect} disabled={disabled} />
	) : (
		<FallbackInput onSelect={onSelect} disabled={disabled} />
	);
}
