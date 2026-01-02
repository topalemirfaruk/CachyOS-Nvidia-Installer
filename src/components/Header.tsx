import nvidiaLogo from '../assets/nvidia-logo.png';

export default function Header({ gpuModel, darkMode }: { gpuModel: string, darkMode: boolean }) {
    return (
        <div className={`flex flex-col items-center justify-center pt-3 pb-3 transition-colors duration-300 w-full px-4`}>
            {/* Logo Section */}
            <div className="flex items-center justify-center mb-2">
                <img
                    src={nvidiaLogo}
                    alt="NVIDIA Logo"
                    className="h-10 w-auto mr-2 object-contain"
                />
                <span className={`text-3xl font-black italic tracking-tighter ${darkMode ? 'text-gray-100' : 'text-black'}`}>
                    NVIDIA
                </span>
            </div>

            {/* Model Name - Wraps if too long */}
            <div className={`text-center font-bold tracking-wide break-words max-w-[90%] leading-snug ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {gpuModel}
            </div>
        </div>
    );
}
