#!/usr/bin/env node

const {spawn, exec} = require("child_process");
const path = require("path");
const readline = require("readline");

// Create interface for reading stdin
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Store processes
let frontendProcess = null;
let backendProcess = null;

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgBlue: "\x1b[34m",
    fgMagenta: "\x1b[35m",
    fgCyan: "\x1b[36m",
};

// Function to log with colors
function log(message, color = colors.reset) {
    console.log(
        `${color}[${new Date().toLocaleTimeString()}] ${message}${colors.reset}`
    );
}

// Function to start frontend dev server
function startFrontend() {
    if (frontendProcess) {
        log("Frontend process is already running", colors.fgYellow);
        return;
    }

    log("Starting frontend dev server...", colors.fgCyan);

    frontendProcess = spawn("npm", ["run", "dev"], {
        cwd: path.join(__dirname, "web"),
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
    });

    frontendProcess.stdout.on("data", (data) => {
        process.stdout.write(`${colors.fgBlue}[FRONTEND]${colors.reset} ${data}`);
    });

    frontendProcess.stderr.on("data", (data) => {
        process.stderr.write(`${colors.fgBlue}[FRONTEND]${colors.reset} ${data}`);
    });

    frontendProcess.on("close", (code) => {
        log(
            `Frontend process exited with code ${code}`,
            code === 0 ? colors.fgGreen : colors.fgRed
        );
        frontendProcess = null;
    });

    frontendProcess.on("error", (error) => {
        log(`Frontend process error: ${error.message}`, colors.fgRed);
    });

    // Handle Windows process termination
    if (process.platform === "win32") {
        frontendProcess.on("exit", () => {
            frontendProcess = null;
        });
    }
}

// Function to start backend server
function startBackend() {
    if (backendProcess) {
        log("Backend process is already running", colors.fgYellow);
        return;
    }

    log(`Starting backend server..., cwd: ${__dirname}`, colors.fgMagenta);

    // Use go run cmd/main.go to start the backend
    backendProcess = spawn("go", ["run", "./cmd"], {
        cwd: `${__dirname}/server`,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
    });

    backendProcess.stdout.on("data", (data) => {
        process.stdout.write(`${colors.fgMagenta}[BACKEND]${colors.reset} ${data}`);
    });

    backendProcess.stderr.on("data", (data) => {
        process.stderr.write(`${colors.fgMagenta}[BACKEND]${colors.reset} ${data}`);
    });

    backendProcess.on("close", (code) => {
        log(
            `Backend process exited with code ${code}`,
            code === 0 ? colors.fgGreen : colors.fgRed
        );
        backendProcess = null;
    });

    backendProcess.on("error", (error) => {
        log(`Backend process error: ${error.message}`, colors.fgRed);
    });

    // Handle Windows process termination
    if (process.platform === "win32") {
        backendProcess.on("exit", () => {
            backendProcess = null;
        });
    }
}

// Function to restart frontend
function restartFrontend() {
    log("Restarting frontend dev server...", colors.fgCyan);
    if (frontendProcess) {
        if (process.platform === "win32") {
            // On Windows, we need to kill the process tree
            spawn("taskkill", ["/pid", frontendProcess.pid, "/f", "/t"]);
        } else {
            frontendProcess.kill("SIGTERM");
        }
        // Give it a moment to properly terminate
        setTimeout(() => {
            startFrontend();
        }, 1000);
    } else {
        startFrontend();
    }
}

// Function to restart backend
function restartBackend() {
    log("Restarting backend server...", colors.fgMagenta);
    if (backendProcess) {
        if (process.platform === "win32") {
            // On Windows, we need to kill the process tree
            spawn("taskkill", ["/pid", backendProcess.pid, "/f", "/t"]);
        } else {
            backendProcess.kill("SIGTERM");
        }
        // Give it a moment to properly terminate
        setTimeout(() => {
            startBackend();
        }, 1000);
    } else {
        startBackend();
    }
}

// Handle user input
rl.on("line", (input) => {
    const command = input.trim().toLowerCase();

    switch (command) {
        case "w":
            restartFrontend();
            break;
        case "s":
            restartBackend();
            break;
        case "q":
            log("Shutting down servers...", colors.fgYellow);
            if (frontendProcess) {
                if (process.platform === "win32") {
                    spawn("taskkill", ["/pid", frontendProcess.pid, "/f", "/t"]);
                } else {
                    frontendProcess.kill("SIGTERM");
                }
            }
            if (backendProcess) {
                if (process.platform === "win32") {
                    spawn("taskkill", ["/pid", backendProcess.pid, "/f", "/t"]);
                } else {
                    backendProcess.kill("SIGTERM");
                }
            }
            // Give processes time to terminate before exiting
            setTimeout(() => {
                process.exit(0);
            }, 1000);
            break;
        case "h":
        case "help":
            showHelp();
            break;
        default:
            if (command) {
                log(`Unknown command: ${command}. Type 'h' for help.`, colors.fgYellow);
            }
    }
});

// Show help information
function showHelp() {
    console.log(`
${colors.bright}Available Commands:${colors.reset}
  ${colors.fgCyan}w${colors.reset} - Restart frontend dev server (npm run dev)
  ${colors.fgMagenta}s${colors.reset} - Restart backend server (go run main.go)
  ${colors.fgYellow}q${colors.reset} - Quit all servers
  ${colors.fgGreen}h${colors.reset} or ${colors.fgGreen}help${colors.reset} - Show this help message
  `);
}

// Graceful shutdown on Ctrl+C
process.on("SIGINT", () => {
    log("\nReceived SIGINT. Shutting down...", colors.fgYellow);
    if (frontendProcess) {
        if (process.platform === "win32") {
            spawn("taskkill", ["/pid", frontendProcess.pid, "/f", "/t"]);
        } else {
            frontendProcess.kill("SIGTERM");
        }
    }
    if (backendProcess) {
        if (process.platform === "win32") {
            spawn("taskkill", ["/pid", backendProcess.pid, "/f", "/t"]);
        } else {
            backendProcess.kill("SIGTERM");
        }
    }
    // Give processes time to terminate before exiting
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

// Start both servers
log("Starting development servers...", colors.fgGreen);
log('Press "h" for help.', colors.fgGreen);
startFrontend();
startBackend();
