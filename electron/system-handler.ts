import { IpcMain } from 'electron';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export function setupSystemHandlers(ipcMain: IpcMain) {
    console.log("Setting up system handlers..."); // DEBUG LOG
    // 1. Get GPU Information
    ipcMain.handle('get-gpu-info', async () => {
        console.log("IPC: get-gpu-info called"); // DEBUG LOG
        try {
            // DEBUG: Return mock immediately to test IPC connectivity
            return "NVIDIA GeForce RTX 4090 [DEBUG]";

            /* 
            // Real Logic (Commented out for debug)
            const { stdout } = await execPromise('lspci -mm | grep -i nvidia | grep -i "vga\\|3d" | head -n 1');
            
            if (!stdout) return "NVIDIA GPU Not Found";

            const parts = stdout.match(/"([^"]+)"/g);
            if (parts && parts.length >= 4) {
                return parts[3].replace(/"/g, ''); 
            }
            return "Unknown NVIDIA GPU";
            */
        } catch (error) {
            console.error('Failed to get GPU info:', error);
            return "Error Detecting GPU";
        }
    });

    // 2. Get Installed Drivers
    ipcMain.handle('get-installed-drivers', async () => {
        try {
            // Check for specific packages we care about
            const packages = [
                'nvidia-dkms', 'nvidia', 'nvidia-lts', 'nvidia-open', 'nvidia-open-dkms',
                'xf86-video-nouveau', 'nvidia-utils', 'nvidia-settings'
            ];

            // pacman -Q returns exit code 1 if package not found, so we check individually or catch error
            // Better: pacman -Qs nvidia to get all installed related
            const { stdout } = await execPromise('pacman -Qs nvidia');
            return stdout.split('\n').filter((line: string) => line.startsWith('local/')).map((line: string) => {
                const parts = line.split(' ');
                return {
                    name: parts[0].replace('local/', ''),
                    version: parts[1]
                };
            });
        } catch (error) {
            // pacman returns error if nothing found matching
            return [];
        }
    });

    // 3. Get Kernel Info (to help decide between dkms/lts/etc)
    ipcMain.handle('get-kernel-info', async () => {
        try {
            const { stdout } = await execPromise('uname -r');
            return stdout.trim();
        } catch (error) {
            return "Unknown Kernel";
        }
    });

    // 4. Install/Remove Driver
    ipcMain.handle('install-driver', async (_event, driverName) => {
        try {
            // Use pkexec for Privilege Escalation
            // --noconfirm: automatic yes to prompts
            // --needed: don't reinstall if up to date
            const command = `pkexec pacman -S --noconfirm --needed ${driverName} nvidia-settings`;
            console.log(`Executing: ${command}`);
            await execPromise(command);
            return true;
        } catch (error) {
            console.error('Install failed:', error);
            throw error; // Frontend should handle specific error messages
        }
    });

    ipcMain.handle('remove-driver', async (_event, driverName) => {
        try {
            // -Rns: Remove package, its configuration, and unneeded dependencies
            const command = `pkexec pacman -Rns --noconfirm ${driverName}`;
            console.log(`Executing: ${command}`);
            await execPromise(command);
            return true;
        } catch (error) {
            console.error('Removal failed:', error);
            throw error;
        }
    });
}
