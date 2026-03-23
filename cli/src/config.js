import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.config', 'mdrop');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function loadConfig() {
	if (!existsSync(CONFIG_FILE)) {
		throw new Error('mdrop is not configured. Run `mdrop init` first.');
	}

	const raw = readFileSync(CONFIG_FILE, 'utf-8');
	const config = JSON.parse(raw);

	if (!config.workerUrl || !config.apiKey) {
		throw new Error('Invalid config. Run `mdrop init` to reconfigure.');
	}

	return config;
}

export function saveConfig(config) {
	mkdirSync(CONFIG_DIR, { recursive: true });
	writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
}

export function configExists() {
	return existsSync(CONFIG_FILE);
}
