const { spawn } = require('child_process');
require('dotenv').config()

const processNum = parseInt(process.argv[2])
const fromIndex = parseInt(process.argv[3])
for (let i = (0 + fromIndex); i < (processNum + fromIndex); i++) {
  const test = spawn('npx', ['hardhat', 'test', '--grep', process.argv[4], '--network', process.argv[5], '--config', 'hardhat.config.perf.js'],
    {
      env: {
        ...process.env,
        INITIALINDEX: `${Number(process.env.INITIALINDEX) + i * Number(process.env.COUNT)}`,
        FORCE_COLOR: true
      }
    });
  test.stdout.on('data', (data) => {
    console.log(`${data}`);
  });
  test.stderr.on('data', (data) => {
    console.error(`${data}`);
  });
  test.on('close', (code) => {
    if (code != 0) {
      console.log(`child_process_${i} exited with code ${code}`);
    }
  });
}


