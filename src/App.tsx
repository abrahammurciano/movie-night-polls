import { useState, useEffect } from 'react';
import { HomePage } from '@/pages/HomePage';
import { PollPage } from '@/pages/PollPage';
import { storageKey, selfId } from '@/lib/identity';

interface Session {
	pollCode: string;
	displayName: string;
	autoShare: boolean;
	isHost: boolean;
}

function readStoredDisplayName() {
	return localStorage.getItem(storageKey('displayName'))?.trim() ?? '';
}

function writeStoredDisplayName(name: string) {
	if (!name.trim()) return;
	localStorage.setItem(storageKey('displayName'), name.trim());
}

function isStoredHost(pollCode: string): boolean {
	return localStorage.getItem(storageKey(`host.${pollCode}`)) === selfId;
}

function codeFromPath(): string | null {
	const match = window.location.hash.match(/^#\/([A-Z0-9]{6})$/i);
	return match ? match[1].toUpperCase() : null;
}

function App() {
	const [session, setSession] = useState<Session | null>(() => {
		const code = codeFromPath();
		return code ? { pollCode: code, displayName: readStoredDisplayName(), autoShare: false, isHost: isStoredHost(code) } : null;
	});

	useEffect(() => {
		const onPop = () => {
			const code = codeFromPath();
			if (!code) setSession(null);
			else if (!session || session.pollCode !== code)
				setSession({ pollCode: code, displayName: readStoredDisplayName(), autoShare: false, isHost: isStoredHost(code) });
		};
		window.addEventListener('popstate', onPop);
		return () => window.removeEventListener('popstate', onPop);
	}, [session]);

	function handleJoin(pollCode: string, displayName: string, isCreator: boolean) {
		writeStoredDisplayName(displayName);
		if (isCreator) localStorage.setItem(storageKey(`host.${pollCode}`), selfId);
		const s = new URLSearchParams(window.location.search).get('session');
		const qs = s && s !== '0' ? `?session=${s}` : '';
		history.pushState(null, '', `${qs}#/${pollCode}`);
		setSession({ pollCode, displayName, autoShare: isCreator, isHost: isCreator });
	}

	if (session) {
		return (
			<PollPage
				pollCode={session.pollCode}
				displayName={session.displayName}
				autoShare={session.autoShare}
				isHost={session.isHost}
				onSetName={(name) => {
					writeStoredDisplayName(name);
					setSession((s) => s ? { ...s, displayName: name } : s);
				}}
				onLeave={() => {
					const session = new URLSearchParams(window.location.search).get('session');
					const qs = session && session !== '0' ? `?session=${session}` : '';
					history.pushState(null, '', `${qs}#`);
					setSession(null);
				}}
			/>
		);
	}

	return <HomePage onJoin={handleJoin} initialCode={null} initialName={readStoredDisplayName()} />;
}

export default App
