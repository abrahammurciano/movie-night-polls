const API_KEY = '9633e09162fa0a2716e60ef65b3b6c9c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const tmdbConfigured = true;

export interface TmdbMovie {
	id: number;
	title: string;
	release_date?: string;
	poster_path?: string | null;
	genre_ids?: number[];
	vote_average?: number;
	overview?: string;
}

let genreCache: Map<number, string> | null = null;

async function getGenreMap(): Promise<Map<number, string>> {
	if (genreCache) return genreCache;
	try {
		const url = new URL(`${BASE_URL}/genre/movie/list`);
		url.searchParams.set('api_key', API_KEY);
		url.searchParams.set('language', 'en-US');
		const res = await fetch(url.toString());
		if (!res.ok) return new Map();
		const data = (await res.json()) as { genres: Array<{ id: number; name: string }> };
		genreCache = new Map(data.genres?.map((g) => [g.id, g.name]) ?? []);
		return genreCache;
	} catch {
		return new Map();
	}
}

export function posterUrl(path: string, size: 'w92' | 'w185' | 'w342' = 'w185'): string {
	return `${IMAGE_BASE}/${size}${path}`;
}

export async function getGenreNames(genreIds: number[] | undefined): Promise<string[]> {
	if (!genreIds || genreIds.length === 0) return [];
	const map = await getGenreMap();
	return genreIds.map((id) => map.get(id) || '').filter(Boolean);
}

export async function searchMovies(query: string): Promise<TmdbMovie[]> {
	if (!API_KEY || !query.trim()) return [];
	try {
		const url = new URL(`${BASE_URL}/search/movie`);
		url.searchParams.set('api_key', API_KEY);
		url.searchParams.set('query', query);
		url.searchParams.set('include_adult', 'false');
		url.searchParams.set('language', 'en-US');
		url.searchParams.set('page', '1');
		const res = await fetch(url.toString());
		if (!res.ok) return [];
		const data = (await res.json()) as { results: TmdbMovie[] };
		return (data.results ?? []).slice(0, 7);
	} catch {
		return [];
	}
}
