import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const apiDockerfile = read('Dockerfile.api');
const frontendDockerfile = read('Dockerfile.frontend');
const compose = read('docker-compose.yml');
const nginx = read('nginx.conf');
const dockerignore = read('.dockerignore');
const packageJson = JSON.parse(read('package.json'));

assert(apiDockerfile.includes('RUN npm run build:backend'), 'Dockerfile.api must build the backend bundle.');
assert(
  apiDockerfile.includes('/app/dist-backend/server ./dist-backend/server'),
  'Dockerfile.api must copy dist-backend/server from the builder image.',
);
assert(
  apiDockerfile.includes('CMD ["node", "dist-backend/server/boot.js"]'),
  'Dockerfile.api must start dist-backend/server/boot.js.',
);
assert(!apiDockerfile.includes('dist/server'), 'Dockerfile.api must not reference dist/server.');

assert(frontendDockerfile.includes('RUN npm run build'), 'Dockerfile.frontend must build the static frontend.');
assert(
  frontendDockerfile.includes('/app/dist /usr/share/nginx/html'),
  'Dockerfile.frontend must copy the frontend dist directory to nginx html.',
);

assert(compose.includes('dockerfile: Dockerfile.frontend'), 'docker-compose.yml must build the frontend Dockerfile.');
assert(compose.includes('dockerfile: Dockerfile.api'), 'docker-compose.yml must build the API Dockerfile.');
assert(compose.includes('DATABASE_URL: mysql://radshield:radshield@db:3306/radshield_mx_test'), 'compose must wire API to test MySQL.');
assert(compose.includes('condition: service_healthy'), 'compose API must wait for a healthy DB.');
assert(!compose.includes('drizzle-kit migrate'), 'compose must not run migrations implicitly.');

assert(nginx.includes('try_files $uri $uri/ /index.html;'), 'nginx.conf must preserve SPA fallback.');
assert(nginx.includes('location /assets/'), 'nginx.conf must include static asset cache rules.');

assert(/^dist$/m.test(dockerignore), '.dockerignore must exclude dist.');
assert(/^dist-backend$/m.test(dockerignore), '.dockerignore must exclude dist-backend.');
assert(/^node_modules$/m.test(dockerignore), '.dockerignore must exclude node_modules.');

assert(
  packageJson.scripts?.start === 'NODE_ENV=production node dist-backend/server/boot.js',
  'package.json start script must point to dist-backend/server/boot.js.',
);
assert(packageJson.scripts?.['build:backend'] === 'node scripts/build-backend.mjs', 'build:backend script is missing.');
assert(packageJson.scripts?.['db:preflight'] === 'node scripts/db-preflight.mjs', 'db:preflight script is missing.');

console.log('Deploy config checks OK');
