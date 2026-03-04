import type { ReactNode } from 'react';
import { useState } from 'react';
import { Settings, Download, Trash2, Wand2, Copy } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { useStore } from '../store/useStore';
import { synthesizeNoteWithGemini, synthesizeNoteWithServer } from '../lib/gemini';
import { synthesizeNoteWithLocalModel } from '../lib/webllm';

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const {
        finalSegments,
        setAiSynthesizedNote,
        setIsSynthesizing,
        apiKey,
        aiCorrectionsEnabled,
        isSynthesizing,
        aiSynthesizedNote,
        clearState,
        apiMode,
        serverApiUrl,
        setActiveTab
    } = useStore();

    const [loadingText, setLoadingText] = useState("Synthesizing...");

    const handleSynthesize = async () => {
        if (!aiCorrectionsEnabled) return alert("AI corrections are disabled.");

        if (apiMode === 'custom' && !apiKey) {
            setIsSettingsOpen(true);
            return;
        }

        if (apiMode === 'server' && !serverApiUrl) {
            setIsSettingsOpen(true);
            return;
        }

        const fullTranscript = finalSegments.map(s => s.text).join(" ");
        if (!fullTranscript.trim()) return;

        setIsSynthesizing(true);
        setLoadingText("Synthesizing...");
        try {
            let synthesized = '';
            if (apiMode === 'local') {
                synthesized = await synthesizeNoteWithLocalModel(fullTranscript, (progress) => {
                    setLoadingText(progress.text);
                });
            } else if (apiMode === 'server') {
                synthesized = await synthesizeNoteWithServer(fullTranscript, serverApiUrl);
            } else {
                synthesized = await synthesizeNoteWithGemini(fullTranscript, apiKey);
            }
            setAiSynthesizedNote(synthesized);
            setActiveTab('notes');
        } catch (err) {
            console.error(err);
            alert("Failed to synthesize note.");
        } finally {
            setIsSynthesizing(false);
        }
    };

    const handleClear = () => {
        if (confirm("Are you sure you want to clear your notes?")) {
            clearState();
        }
    };

    const handleExport = () => {
        const textToExport = aiSynthesizedNote || finalSegments.map(s => s.text).join('\n\n');
        if (!textToExport) return;

        const blob = new Blob([textToExport], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AutoNote_${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopy = async () => {
        const textToExport = aiSynthesizedNote || finalSegments.map(s => s.text).join('\n\n');
        if (!textToExport) return;
        try {
            await navigator.clipboard.writeText(textToExport);
            alert("Copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8">
            {/* Top Navigation / App Bar */}
            <header className="w-full max-w-4xl glass rounded-xl p-4 mb-6 flex justify-between items-center z-10 sticky top-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                        A
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">AutoNote</h1>
                </div>

                <div className="flex items-center gap-2">
                    {finalSegments.length > 0 && (
                        <button
                            onClick={handleSynthesize}
                            disabled={isSynthesizing}
                            className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-full hover:bg-primary/20 transition-colors flex items-center gap-2 max-w-[300px]"
                            aria-label="Synthesize Note"
                        >
                            <Wand2 size={16} className="shrink-0" />
                            <span className="truncate">{isSynthesizing ? loadingText : "Synthesize Note"}</span>
                        </button>
                    )}

                    <button onClick={handleCopy} className="p-2 rounded-full hover:bg-surface-variant transition-colors" aria-label="Copy Note">
                        <Copy size={20} className="text-on-surface-variant" />
                    </button>
                    <button onClick={handleExport} className="p-2 rounded-full hover:bg-surface-variant transition-colors" aria-label="Export Markdown">
                        <Download size={20} className="text-on-surface-variant" />
                    </button>
                    <button onClick={handleClear} className="p-2 rounded-full hover:bg-surface-variant transition-colors" aria-label="Clear Note">
                        <Trash2 size={20} className="text-on-surface-variant" />
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-full hover:bg-surface-variant transition-colors"
                        aria-label="Settings"
                    >
                        <Settings size={20} className="text-on-surface-variant" />
                    </button>
                </div>
            </header>

            {/* Main Content Area (Paper-like) */}
            <main className="w-full max-w-4xl flex-1 glass rounded-2xl shadow-sm p-6 sm:p-10 mb-24 relative overflow-hidden">
                {children}
            </main>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
