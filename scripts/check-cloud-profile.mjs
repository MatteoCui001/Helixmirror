const deployProfile = process.env.DEPLOY_PROFILE || 'local';

if (deployProfile !== 'cloud') {
  console.log('DEPLOY_PROFILE is not cloud. Skip cloud profile checks.');
  process.exit(0);
}

const requiredEnv = ['API_TOKEN', 'NEXT_PUBLIC_APP_URL'];
const optionalButRecommended = ['DATABASE_PATH', 'API_CORS_ORIGIN'];

const missing = requiredEnv.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Cloud profile check failed. Missing required env: ${missing.join(', ')}`);
  process.exit(1);
}

const missingRecommended = optionalButRecommended.filter((name) => !process.env[name]);
if (missingRecommended.length > 0) {
  console.warn(`Cloud profile warning. Missing recommended env: ${missingRecommended.join(', ')}`);
}

console.log('Cloud profile check passed.');
