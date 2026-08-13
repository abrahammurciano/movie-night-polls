/**
 * Persistent client identity.
 *
 * selfId is a stable UUID stored in localStorage so it survives page reloads.
 * storageKey() namespaces every key by ?session=N (default 0) so multiple
 * browser tabs can simulate independent users during development.
 */

function sessionSuffix(): string {
	const s = new URLSearchParams(window.location.search).get('session');
	return s && s !== '0' ? `.s${s}` : '';
}

export function storageKey(key: string): string {
	return `mnp.${key}${sessionSuffix()}`;
}

export const selfId: string = (() => {
	const key = storageKey('peerId');
	const existing = localStorage.getItem(key);
	if (existing) return existing;
	const id = crypto.randomUUID();
	localStorage.setItem(key, id);
	return id;
})();
