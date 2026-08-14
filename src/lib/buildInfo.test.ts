import { describe, expect, it } from 'vitest';
import { parseDevPreviewId } from '@/lib/buildInfo';

describe('parseDevPreviewId', () => {
	it('returns PR id for dev preview paths', () => {
		expect(parseDevPreviewId('/movie-night-polls/dev/123/')).toBe('123');
		expect(parseDevPreviewId('/movie-night-polls/dev/123')).toBe('123');
	});

	it('returns null for non-preview paths', () => {
		expect(parseDevPreviewId('/')).toBeNull();
		expect(parseDevPreviewId('/movie-night-polls/')).toBeNull();
		expect(parseDevPreviewId('/movie-night-polls/dev/abc/')).toBeNull();
	});
});
