import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

let isLoaded = false;

function loadLocalEnv() {
  if (isLoaded) return;
  isLoaded = true;

  const cwd = process.cwd();
  const envFiles = ['.env.local', '.env'];

  for (const fileName of envFiles) {
    const filePath = path.join(cwd, fileName);
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  }
}

export function getGeminiApiKey() {
  loadLocalEnv();
  return process.env.GEMINI_API_KEY?.trim() || '';
}
