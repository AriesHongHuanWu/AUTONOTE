import { X } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const {
        apiKey,
        setApiKey,
        aiCorrectionsEnabled,
        setAiCorrectionsEnabled,
        apiMode,
        setApiMode,
        serverApiUrl,
        setServerApiUrl
    } = useStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-surface text-on-surface rounded-2xl shadow-xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-variant transition-colors"
                    aria-label="Close settings"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-semibold mb-6">Settings</h2>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2 mb-4">
                            <span className="block text-sm font-medium text-on-surface-variant">API Integration Mode</span>
                            <div className="flex bg-surface-variant/50 p-1 rounded-xl">
                                <button
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${apiMode === 'custom' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                                    onClick={() => setApiMode('custom')}
                                >
                                    API Key
                                </button>
                                <button
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${apiMode === 'server' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                                    onClick={() => setApiMode('server')}
                                >
                                    Server
                                </button>
                                <button
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${apiMode === 'local' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                                    onClick={() => setApiMode('local')}
                                >
                                    Local AI
                                </button>
                            </div>
                        </div>

                        {apiMode === 'local' ? (
                            <div className="animate-in fade-in duration-200 bg-primary/10 p-4 rounded-xl border border-primary/20">
                                <h3 className="text-sm font-semibold text-primary mb-2">100% Private & Offline</h3>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    Notes will be synthesized entirely on your device using WebGPU and a local Llama-3 model.
                                    <br /><br />
                                    <strong>Note:</strong> The first time you generate a note, your browser will download a ~1.5GB AI model. Subsequent generations will be instant and require zero internet connection.
                                </p>
                            </div>
                        ) : apiMode === 'custom' ? (
                            <div className="animate-in fade-in duration-200">
                                <label htmlFor="apiKey" className="block text-sm font-medium mb-2 text-on-surface-variant">
                                    Google Gemini API Key
                                </label>
                                <input
                                    id="apiKey"
                                    type="password"
                                    className="w-full px-4 py-2 border border-surface-variant rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="AIzaSy..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <p className="mt-2 text-xs text-on-surface-variant">
                                    Required for AI note synthesis. Your key is stored securely in your browser's local storage.
                                </p>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-200">
                                <label htmlFor="serverUrl" className="block text-sm font-medium mb-2 text-on-surface-variant">
                                    Server API Endpoint (Cloudflare Pages)
                                </label>
                                <input
                                    id="serverUrl"
                                    type="text"
                                    className="w-full px-4 py-2 border border-surface-variant rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="/api/synthesize"
                                    value={serverApiUrl}
                                    onChange={(e) => setServerApiUrl(e.target.value)}
                                />
                                <p className="mt-2 text-xs text-on-surface-variant">
                                    Leave as "/api/synthesize" to use the built-in Cloudflare Pages function. The API key will be read from the edge environment variable.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium">AI Corrections & Post-Processing</h3>
                            <p className="text-xs text-on-surface-variant">Enable Gemini 3.1 Flash integration</p>
                        </div>
                        <button
                            onClick={() => setAiCorrectionsEnabled(!aiCorrectionsEnabled)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${aiCorrectionsEnabled ? 'bg-primary' : 'bg-surface-variant'
                                }`}
                            role="switch"
                            aria-checked={aiCorrectionsEnabled}
                        >
                            <span
                                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${aiCorrectionsEnabled ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
