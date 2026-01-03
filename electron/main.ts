import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log("DEBUG: __dirname:", __dirname);
  console.log("DEBUG: Preload Path:", preloadPath);

  mainWindow = new BrowserWindow({
    width: 550,
    height: 820,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    autoHideMenuBar: true,
    title: 'CachyOS Nvidia Driver Manager',
    backgroundColor: '#f3f4f6',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

function setupHandlers() {
  // PING HANDLER
  ipcMain.on('ping', (event, arg) => {
    if (event.sender && !event.sender.isDestroyed()) {
      event.sender.send('pong', 'PONG-BACK');
    }
  });

  // REAL GPU INFO
  ipcMain.handle('get-gpu-info', async () => {
    try {
      // Force C locale to ensure consistent output format (avoids locale-specific headers)
      const { stdout } = await execPromise("LC_ALL=C lspci -mm | grep -E 'VGA|3D' -i");
      console.log("LSPCI RAW Output:", stdout);

      const lines = stdout.trim().split('\n');
      if (lines.length === 0) return "GPU Bulunamadı";

      // 1. Find the NVIDIA line using Regex (safer than toLowerCase in Turkish locale)
      const nvidiaLine = lines.find(line => /nvidia/i.test(line)) || lines[0];

      // 2. Extract friendly name from brackets [GeForce RTX 4090]
      // Format usually: 00:00.0 "VGA" "Vendor" "Device [Friendly Name]"
      const bracketMatch = nvidiaLine.match(/\[([^\]]+)\]/);

      if (bracketMatch && bracketMatch[1]) {
        return bracketMatch[1]; // Return ONLY "GeForce RTX 4050 Max-Q / Mobile"
      }

      // 3. Fallback: Parse quotes if no brackets
      const parts = nvidiaLine.match(/"([^"]*)"/g)?.map(s => s.replace(/"/g, ''));
      if (parts && parts.length >= 3) {
        return `${parts[1]} ${parts[2]}`; // Vendor + Device
      }

      return nvidiaLine.replace(/\"/g, '');
    } catch (error: any) {
      console.error('Failed to get GPU info:', error);
      return `Hata: ${error.message}`;
    }
  });

  // REAL INSTALLED DRIVERS CHECK
  // Definition of Logical Drivers and their possible system packages
  const DRIVER_ALIASES: Record<string, string[]> = {
    'nvidia-open-dkms': ['nvidia-open-dkms', 'linux-cachyos-nvidia-open', 'linux-cachyos-lts-nvidia-open', 'linux-cachyos-bore-nvidia-open', 'nvidia-open'],
    'nvidia-dkms': ['nvidia-dkms', 'linux-cachyos-nvidia', 'linux-cachyos-lts-nvidia', 'nvidia'],
    'nvidia-550xx-dkms': ['nvidia-550xx-dkms', 'nvidia-550xx-utils']
  };

  ipcMain.handle('get-installed-drivers', async () => {
    const installed = [];

    // Check each logical driver type
    for (const [id, aliases] of Object.entries(DRIVER_ALIASES)) {
      // Check if ANY alias is installed
      for (const pkg of aliases) {
        try {
          const cmd = `LC_ALL=C pacman -Q ${pkg}`;
          await execPromise(cmd); // throws if not found

          // If found, push the LOGICAL ID (so frontend selects the right card)
          installed.push({ name: id, version: 'Detected' });
          break; // Found one alias for this type, no need to check others
        } catch (e) {
          // continue
        }
      }
    }
    return installed;
  });

  ipcMain.handle('remove-driver', async (_event, driverName) => {
    try {
      console.log(`REMOVE REQUESTED: ${driverName}`);

      // Resolve logical ID to potential real packages
      const aliases = DRIVER_ALIASES[driverName] || [driverName];

      // Find which ones are actually installed
      const toRemove = [];
      for (const pkg of aliases) {
        try {
          await execPromise(`pacman -Q ${pkg}`);
          toRemove.push(pkg);
        } catch (e) { }
      }

      if (toRemove.length === 0) {
        throw new Error("Sürücü paketi sistemde bulunamadı.");
      }

      const removeCmd = `pkexec pacman -Rns ${toRemove.join(' ')} --noconfirm`;
      console.log(`REMOVING: ${toRemove.join(' ')}`);
      await execPromise(removeCmd);
      return true;
    } catch (err: any) {
      console.error("REMOVE FAILED:", err);
      throw new Error(err.message || "Removal failed");
    }
  });

  ipcMain.handle('get-driver-versions', async () => {
    const packages = ['nvidia-open-dkms', 'nvidia-dkms', 'nvidia-550xx-dkms'];
    const versionMap: Record<string, string> = {};

    await Promise.all(packages.map(async (pkg) => {
      try {
        // Force English output and query individually
        const cmd = `LC_ALL=C pacman -Si ${pkg}`;
        const { stdout } = await execPromise(cmd);

        // Parse Version
        const lines = stdout.split('\n');
        const versionLine = lines.find(line => line.trim().startsWith('Version'));
        if (versionLine) {
          const parts = versionLine.split(':');
          if (parts.length >= 2) {
            versionMap[pkg] = parts[1].trim();
          }
        }
      } catch (error: any) {
        // Package not found or other error - just ignore and return nothing for this package
        console.log(`Package ${pkg} check failed (might not be in repo):`, error.message);
      }
    }));

    return versionMap;
  });

  ipcMain.handle('install-driver', async (_event, driverName, disableSecondary) => {
    try {
      console.log(`INSTALL REQUESTED: ${driverName}, DisableSecondary: ${disableSecondary}`);

      // 1. Install Driver
      // using --noconfirm for non-interactive mode. pkexec will prompt for auth.
      // We might want to remove 'local/' prefix if it comes from our internal check, but here driverName comes from UI which uses clean IDs.
      const installCmd = `pkexec pacman -S ${driverName} --noconfirm`;
      console.log(`EXECUTING: ${installCmd}`);

      await execPromise(installCmd);

      // 2. Handle Secondary GPU Disabling (If requested)
      if (disableSecondary) {
        // TODO: Implement actual disable logic (udev rules or modprobe.d)
        console.log("TODO: Disabling Secondary GPU...");
        // Example: await execPromise(`pkexec bash -c 'echo "blacklist nouveau" > /etc/modprobe.d/blacklist-nouveau.conf'`);
      }

      return true;
    } catch (err: any) {
      console.error("INSTALL FAILED:", err);
      // Return error message to UI
      throw new Error(err.message || "Installation failed");
    }
  });


}

app.on('ready', () => {
  setupHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
