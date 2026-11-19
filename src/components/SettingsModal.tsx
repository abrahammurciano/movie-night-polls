import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CreatePollSettings } from '@/lib/pollSettings';
import { VOTING_METHODS } from '@/lib/voting';
import type { VotingMethod } from '@/types';

interface Props {
	isOpen: boolean;
	onClose: () => void;
	settings: CreatePollSettings;
	onChange: (settings: CreatePollSettings) => void;
}

const DEADLINE_OPTIONS: Array<{ minutes: number; label: string }> = [
	{ minutes: 60, label: '1 hour' },
	{ minutes: 720, label: '12 hours' },
	{ minutes: 1440, label: '1 day' },
	{ minutes: 4320, label: '3 days' },
	{ minutes: 10080, label: '1 week (default)' },
	{ minutes: 20160, label: '2 weeks' },
];

export function SettingsModal({ isOpen, onClose, settings, onChange }: Props) {
	const [methodHelp, setMethodHelp] = useState<VotingMethod | null>(null);

	if (!isOpen) return null;

	function handleMaxNominations(value: string) {
		const parsed = parseInt(value);
		if (isNaN(parsed)) return;
		onChange({ ...settings, maxNominationsPerUser: Math.min(20, Math.max(1, parsed)) });
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 py-14 pointer-events-auto"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
		>
			<div
				className="glass-card w-full max-w-sm p-6 shadow-2xl pointer-events-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="mb-6 text-2xl font-bold tracking-tight">Poll Settings</h2>

				<div className="space-y-4">
					<div className="space-y-2">
						<label
							className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
							htmlFor="maxNominations"
						>
							Max nominations per user
						</label>
						<input
							id="maxNominations"
							type="number"
							min="1"
							max="20"
							className="cinema-input"
							value={settings.maxNominationsPerUser}
							onChange={(e) => handleMaxNominations(e.target.value)}
						/>
						<p className="text-[11px] text-muted-foreground">
							How many movies can each person nominate?
						</p>
					</div>

					<div className="space-y-2">
						<label
							className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
							htmlFor="deadline"
						>
							Voting deadline
						</label>
						<select
							id="deadline"
							className="cinema-input"
							value={settings.deadlineMinutes}
							onChange={(e) => onChange({ ...settings, deadlineMinutes: parseInt(e.target.value) })}
						>
							{DEADLINE_OPTIONS.map((option) => (
								<option key={option.minutes} value={option.minutes}>
									{option.label}
								</option>
							))}
						</select>
						<p className="text-[11px] text-muted-foreground">
							Voting closes automatically this long after the poll is created.
						</p>
					</div>

					<div className="space-y-2">
						<p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
							Voting method
						</p>
						<ul className="space-y-2">
							{(Object.keys(VOTING_METHODS) as VotingMethod[]).map((method) => {
								const meta = VOTING_METHODS[method];
								const selected = settings.votingMethod === method;
								return (
									<li key={method}>
										<div
											role="button"
											tabIndex={0}
											className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
											style={{
												background: selected ? 'oklch(0.8 0.12 295 / 0.12)' : 'oklch(1 0 0 / 0.04)',
												border: selected ? '1px solid oklch(0.8 0.12 295 / 0.45)' : '1px solid oklch(1 0 0 / 0.08)',
											}}
											onClick={() => onChange({ ...settings, votingMethod: method })}
											onKeyDown={(e) => e.key === 'Enter' && onChange({ ...settings, votingMethod: method })}
										>
											<span
												className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
												style={{ border: '2px solid oklch(0.8 0.12 295)' }}
											>
												{selected && (
													<span
														className="h-2 w-2 rounded-full"
														style={{ background: 'oklch(0.8 0.12 295)' }}
													/>
												)}
											</span>
											<span className="min-w-0 flex-1">
												<span className="block text-sm font-medium">{meta.name}</span>
												<span className="block text-[11px] leading-snug text-muted-foreground">
													{meta.brief}
												</span>
											</span>
											<button
												className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors"
												style={{
													background: 'oklch(0.8 0.12 295 / 0.15)',
													color: 'oklch(0.8 0.12 295)',
												}}
												title={`How ${meta.name} works`}
												aria-label={`How ${meta.name} works`}
												onClick={(e) => { e.stopPropagation(); setMethodHelp(method); }}
											>
												?
											</button>
										</div>
									</li>
								);
							})}
						</ul>
					</div>

					<p className="text-[11px] text-muted-foreground/70">
						Changes are saved automatically and become the defaults for your next polls.
					</p>

					<Button
						className="w-full rounded-xl font-semibold glow-amber"
						style={{ height: '2.625rem' }}
						onClick={onClose}
					>
						Done
					</Button>
				</div>
			</div>

			{methodHelp && (
				<div
					className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-8"
					onClick={() => setMethodHelp(null)}
				>
					<div
						className="glass-card w-full max-w-xs p-5 shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="mb-2 text-base font-semibold">{VOTING_METHODS[methodHelp].name}</h3>
						<p className="text-sm leading-relaxed text-muted-foreground">
							{VOTING_METHODS[methodHelp].details}
						</p>
						<Button
							className="mt-4 w-full rounded-xl font-semibold"
							style={{ height: '2.25rem' }}
							onClick={() => setMethodHelp(null)}
						>
							Got it
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
