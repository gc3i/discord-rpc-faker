const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn, execSync } = require('child_process');
const DiscordRPC = require('discord-rpc');

const JSON_PATH = path.join(__dirname, 'detectablegames.json');
const DUMMY_RUNNER = path.join(__dirname, 'dummy_runner.exe');
const DUMMY_SRC = path.join(__dirname, 'dummy.cs');
const TEMP_PROCESS_DIR = path.join(__dirname, '.active_game');

if (!fs.existsSync(JSON_PATH)) {
    console.error('\x1b[31m[!] Error: detectablegames.json not found.\x1b[0m');
    process.exit(1);
}

const C = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    brightRed: '\x1b[91m',
    white: '\x1b[97m',
    gray: '\x1b[90m',
    darkGray: '\x1b[30;1m',
    bgRed: '\x1b[41m\x1b[97m\x1b[1m'
};

function printBanner() {
    console.clear();
    console.log(C.brightRed + `
 ▄▓▒░░▓█▄    ▄▓▒░░▒▓▄      ▄▄▓▓▒░░▓▄          ▄▄▓▒░░▀█▄     ▓▓▒▄       ▄▓▒▄     ▄       ▄▄▓▒░▓▀█▄  ▄▓▒░░▓█▄  
▄▀ ▄  ▀██▌  ▄▀ ▄  ▀██▌  ▄▀▓▒░▀▀ ▀▓█▀       ▄▀▓▒░▀▀ ▀▒▓▀   ▄▓▒░░░▓▄     ▐▒░▓▌   ▓▒░▄  ▄▀▓▒░▀▀ ▀▒▓▀ ▄▀ ▄  ▀██▌ 
  ▓▒▌ ▄█▀     ▓▒▌ ▄█▀  ▐▌▓▒░              ▐▐▓▒░          ▐▓▒░▓▀▀▒░▌     ░░▓    ▐░░▌ ▐▐▓▒░           ▓▒▌ ▄█▀  
  ▒░▄▓█▄      ▒░▄█▀     ▀▒▓                ▀▒░ ▄██▄     ▄▓▓░░▌  ▓██     ▓██▌  ▄█▒▀   ▀░░ ▄██▄       ▒░▄▓█▄   
■▄░░▌ ▀██▄  ■▄░░▌      ▄░░▌▀              ▄▓░░█▀▀  ▀    ▐▓▒░█▄██████▄   ▐███▄▀█▄    ▄░▓▒█▀▀  ▀    ■▄░░▌ ▀██▄ 
  ▓██  ▐██▌   ▒▓█       ░▒▓      ▄▄        ░█▒▌         ▐▒░█▀   ▓▓██▀■  ▄███   ▀█▄   ▓▒█▌     ▄▄    ▓██  ▐██▌
  ▐███▌ ███   ▐▓██▌       ▓██▄  ▄███▌      ▐███▄         ▓▒░█▌   ▒░██▌  █████▌ ▄███▌   ███▄  ▄███▌  ▐███▌ ███ 
  ▀█▀   ▀     ▀█▀         ▀▀█████▀▀       ▀███▄▀        ▀░█▀    ░░▓█▀   ▀██▀  ▀██▀     ▀▀█████▀▀    ▀█▀   ▀  
` + C.reset);
    console.log(`  [♥] Made by @gc3i with love and appriciation • only for bug report ofc!\n`);
}

function ensureDummyRunner() {
    if (fs.existsSync(DUMMY_RUNNER)) return true;

    const cscPaths = [
        'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
        'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe'
    ];

    const csc = cscPaths.find(p => fs.existsSync(p));
    if (!csc) {
        console.error(`${C.red}[-] C# compiler (csc.exe) not found.${C.reset}`);
        return false;
    }

    if (!fs.existsSync(DUMMY_SRC)) {
        const src = `using System;
using System.Drawing;
using System.Windows.Forms;

namespace GameLauncher {
    static class Program {
        [STAThread]
        static void Main(string[] args) {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string title = "Game";
            if (args.Length > 0 && !string.IsNullOrEmpty(args[0])) {
                title = args[0];
            }

            int durationSeconds = 300;
            if (args.Length > 1) {
                int s;
                if (int.TryParse(args[1], out s)) durationSeconds = s;
            }

            Form form = new Form();
            form.Text = title;
            form.Size = new Size(360, 160);
            form.StartPosition = FormStartPosition.CenterScreen;

            Label label = new Label();
            label.Text = title + "\\n\\n(Running in background)";
            label.Dock = DockStyle.Fill;
            label.TextAlign = ContentAlignment.MiddleCenter;
            label.Font = new Font("Segoe UI", 10, FontStyle.Regular);
            form.Controls.Add(label);

            var timer = new System.Windows.Forms.Timer();
            timer.Interval = Math.Max(1000, durationSeconds * 1000);
            timer.Tick += delegate(object sender, EventArgs e) {
                Application.Exit();
            };
            timer.Start();

            Application.Run(form);
        }
    }
}`;
        fs.writeFileSync(DUMMY_SRC, src, 'utf-8');
    }

    try {
        execSync(`"${csc}" /r:System.Windows.Forms.dll,System.Drawing.dll /target:winexe /out:"${DUMMY_RUNNER}" "${DUMMY_SRC}"`, { stdio: 'ignore' });
        return true;
    } catch (e) {
        console.error(`${C.red}[-] Error compiling runner: ${e.message}${C.reset}`);
        return false;
    }
}

