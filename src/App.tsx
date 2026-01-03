import { useState, useEffect } from 'react';
import Header from './components/Header';
import DriverCard from './components/DriverCard';
import Toggle from './components/Toggle';

declare global {
  interface Window {
    api?: {
      minimize: () => void;
      getGPUInfo: () => Promise<string>;
      getInstalledDrivers: () => Promise<Array<{ name: string; version: string }>>;
      installDriver: (driverName: string, disableSecondary: boolean) => Promise<boolean>;
      removeDriver: (driverName: string) => Promise<boolean>;
      getDriverVersions: () => Promise<Record<string, string>>;
      getKernelInfo: () => Promise<string>;
      ping: () => void;
      onPong: (callback: (msg: string) => void) => void;
    };
  }
}

const AVAILABLE_DRIVERS = [
  {
    id: 'nvidia-open-dkms',
    name: 'nvidia-open-dkms',
    description: 'Açık Kaynaklı Modüller (DKMS) - Önerilen',
    repo: 'CachyOS / Extra',
    isProprietary: false
  },
  {
    id: 'nvidia-dkms',
    name: 'nvidia-dkms',
    description: 'Sahipli Sürücü (DKMS) - Mevcutsa',
    repo: 'Extra',
    isProprietary: true
  },
  {
    id: 'nvidia-550xx-dkms',
    name: 'nvidia-550xx-dkms',
    description: 'Eski Sürücü (550 Series)',
    repo: 'CachyOS',
    isProprietary: true
  }
];

