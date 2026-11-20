/**
 * Registry of polls this device knows about, persisted in localStorage.
 * Every poll the user creates or joins is remembered here so the home page
 * can list them.
 */

import { storageKey } from '@/lib/identity';

const KEY = storageKey('polls');

export function getKnownPolls(): string[] {
	try {
		const stored = localStorage.getItem(KEY);
		const parsed = stored ? JSON.parse(stored) : [];
		return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
	} catch {
		return [];
	}
}

export function rememberPoll(code: string): void {
	const polls = getKnownPolls();
	if (!polls.includes(code)) {
		polls.push(code);
		localStorage.setItem(KEY, JSON.stringify(polls));
	}
}

export function forgetPoll(code: string): void {
	const polls = getKnownPolls().filter((c) => c !== code);
	localStorage.setItem(KEY, JSON.stringify(polls));
}
