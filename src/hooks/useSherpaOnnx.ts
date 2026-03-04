import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '../store/useStore';

declare global {
    interface Window {
        Module: any;
        createOnlineRecognizer: (module: any) => any;
    }
}

export function useSherpaOnnx() {
    const {
        isRecording,
        setIsRecording,
        setInterimTranscript,
        addFinalSegment
    } = useStore();

    const [isReady, setIsReady] = useState(false);
    const [statusText, setStatusText] = useState('Loading...');

    const recognizerRef = useRef<any>(null);
    const recognizerStreamRef = useRef<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const recorderRef = useRef<ScriptProcessorNode | any>(null);

    const checkReady = useCallback(() => {
        if (window.createOnlineRecognizer && window.Module && window.Module.isReady && window.Module._SherpaOnnxCreateOnlineRecognizer) {
            if (!recognizerRef.current) {
                try {
                    recognizerRef.current = window.createOnlineRecognizer(window.Module);
                    setIsReady(true);
                    setStatusText('Ready');
                    console.log("Sherpa Recognizer Created. Handle is:", recognizerRef.current.handle);
                } catch (e) {
                    console.log("Not yet ready");
                }
            }
        }
    }, []);

    useEffect(() => {
        // Listen to Emscripten loading wrapper events
        const handleStatus = (e: any) => setStatusText(e.detail);
        const handleReady = () => checkReady();

        window.addEventListener('sherpa-status', handleStatus);
        window.addEventListener('sherpa-ready', handleReady);

        // Initial check in case it loaded fast
        checkReady();

        return () => {
            window.removeEventListener('sherpa-status', handleStatus);
            window.removeEventListener('sherpa-ready', handleReady);
        };
    }, [checkReady]);

    const downsampleBuffer = (buffer: Float32Array, recordSampleRate: number, exportSampleRate: number) => {
        if (exportSampleRate === recordSampleRate) {
            return buffer;
        }
        const sampleRateRatio = recordSampleRate / exportSampleRate;
        const newLength = Math.round(buffer.length / sampleRateRatio);
        const result = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;
        while (offsetResult < result.length) {
            const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
            let accum = 0, count = 0;
            for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
                accum += buffer[i];
                count++;
            }
            result[offsetResult] = accum / count;
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
        }
        return result;
    };

    const startAudioProcessing = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new AudioContext({ sampleRate: 16000 });
            audioCtxRef.current = audioCtx;

            const recordSampleRate = audioCtx.sampleRate;
            const expectedSampleRate = 16000;

            const mediaStream = audioCtx.createMediaStreamSource(stream);
            mediaStreamRef.current = mediaStream;

            const bufferSize = 4096;
            const numberOfInputChannels = 1;
            const numberOfOutputChannels = 2;

            let recorder;
            if (audioCtx.createScriptProcessor) {
                recorder = audioCtx.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
            } else {
                recorder = (audioCtx as any).createJavaScriptNode(bufferSize, numberOfInputChannels, numberOfOutputChannels);
            }
            recorderRef.current = recorder;

            let lastResultStr = '';

            recorder.onaudioprocess = (e: AudioProcessingEvent) => {
                let samples = e.inputBuffer.getChannelData(0) as any as Float32Array;
                samples = downsampleBuffer(samples, recordSampleRate, expectedSampleRate);

                if (!recognizerStreamRef.current && recognizerRef.current) {
                    recognizerStreamRef.current = recognizerRef.current.createStream();
                }

                const recStream = recognizerStreamRef.current;
                const rec = recognizerRef.current;

                if (!rec || !recStream) return;

                recStream.acceptWaveform(expectedSampleRate, samples);
                while (rec.isReady(recStream)) {
                    rec.decode(recStream);
                }

                const isEndpoint = rec.isEndpoint(recStream);
                let resultText = rec.getResult(recStream).text;

                if (resultText && resultText !== lastResultStr) {
                    lastResultStr = resultText;
                    setInterimTranscript(resultText);
                }

                if (isEndpoint) {
                    if (lastResultStr) {
                        addFinalSegment({
                            id: Date.now().toString(),
                            text: lastResultStr.trim(),
                            isFinal: true
                        });
                        lastResultStr = '';
                        setInterimTranscript('');
                    }
                    rec.reset(recStream);
                }
            };

            mediaStream.connect(recorder);
            recorder.connect(audioCtx.destination);

            setIsRecording(true);
        } catch (err) {
            console.error("Audio recording error:", err);
            setIsRecording(false);
        }
    };

    const toggleRecording = useCallback(async () => {
        if (!isReady) {
            console.warn("Sherpa not ready yet.");
            return; // We could alert the user or show the loading state nicely.
        }

        if (isRecording) {
            // Stop recording
            if (recorderRef.current && audioCtxRef.current && mediaStreamRef.current) {
                recorderRef.current.disconnect(audioCtxRef.current.destination);
                mediaStreamRef.current.disconnect(recorderRef.current);
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close();
            }
            setIsRecording(false);
            setInterimTranscript('');

            // Check if there is trailing transcript to flush
            if (recognizerRef.current && recognizerStreamRef.current) {
                const resultText = recognizerRef.current.getResult(recognizerStreamRef.current).text;
                if (resultText) {
                    addFinalSegment({
                        id: Date.now().toString(),
                        text: resultText.trim(),
                        isFinal: true
                    });
                }
                recognizerRef.current.reset(recognizerStreamRef.current);
            }

        } else {
            // Start recording
            await startAudioProcessing();
        }
    }, [isRecording, isReady, setIsRecording, setInterimTranscript, addFinalSegment]);

    return { toggleRecording, isReady, statusText };
}