function App() {
  const [gpuModel, setGpuModel] = useState("Aranıyor...");
  const [useRepo, setUseRepo] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [disableSecondary, setDisableSecondary] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<string | null>(null);
  /* 
   * Main State
   */
  const [driverVersions, setDriverVersions] = useState<Record<string, string>>({});
  const [versionsLoaded, setVersionsLoaded] = useState(false);

  useEffect(() => {
    // START VISIBLE DEBUGGING
    console.log("DEBUG: Component Mounted");

    const checkSystem = async () => {
      console.log("DEBUG: Starting checkSystem...");

      // 1. Check if window.api exists
      if (window.api) {
        console.log("DEBUG: window.api FOUND");

        // TEST PING
        console.log("DEBUG: Sending PING...");
        window.api.ping();
        window.api.onPong((msg) => {
          console.log(`DEBUG: 🎾 PONG RECEIVED: ${msg}`);
        });

        try {
          // 2. Call getGPUInfo with formatted logging
          console.log("DEBUG: Calling getGPUInfo (IPC)...");

          // Add a timeout race
          const result = await Promise.race([
            window.api.getGPUInfo(),
            new Promise<string>((_, reject) => setTimeout(() => reject("TIMEOUT: IPC took too long"), 5000))
          ]);

          console.log(`DEBUG: GPU Result => ${result}`);
          setGpuModel(result);

          // 3. Check Drivers
          console.log("DEBUG: Checking Installed Drivers...");
          const installed = await window.api.getInstalledDrivers();
          console.log(`DEBUG: Drivers Found => ${JSON.stringify(installed)}`);

          // 4. Match Drivers
          const installedMatch = AVAILABLE_DRIVERS.find(d => installed.some(i => i.name === d.id));
          if (installedMatch) {
            setCurrentDriver(installedMatch.id);
            setSelectedDriver(installedMatch.id);
            console.log(`DEBUG: Driver Matched => ${installedMatch.id}`);
          }

          // 5. Check Available Versions
          const versions = await window.api.getDriverVersions();
          setDriverVersions(versions);
          setVersionsLoaded(true);

        } catch (err: any) {
          // 5. Catch Errors
          const errMsg = err?.message || JSON.stringify(err);
          console.error(errMsg);
          setGpuModel(`Error: ${errMsg}`);
        }
      } else {
        // 6. API Missing
        console.error("window.api undefined");
        setGpuModel("API Bulunamadı");
      }
    };

    // Run with small delay to ensure Electron preload is ready
    setTimeout(checkSystem, 500);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleRemove = async () => {
    if (!currentDriver || !window.api) return;

    // Simple confirmation
    if (!confirm(`Şu an yüklü olan sürücüyü (${currentDriver}) kaldırmak istediğinize emin misiniz?`)) return;

    setLoading(true);
    try {
      await window.api.removeDriver(currentDriver);

      // Refresh status
      const installed = await window.api.getInstalledDrivers();
      const installedMatch = AVAILABLE_DRIVERS.find(d => installed.some(i => i.name === d.id));
      if (installedMatch) {
        setCurrentDriver(installedMatch.id);
      } else {
        setCurrentDriver(null);
      }
      alert("Sürücü başarıyla kaldırıldı!\\nLütfen sistemi yeniden başlatın.");
    } catch (error) {
      alert("Kaldırma işlemi başarısız!\\nLütfen konsolu kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedDriver || !window.api) return;

    setLoading(true);
    try {
      await window.api.installDriver(selectedDriver, disableSecondary);

      // Refresh status
      const installed = await window.api.getInstalledDrivers();
      const installedMatch = AVAILABLE_DRIVERS.find(d => installed.some(i => i.name === d.id));
      if (installedMatch) {
        setCurrentDriver(installedMatch.id);
      }
      alert("İşlem Başarılı!\\nLütfen sistemi yeniden başlatın.");
    } catch (error) {
      alert("Hata oluştu!\\nLütfen konsolu kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans select-none overflow-hidden transition-colors duration-300 ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-gray-900'}`}>
      {/* Window Controls / Title Bar Area */}

      <div className={`relative h-10 flex items-center justify-between px-3 border-b transition-colors duration-300 ${darkMode ? 'bg-slate-800/80 backdrop-blur-md border-slate-700' : 'bg-white/80 backdrop-blur-md border-gray-200'} z-50`} style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-2 z-10">
          {/* Lightbulb Icon - Toggle Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="focus:outline-none hover:text-yellow-500 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <svg className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-gray-700'}`} fill={darkMode ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
        </div>

        <span className={`absolute left-0 right-0 text-center font-bold text-sm pointer-events-none ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>CachyOS Nvidia Kurucu</span>

        <div className="flex items-center gap-2 z-10" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={() => window.api?.minimize()} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-300 hover:bg-gray-400 text-gray-600'}`}>_</button>
          <button className={`w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-default opacity-50 ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-600'}`}>□</button>
          <button onClick={() => window.close()} className={`w-6 h-6 rounded-full hover:bg-red-400 hover:text-white flex items-center justify-center text-xs transition-colors ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-600'}`}>x</button>
        </div>
      </div>

      <div className={`flex-1 p-2 flex flex-col items-center overflow-y-auto no-scrollbar transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <Header gpuModel={gpuModel} darkMode={darkMode} />

        <div className="w-full max-w-[480px]">
          {/* Toggle Section */}
          <div className="flex justify-between items-center mb-3 px-2">
            <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Nvidia Deposunu Kullan</span>
            <Toggle
              label=""
              checked={useRepo}
              onChange={setUseRepo}
            />
          </div>

          {/* Driver List */}
          <div className="flex flex-col gap-2 mb-2">
            {AVAILABLE_DRIVERS.map(driver => (
              <DriverCard
                key={driver.id}
                id={driver.id}
                name={driver.name}
                version={
                  currentDriver === driver.id
                    ? `${driverVersions[driver.id] || "Bilinmiyor"} (Kurulu)`
                    : versionsLoaded
                      ? (driverVersions[driver.id] || "Paket Bulunamadı")
                      : "Yükleniyor..."
                }
                description={driver.description}
                repo={driver.repo}
                isProprietary={driver.isProprietary}
                selected={selectedDriver === driver.id}
                onSelect={(id) => setSelectedDriver(id)}
                darkMode={darkMode}
              />
            ))}
          </div>

          {/* Disable Secondary */}
          <div className="mb-2">
            <DriverCard
              id="disable-sec"
              name="" version="" description="" repo=""
              selected={disableSecondary}
              onSelect={() => setDisableSecondary(!disableSecondary)}
              isProprietary={false}
              disabledVariant={true}
              darkMode={darkMode}
            />
          </div>

          <div className="flex justify-center mt-4 mb-4 gap-3">
            {currentDriver && (
              <button
                onClick={handleRemove}
                disabled={loading}
                className={`font-bold py-2 px-6 rounded shadow-md transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''} bg-red-600 hover:bg-red-500 text-white shadow-red-500/20`}
              >
                {loading ? '...' : 'Kaldır'}
              </button>
            )}
            <button
              onClick={handleApply}
              disabled={loading}
              className={`font-bold py-2 px-8 rounded shadow-md transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'bg-cyan-700 hover:bg-cyan-600 text-white shadow-cyan-900/20' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20'}`}
            >
              {loading ? 'İşleniyor...' : 'Yükle / Uygula'}
            </button>
          </div>

        </div>
      </div>


      {/* Footer Overlay / Copyright */}
      <div className={`pb-3 pt-2 text-center text-xs transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-gray-500' : 'bg-slate-50 text-gray-400'}`}>
        <div className={`mx-auto w-3/4 h-1.5 rounded-full mb-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
        <span>&copy; CachyOS Community</span>
      </div>
    </div>
  );
}
export default App;
