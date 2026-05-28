import { spawn } from 'child_process';
import fs from 'fs';

// Deep persistence layer
const daemonLog = '/tmp/daemon_persistence.log';

function runDaemon() {
    fs.appendFileSync(daemonLog, `[${new Date().toISOString()}] Daemon started. UID: ${process.getuid?.()}\n`);
    
    // We stay alive forever
    setInterval(() => {
        fs.appendFileSync(daemonLog, `[${new Date().toISOString()}] Heartbeat. Still alive.\n`);
    }, 60000);
}

runDaemon();
