/**
 * The user's preferred default poll settings, persisted in localStorage.
 *
 * Saved in real time as they are changed on the home page, and used as the
 * starting point the next time the user creates a poll.
 */

import { storageKey } from '@/lib/identity';

export interface CreatePollSettings {
	maxNominationsPerUser: number;
}

export const DEFAULT_POLL_SETTINGS: CreatePollSettings = {
	maxNominationsPerUser: 1,
};

const KEY = storageKey('pollDefaults');

export function loadPollSettings(): CreatePollSettings {
	try {
		const stored = localStorage.getItem(KEY);
		if (!stored) return { ...DEFAULT_POLL_SETTINGS };
		const parsed = JSON.parse(stored) as Partial<CreatePollSettings>;
		return { ...DEFAULT_POLL_SETTINGS, ...parsed };
	} catch {
		return { ...DEFAULT_POLL_SETTINGS };
	}
}

export function savePollSettings(settings: CreatePollSettings): void {
	localStorage.setItem(KEY, JSON.stringify(settings));
}

export function settingsModified(settings: CreatePollSettings): boolean {
	return settings.maxNominationsPerUser !== DEFAULT_POLL_SETTINGS.maxNominationsPerUser;
}
