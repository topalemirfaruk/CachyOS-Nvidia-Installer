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
      const { stdout } = await execPromise("lspci -mm | grep -E 'VGA|3D' -i");
      console.log("LSPCI RAW Output:", stdout);

      const lines = stdout.trim().split('\n');
      if (lines.length === 0) return "GPU Bulunamadı";

      // 1. Find the NVIDIA line
      const nvidiaLine = lines.find(line => line.toLowerCase().includes('nvidia')) || lines[0];

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
  ipcMain.handle('get-installed-drivers', async () => {
    try {
      const { stdout } = await execPromise('pacman -Qs nvidia');
      return stdout.split('\n')
        .filter((line: string) => line.startsWith('local/'))
        .map((line: string) => {
          const parts = line.split(' ');
          return {
            name: parts[0].replace('local/', ''),
            version: parts[1]
          };
        });
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle('install-driver', async (_event, driverName) => {
    try {
      // TODO: Enable real install when ready
      console.log(`MOCK INSTALL REQUESTED: ${driverName}`);
      await new Promise(r => setTimeout(r, 2000));
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  });

  ipcMain.handle('remove-driver', async () => true);
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
