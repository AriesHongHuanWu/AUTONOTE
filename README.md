# AutoNote

A browser note-taker that transcribes speech on-device and turns the raw transcript into a structured
Markdown note.

Live captions from a streaming recogniser are unreadable as notes: no punctuation, no paragraphs, no
structure, and in Mandarin a steady trickle of homophone errors. AutoNote splits the problem in two.
A WebAssembly speech recogniser runs in the tab and produces an editable transcript with no audio
leaving the machine. Then a language model rewrites that transcript into a titled, sectioned,
bullet-pointed note with key insights highlighted, and the model can be a hosted API or a second model
running locally in the same browser.

The prompt is written for Taiwanese Mandarin specifically, and asks the model to repair
speech-recognition homophone confusions before restructuring anything.

## How it works

### Speech recognition in the browser

The recogniser is [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) compiled to WebAssembly, using
the bilingual Chinese/English streaming zipformer build.

`index.html` sets up the Emscripten module before React mounts. `Module.locateFile` redirects the
`.wasm` and `.data` payloads to a Hugging Face Space, so the model bundle (roughly 200MB of packed
data plus an 11MB `.wasm`) is not served from the app's own origin. `Module.setStatus` parses
Emscripten's `"Downloading... (loaded/total)"` strings into a percentage that is re-emitted as a
`sherpa-status` CustomEvent, and `onRuntimeInitialized` fires `sherpa-ready`.

`src/hooks/useSherpaOnnx.ts` listens for those two events, constructs the recogniser once the runtime
is up, and drives the audio loop:

1. `getUserMedia` then an `AudioContext` requested at 16kHz, with a `ScriptProcessorNode` of 4096
   samples as the pump.
2. `downsampleBuffer` resamples by block-averaging to exactly 16kHz, because the browser is free to
   ignore the requested `sampleRate` and hand back 44.1 or 48kHz.
3. Each block goes to `stream.acceptWaveform`, then `while (recognizer.isReady(stream)) decode(stream)`
   drains everything the decoder can consume.
4. `getResult().text` becomes the live interim transcript. When `isEndpoint(stream)` fires, the text is
   committed as a final segment, the interim line clears, and the stream resets.

`src/hooks/useAudioRecorder.ts` runs a `MediaRecorder` in parallel on a second microphone stream so the
raw WebM audio can be downloaded when recording stops. `public/sw.js` is a small hand-written service
worker that caches the four heavy model URLs, so the download cost is paid only on first visit.

### Transcript to note

Final segments render as `contentEditable` paragraphs; editing one and blurring writes back through
`updateFinalSegment`, so recogniser errors can be fixed by hand before synthesis. Pressing
**Synthesize** joins the segments and sends them to whichever backend is selected in Settings.

| Mode | File | Behaviour |
|---|---|---|
| `custom` | `src/lib/gemini.ts` | Calls Gemini directly from the browser with a key the user pastes into Settings, kept in localStorage |
| `server` | `functions/api/synthesize.ts` | POSTs the transcript to a Cloudflare Pages Function that holds `GEMINI_API_KEY` as an environment binding, so the key never reaches the client |
| `local` | `src/lib/webllm.ts` | Runs `Llama-3.2-1B-Instruct-q4f16_1-MLC` in the browser through WebLLM, with load progress surfaced in the button label |

All three send the same five-step instruction: fix Taiwanese Mandarin homophones, restructure into a
note, wrap key insights in `<mark>`, group related sentences into nested lists, and emit strict
Markdown. The result renders with `react-markdown` plus `remark-gfm`, with heading components mapped
to a handwriting typeface so the output reads as a page of notes rather than a chat reply.

State lives in a single Zustand store (`src/store/useStore.ts`); the API mode, key and server URL are
mirrored into localStorage on write.

## Tech stack

React 19, TypeScript, Vite 7, Tailwind CSS 4, Zustand, Framer Motion, react-markdown, remark-gfm,
lucide-react. sherpa-onnx WebAssembly for recognition, `@mlc-ai/web-llm` for in-browser generation,
`@google/generative-ai` for the hosted path, Cloudflare Pages Functions for the server path.

## Getting started

```bash
npm install
npm run dev
npm run build     # tsc -b && vite build
npm run lint
```

No configuration is needed for transcription: the model streams from the CDN on first run and is
cached by the service worker afterwards. Watch the status line under the microphone button, since the
record control stays inert until the runtime reports ready.

For note synthesis, open Settings and pick a mode. `API Key` mode wants a Google AI Studio key.
`Local` mode needs a WebGPU-capable browser and downloads the quantised Llama weights on first use.
`Server` mode only works on a deployment that provides the `/api/synthesize` function with a
`GEMINI_API_KEY` binding.

`scripts/download-web-model.js` and `scripts/download-wasm.js` fetch the sherpa-onnx WASM bundle from
GitHub releases for self-hosting instead of using the CDN.

## Status and limitations

A prototype, seven commits deep. It works end to end, and it is not production software.

- No tests, no error boundaries. A failed synthesis surfaces as an `alert()`.
- `ScriptProcessorNode` is deprecated in favour of `AudioWorklet`. It still works everywhere but runs
  the resampling on the main thread.
- Two separate microphone streams are opened, one for the recogniser and one for the `MediaRecorder`.
  One stream feeding both would be correct.
- Notes are not persisted. A refresh loses the transcript and the synthesised note. Getting anything
  out means using the copy, Markdown download or WebM audio download before closing the tab.
- `src/hooks/useSpeechRecognition.ts` is a Web Speech API implementation that predates the sherpa-onnx
  path and is no longer imported anywhere.
- The repository still carries a local copy of the WASM bundle under
  `sherpa-onnx-wasm-simd-v1.12.28-zh-en-asr-zipformer/` and `public/`, plus `app-asr-bundle.js`, left
  over from before delivery moved to the CDN. The large `.data` payload is tracked with Git LFS.
- Recognition quality is whatever the upstream bilingual zipformer model gives. Nothing here has been
  measured, and there are no accuracy numbers to quote.

## License

MIT. See [LICENSE](LICENSE).
