/**
 * set_vercel_env.js
 * 
 * Securely configures Vercel environment variables from local .cloud-env without printing secrets.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const cloudEnvPath = path.resolve(__dirname, '..', '.cloud-env');
if (!fs.existsSync(cloudEnvPath)) {
  console.error('Error: .cloud-env not found. Please create .cloud-env or run setup_cloud_env.ps1 first.');
  process.exit(1);
}

const envVars = {};
fs.readFileSync(cloudEnvPath, 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > -1) {
      envVars[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
});

const requiredVars = {
  DB_HOST: envVars.CLOUD_DB_HOST,
  DB_PORT: envVars.CLOUD_DB_PORT || '4000',
  DB_USER: envVars.CLOUD_DB_USER,
  DB_PASSWORD: envVars.CLOUD_DB_PASSWORD,
  DB_NAME: 'ppro',
  DB_SSL: 'true',
  DB_SSL_REJECT_UNAUTHORIZED: 'true',
  SIM_DB_NAME: 'placementpro_simulation'
};

const environments = ['preview', 'production', 'development'];

console.log('Configuring Vercel environment variables for TiDB Cloud connection...\n');

for (const [key, value] of Object.entries(requiredVars)) {
  if (!value) {
    console.error(`Skipping ${key} (no value found).`);
    continue;
  }
  for (const env of environments) {
    // Remove old value if exists
    spawnSync('npx', ['vercel', 'env', 'rm', key, env, '-y'], { stdio: 'ignore', shell: true });
    // Add new value
    const addRes = spawnSync('npx', ['vercel', 'env', 'add', key, env], {
      input: value + '\n',
      shell: true,
      encoding: 'utf8'
    });
    if (addRes.status === 0) {
      console.log(`✓ Set ${key} for [${env}]`);
    } else {
      console.log(`Notice for ${key} [${env}]:`, addRes.stderr?.trim() || 'added');
    }
  }
}

console.log('\n✓ Vercel environment variables configuration complete.');
