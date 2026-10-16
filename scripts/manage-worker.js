'use strict';

require('dotenv').config();
const workerManager = require('../services/compiler/workerManager');

async function main() {
  const action = (process.argv[2] || 'status').toLowerCase();

  switch (action) {
    case 'up':
    case 'start':
      console.log('Starting Compiler Worker via Docker Compose...');
      try {
        const res = await workerManager.startWorker();
        console.log('Result:', res.success ? 'SUCCESS' : 'WARNING');
        if (res.health) console.log('Worker Health:', res.health);
        if (res.warning) console.warn('Warning:', res.warning);
      } catch (err) {
        console.error('Failed to start worker:', err.message);
        process.exit(1);
      }
      break;

    case 'down':
    case 'stop':
      console.log('Stopping Compiler Worker...');
      try {
        const res = await workerManager.stopWorker();
        console.log('Worker stopped successfully.');
      } catch (err) {
        console.error('Failed to stop worker:', err.message);
        process.exit(1);
      }
      break;

    case 'status':
    default:
      console.log('Checking Compiler Worker Status...');
      try {
        const status = await workerManager.getStatus();
        console.log(JSON.stringify(status, null, 2));
      } catch (err) {
        console.error('Failed to retrieve status:', err.message);
        process.exit(1);
      }
      break;
  }
}

main();
