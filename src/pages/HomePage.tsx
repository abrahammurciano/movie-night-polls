import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/SettingsModal';

interface Props {
	onJoin: (pollCode: string, displayName: string, isCreator: boolean) => void;
	initialCode?: string | null;
	initialName?: string | null;
}

interface PollSettings {
	maxNominationsPerUser: number;
}

const DEFAULT_SETTINGS: PollSettings = {
	maxNominationsPerUser: 1,
};

export function HomePage({ onJoin, initialCode, initialName }: Props) {
	const [name, setName] = useState(initialName ?? '');
	const [code, setCode] = useState(initialCode ?? '');
	const [settings, setSettings] = useState<PollSettings>(DEFAULT_SETTINGS);
	const [showSettingsModal, setShowSettingsModal] = useState(false);

	function handleCreate() {
		const newCode = Math.random().toString(36).slice(2, 8).toUpperCase();
		localStorage.setItem(`pollSettings.${newCode}`, JSON.stringify(settings));
		onJoin(newCode, name.trim(), true);
	}

	function handleJoin() {
		onJoin(code.trim().toUpperCase(), name.trim(), false);
	}

	const ready = name.trim().length > 0;

	return (
		<div className="flex min-h-svh flex-col items-center justify-center px-5 py-14">
			{/* Hero */}
			<div className="mb-10 flex flex-col items-center gap-4 text-center">
				<div
					className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
					style={{
						background: 'oklch(0.8 0.12 295 / 0.12)',
						boxShadow: '0 0 32px -8px oklch(0.8 0.12 295 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.08)',
						border: '1px solid oklch(0.8 0.12 295 / 0.22)',
					}}
				>
					🎬
				</div>

				<div>
					<h1
						className="text-4xl font-bold tracking-tight sm:text-5xl"
						style={{ letterSpacing: '-0.03em' }}
					>
						Movie Night Polls
					</h1>
					<p className="mt-1.5 text-sm text-muted-foreground">
						Ranked choice voting &middot; peer-to-peer &middot; no account needed
					</p>
				</div>
			</div>

			{/* Card */}
			<div className="glass-card w-full max-w-sm p-6 shadow-2xl">
				<div className="space-y-4">
					<div className="space-y-1.5">
						<label
							className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
							htmlFor="name"
						>
							Your name
						</label>
						<input
							id="name"
							className="cinema-input"
							placeholder="e.g. Alice"
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && ready && handleCreate()}
						/>
					</div>

					<div className="flex gap-2">
						<button
							className="flex-none rounded-xl border-2 border-foreground/50 bg-transparent px-4 text-sm font-medium text-foreground transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
							style={{ height: '2.625rem' }}
							onClick={() => setShowSettingsModal(true)}
						>
							Options
						</button>
						<Button
							className="flex-1 rounded-xl font-semibold glow-amber transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
							style={{ height: '2.625rem' }}
							disabled={!ready}
							onClick={handleCreate}
						>
							Create poll
						</Button>
					</div>

					<div className="flex gap-2 items-end">
						<div className="flex-1 space-y-1.5">
							<label
								className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
								htmlFor="code"
							>
								Poll code
							</label>
							<input
								id="code"
								className="cinema-input font-mono uppercase"
								style={{ letterSpacing: '0.18em' }}
								placeholder="ABC123"
								value={code}
								onChange={(e) => setCode(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && ready && code.trim() && handleJoin()}
							/>
						</div>
						<Button
							variant={code.trim() ? undefined : 'outline'}
							className={`rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${code.trim() ? 'font-semibold glow-amber' : 'border-foreground/50 font-medium text-foreground hover:bg-secondary hover:text-foreground'}`}
							style={{ height: '2.625rem' }}
							disabled={!ready || code.trim().length === 0}
							onClick={handleJoin}
						>
							Join
						</Button>
					</div>
				</div>
			</div>

			<SettingsModal
				isOpen={showSettingsModal}
				onClose={() => setShowSettingsModal(false)}
				maxNominationsPerUser={settings.maxNominationsPerUser}
				onSave={(newSettings) => setSettings(newSettings)}
			/>

			{/* Film strip decoration */}
			<div className="mt-10 flex items-center gap-1.5 opacity-[0.12]">
				{Array.from({ length: 9 }).map((_, i) => (
					<span
						key={i}
						className="block h-3 w-2 rounded-[2px] bg-foreground"
					/>
				))}
			</div>
		</div>
	);
}
