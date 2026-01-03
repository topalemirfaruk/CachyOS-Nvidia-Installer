
interface DriverCardProps {
    id: string;
    name: string;
    version: string;
    description: string;
    repo: string;
    selected: boolean;
    onSelect: (id: string) => void;
    isProprietary: boolean;
    disabledVariant?: boolean; // For the "Disable Secondary" card
    darkMode: boolean; // Add dark mode prop
    labels: {
        driver: string;
        version: string;
        description: string;
        repo: string;
    };
    disableText?: string;
}

export default function DriverCard({ id, name, version, description, repo, selected, onSelect, isProprietary, disabledVariant, darkMode, labels, disableText }: DriverCardProps) {
    return (
        <div
            onClick={() => onSelect(id)}
            className={`
                group relative flex items-center p-3 mb-1 rounded-r-xl cursor-pointer transition-all duration-300 transform border-l-[4px]
                ${disabledVariant ? 'opacity-75' : 'hover:opacity-80'}
                ${selected
                    ? `border-cyan-500 ${darkMode ? 'bg-cyan-900/10' : 'bg-cyan-50/50'}`
                    : `border-transparent bg-transparent`
                }
                ${darkMode ? 'text-gray-200' : 'text-gray-800'}
            `}
        >
            {/* Radio Input */}
            <div className="mr-3 flex-shrink-0">
                {disabledVariant ? (
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onSelect(id)}
                        className="w-5 h-5 rounded border-gray-300 text-gray-500 focus:ring-gray-400"
                    />
                ) : (
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'border-cyan-500' : 'border-gray-400'}`}>
                        {selected && <div className="w-3 h-3 rounded-full bg-cyan-500" />}
                    </div>
                )}
            </div>

            {/* GPU Graphic - Mimicking the card image */}
            <div className="mr-4 relative flex-shrink-0">
                {/* Vertical bracket line */}
                <div className="absolute -left-2 top-0 bottom-0 w-3 border-l-2 border-b-2 border-gray-400 rounded-bl-md h-full" style={{ top: '10%' }}></div>

                <div className="w-24 h-12 bg-gray-700 rounded flex items-center justify-between px-2 shadow-sm relative overflow-hidden">
                    <span className="text-[10px] font-bold text-gray-300 z-10">{disabledVariant ? 'RT' : 'RTX'}</span>
                    {/* Fan Icon */}
                    <div className={`w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center ${disabledVariant ? 'opacity-50' : 'animate-spin-slow'}`}>
                        <div className="w-6 h-6 border-4 border-t-transparent border-gray-400 rounded-full"></div>
                    </div>

                    {/* Red X for disabled */}
                    {disabledVariant && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg className="w-10 h-10 text-red-600 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Details */}
            {disabledVariant ? (
                <div className="flex-1">
                    <span className={`font-medium text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{disableText}</span>
                </div>
            ) : (
                <div className="flex-1 text-[13px] leading-tight">
                    <div><span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{labels.driver}</span> <span className={`${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{name}</span></div>
                    <div><span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{labels.version}</span> <span className={`${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{version}</span></div>
                    <div>
                        <span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{labels.description}</span>
                        <span className={`ml-1 font-medium ${isProprietary ? 'text-blue-500' : 'text-green-500'}`}>{description}</span>
                    </div>
                    <div><span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{labels.repo}</span> <span className={`${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{repo}</span></div>
                </div>
            )}
        </div>
    );
}
