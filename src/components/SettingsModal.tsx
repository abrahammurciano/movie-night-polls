import { Button } from '@/components/ui/button';
import type { CreatePollSettings } from '@/lib/pollSettings';

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
		</div>
	);
}
