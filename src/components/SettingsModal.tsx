import { Button } from '@/components/ui/button';

interface Props {
	isOpen: boolean;
	onClose: () => void;
	maxNominationsPerUser: number;
	onChange: (settings: { maxNominationsPerUser: number }) => void;
}

export function SettingsModal({ isOpen, onClose, maxNominationsPerUser, onChange }: Props) {
	if (!isOpen) return null;

	function handleChange(value: string) {
		const parsed = parseInt(value);
		if (isNaN(parsed)) return;
		onChange({ maxNominationsPerUser: Math.min(20, Math.max(1, parsed)) });
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
							value={maxNominationsPerUser}
							onChange={(e) => handleChange(e.target.value)}
						/>
						<p className="text-[11px] text-muted-foreground">
							How many movies can each person nominate?
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
