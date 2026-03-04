import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';

// Add TypeScript support for webkitSpeechRecognition
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export function useSpeechRecognition() {
    const {
        isRecording,
        setIsRecording,
        setInterimTranscript,
        addFinalSegment
    } = useStore();

    const recognitionRef = useRef<any>(null);
    const isRecordingRef = useRef(isRecording);

    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Speech recognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-TW'; // Default to zh-TW with auto-detect fallback if needed by OS

        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            setInterimTranscript(interim);

            if (final) {
                addFinalSegment({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    text: final.trim(),
                    isFinal: true,
                });
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setIsRecording(false);
            }
        };

        recognition.onend = () => {
            // Auto-restart if still recording (handles natural pauses/timeouts)
            if (isRecordingRef.current && recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    console.error("Failed to restart recognition:", e);
                }
            } else {
                setIsRecording(false);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [addFinalSegment, setInterimTranscript, setIsRecording]);

    const toggleRecording = useCallback(() => {
        if (!recognitionRef.current) return;

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            setInterimTranscript('');
        } else {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (e) {
                console.error("Start error", e);
            }
        }
    }, [isRecording, setIsRecording, setInterimTranscript]);

    return { toggleRecording };
}
