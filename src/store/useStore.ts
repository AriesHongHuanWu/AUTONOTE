import { create } from 'zustand';

interface TranscriptSegment {
    id: string;
    text: string;
    isFinal: boolean;
}

interface AppState {
    isRecording: boolean;
    setIsRecording: (isRecording: boolean) => void;

    interimTranscript: string;
    setInterimTranscript: (text: string) => void;

    finalSegments: TranscriptSegment[];
    addFinalSegment: (segment: TranscriptSegment) => void;
    updateFinalSegment: (id: string, newText: string) => void;

    aiCorrectionsEnabled: boolean;
    setAiCorrectionsEnabled: (enabled: boolean) => void;

    apiMode: 'custom' | 'server' | 'local';
    setApiMode: (mode: 'custom' | 'server' | 'local') => void;

    serverApiUrl: string;
    setServerApiUrl: (url: string) => void;

    apiKey: string;
    setApiKey: (key: string) => void;

    isSynthesizing: boolean;
    setIsSynthesizing: (is: boolean) => void;

    aiSynthesizedNote: string | null;
    setAiSynthesizedNote: (note: string | null) => void;

    activeTab: 'recording' | 'notes';
    setActiveTab: (tab: 'recording' | 'notes') => void;

    clearState: () => void;
}

export const useStore = create<AppState>((set) => ({
    isRecording: false,
    setIsRecording: (isRecording) => set({ isRecording }),

    interimTranscript: '',
    setInterimTranscript: (text) => set({ interimTranscript: text }),

    finalSegments: [],
    addFinalSegment: (segment) => set((state) => ({
        finalSegments: [...state.finalSegments, segment]
    })),
    updateFinalSegment: (id, newText) => set((state) => ({
        finalSegments: state.finalSegments.map((seg) =>
            seg.id === id ? { ...seg, text: newText } : seg
        )
    })),

    aiCorrectionsEnabled: true,
    setAiCorrectionsEnabled: (enabled) => set({ aiCorrectionsEnabled: enabled }),

    apiMode: (localStorage.getItem('api_mode') as 'custom' | 'server' | 'local') || 'custom',
    setApiMode: (mode) => {
        localStorage.setItem('api_mode', mode);
        set({ apiMode: mode });
    },

    serverApiUrl: localStorage.getItem('server_api_url') || '/api/synthesize',
    setServerApiUrl: (url) => {
        localStorage.setItem('server_api_url', url);
        set({ serverApiUrl: url });
    },

    apiKey: localStorage.getItem('gemini_api_key') || '',
    setApiKey: (key) => {
        localStorage.setItem('gemini_api_key', key);
        set({ apiKey: key });
    },

    isSynthesizing: false,
    setIsSynthesizing: (is) => set({ isSynthesizing: is }),

    aiSynthesizedNote: null,
    setAiSynthesizedNote: (note) => set({ aiSynthesizedNote: note }),

    activeTab: 'recording',
    setActiveTab: (tab) => set({ activeTab: tab }),

    clearState: () => set({
        interimTranscript: '',
        finalSegments: [],
        aiSynthesizedNote: null,
        isRecording: false,
        activeTab: 'recording'
    }),
}));