const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
const allGames = JSON.parse(rawData);

function pickBestExecutable(game) {
    if (!game.executables || !Array.isArray(game.executables)) return null;
    const winExes = game.executables.filter(e => e.os === 'win32' && e.name && e.name.toLowerCase().endsWith('.exe'));
    if (winExes.length === 0) return null;

    const scored = winExes.map(e => {
        const rawName = e.name.replace(/\\/g, '/');
        const base = path.basename(rawName).toLowerCase();
        let score = 10;
        if (e.is_launcher) score -= 5;
        if (base.includes('server') || base.includes('dedicated') || base.includes('crash') || base.includes('unrealcef')) score -= 8;
        if (base.endsWith('_be.exe') || base.endsWith('_eac.exe')) score -= 4;
        if (base.includes('config') || base.includes('setup') || base.includes('installer') || base.includes('patch')) score -= 6;
        if (base === 'game.exe' || base === 'launcher.exe') score -= 3;

        const cleanGame = game.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanBase = base.replace(/[^a-z0-9]/g, '');
        if (cleanBase.includes(cleanGame) || cleanGame.includes(cleanBase)) score += 8;
        return { relPath: rawName, baseName: path.basename(rawName), score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0];
}

const processGames = allGames
    .filter(g => g.name && g.name.length > 1 && g.executables && g.executables.length > 0)
    .map(g => {
        const exeInfo = pickBestExecutable(g);
        return exeInfo ? { id: g.id, name: g.name, relExePath: exeInfo.relPath, exeName: exeInfo.baseName } : null;
    })
    .filter(Boolean);

function prepareTempDir() {
    if (!fs.existsSync(TEMP_PROCESS_DIR)) {
        fs.mkdirSync(TEMP_PROCESS_DIR, { recursive: true });
    }
}

function cleanTempDir() {
    try {
        if (fs.existsSync(TEMP_PROCESS_DIR)) {
            fs.rmSync(TEMP_PROCESS_DIR, { recursive: true, force: true });
            fs.mkdirSync(TEMP_PROCESS_DIR, { recursive: true });
        }
    } catch (e) {}
}

let currentChildProcess = null;
let currentExePath = null;

function killCurrentGame() {
    if (currentChildProcess) {
        try {
            currentChildProcess.kill('SIGKILL');
        } catch (e) {}
        currentChildProcess = null;
    }
    if (currentExePath && fs.existsSync(currentExePath)) {
        try {
            fs.unlinkSync(currentExePath);
        } catch (e) {}
        currentExePath = null;
    }
}

function cleanupAndExit() {
    killCurrentGame();
    cleanTempDir();
    process.exit(0);
}

process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);
process.on('exit', cleanupAndExit);

function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

async function startBadgeFarmer(durationSeconds = 5, maxGames = 0) {
    if (!ensureDummyRunner()) return;
    prepareTempDir();

    printBanner();
    console.log(`${C.bgRed} [★] BADGE FARMER ACTIVE ${C.reset} ${C.white}Targeting: Sampler & Game Variety Badges${C.reset}`);
    console.log(`${C.gray}-------------------------------------------------------------------------------------------------------------------${C.reset}`);
    console.log(`${C.brightRed}[*] Session Runtime per Game:${C.reset} ${C.white}${durationSeconds}s${durationSeconds >= 60 ? ` (${(durationSeconds / 60).toFixed(1)} mins)` : ''}${C.reset}`);
    console.log(`${C.brightRed}[*] Detection Status:${C.reset} ${C.white}Active (Discord Settings -> Registered Games)${C.reset}`);
    console.log(`${C.gray}[*] Press Ctrl+C anytime to stop and return to menu.${C.reset}\n`);

    const shuffled = shuffleArray(processGames);
    const totalToPlay = maxGames > 0 ? Math.min(maxGames, shuffled.length) : shuffled.length;
    let completedCount = 0;

    for (let i = 0; i < totalToPlay; i++) {
        const game = shuffled[i];
        killCurrentGame();
        cleanTempDir();

        const targetExe = path.join(TEMP_PROCESS_DIR, game.relExePath);
        try {
            fs.mkdirSync(path.dirname(targetExe), { recursive: true });
            fs.copyFileSync(DUMMY_RUNNER, targetExe);
        } catch (err) {
            continue;
        }

        currentExePath = targetExe;
        try {
            currentChildProcess = spawn(targetExe, [game.name, (durationSeconds + 5).toString()], {
                detached: false,
                stdio: 'ignore'
            });
        } catch (err) {
            console.error(`${C.red}[-] Error starting ${game.relExePath}:${C.reset}`, err.message);
            continue;
        }

        const gameNum = i + 1;

        await new Promise((resolve) => {
            let remaining = durationSeconds;
            
            const updateLine = () => {
                const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
                const secs = (remaining % 60).toString().padStart(2, '0');
                const percent = Math.floor(((durationSeconds - remaining) / durationSeconds) * 20);
                const bar = `${C.brightRed}${'█'.repeat(percent)}${C.gray}${'░'.repeat(20 - percent)}${C.reset}`;
                process.stdout.write(`\r${C.brightRed}[🎮 Game ${gameNum}/${totalToPlay}]${C.reset} ${C.white}${game.name}${C.reset} [${bar}] ${C.brightRed}${mins}:${secs}${C.reset} ${C.white}| Farmed: ${completedCount}${C.reset} `);
            };

            updateLine();

            const timer = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(timer);
                    process.stdout.write(`\r${C.brightRed}[✓ Completed #${gameNum}]${C.reset} ${C.white}${game.name}${C.reset} registered in Discord history! ${C.brightRed}(Total Farmed: ${completedCount + 1})${C.reset}\n`);
                    completedCount++;
                    resolve();
                } else {
                    updateLine();
                }
            }, 1000);
        });

        killCurrentGame();
        cleanTempDir();
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n${C.brightRed}[+] Badge farming session completed! Total games farmed: ${completedCount}${C.reset}`);
}

const args = process.argv.slice(2);

if (args.includes('--badge') || args.includes('-b')) {
    let seconds = 5;
    const secIdx = args.indexOf('--seconds');
    if (secIdx !== -1 && args[secIdx + 1]) {
        const parsed = parseInt(args[secIdx + 1], 10);
        if (!isNaN(parsed) && parsed > 0) seconds = parsed;
    }
    startBadgeFarmer(seconds);
} else {
    printBanner();
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    console.log(`   ${C.white}[1] Start Turbo Farmer (5 seconds per game - Ultra Fast)${C.reset}`);
    console.log(`   ${C.white}[2] Start Fast Farmer (30 seconds per game)${C.reset}`);
    console.log(`   ${C.white}[3] Start Standard Farmer (5 mins per game)${C.reset}`);
    console.log(`   ${C.white}[4] Start Custom Farmer (Custom seconds/minutes)${C.reset}`);
    console.log(`   ${C.white}[5] Exit${C.reset}\n`);
    console.log(`${C.brightRed}  ===================================================================================================================${C.reset}`);

    rl.question(`  ${C.brightRed}Enter your choice (1-5) [default 1]: ${C.reset}`, (opt) => {
        const choice = opt.trim() || '1';
        if (choice === '1') {
            rl.close();
            startBadgeFarmer(5);
        } else if (choice === '2') {
            rl.close();
            startBadgeFarmer(30);
        } else if (choice === '3') {
            rl.close();
            startBadgeFarmer(300);
        } else if (choice === '4') {
            rl.question(`\n  ${C.brightRed}Enter duration in seconds (e.g. 5, 10, 60): ${C.reset}`, (secs) => {
                rl.close();
                const s = parseInt(secs, 10) || 5;
                startBadgeFarmer(s);
            });
        } else {
            rl.close();
            process.exit(0);
        }
    });
}
