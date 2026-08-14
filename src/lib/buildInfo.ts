export function parseDevPreviewId(basePath: string): string | null {
	const match = basePath.match(/\/dev\/(\d+)\/?$/);
	return match ? match[1] : null;
}

const basePath = import.meta.env.VITE_BASE_PATH ?? '/';
const devPreviewId = parseDevPreviewId(basePath);

export const buildInfo = {
	basePath,
	devPreviewId,
	isDevPreview: devPreviewId !== null,
	version: import.meta.env.VITE_APP_VERSION ?? 'local',
	displayVersion: `v${(import.meta.env.VITE_APP_VERSION ?? 'local').slice(0, 7)}`,
};
