import { useRef, useCallback } from 'react';

export function useAudioRecorder() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = { mimeType: 'audio/webm' };

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
        } catch (error) {
            console.error('Error starting audio recording:', error);
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const mediaRecorder = mediaRecorderRef.current;
            if (!mediaRecorder) {
                resolve(null);
                return;
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Clean up tracks
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                resolve(audioBlob);
            };

            if (mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            } else {
                resolve(null);
            }
        });
    }, []);

    return { startRecording, stopRecording };
}
