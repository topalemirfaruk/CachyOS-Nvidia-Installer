import { contextBridge, ipcRenderer } from 'electron';

console.log("DEBUG: Preload running...");

contextBridge.exposeInMainWorld('api', {
    getGPUInfo: () => ipcRenderer.invoke('get-gpu-info'),
    getInstalledDrivers: () => ipcRenderer.invoke('get-installed-drivers'),
    installDriver: (driverName: string, disableSecondary: boolean) => ipcRenderer.invoke('install-driver', driverName, disableSecondary),
    removeDriver: (driverName: string) => ipcRenderer.invoke('remove-driver', driverName),
    getDriverVersions: () => ipcRenderer.invoke('get-driver-versions'),

    // Debug Ping
    ping: () => {
        console.log("DEBUG: Sending PING from Preload...");
        ipcRenderer.send('ping', 'payload');
    },

    // Listen for Pong
    onPong: (callback: (msg: string) => void) => {
        ipcRenderer.on('pong', (_event, value) => callback(value));
    }
});
