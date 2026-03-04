import { CreateMLCEngine, type InitProgressCallback } from "@mlc-ai/web-llm";

// We use Phi-3.5 or Llama-3-8B-Instruct depending on hardware, 
// let's stick to a robust and widely supported 1.5B ~ 3B model for fast web inference.
// "Llama-3.2-1B-Instruct-q4f16_1-MLC" is very performant in-browser.
const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

let enginePromise: Promise<any> | null = null;

const PROMPT_TEMPLATE = `
You are an expert transcriber and note-taker. Your task is to process a raw transcript from a speech recognition engine.
The input is likely in Taiwanese Mandarin and may contain homophone errors (e.g., '或是' vs '火勢').

Please perform the following transformations:
1. Fixer: Correct any Taiwanese-specific homophones or transcription errors.
2. Note Synthesizer: Transform the raw text into a well-structured digital note.
3. Smart Highlight: Identify 'Key Insights' and wrap them in a <mark> tag.
4. Smart Indentation: Group related sentences into bullet points or nested lists based on semantic flow.
5. Formatting: Output strict Markdown. Use # for main title and ## for sections.

Input Transcript:
"{TRANSCRIPT}"

Output only the synthesized markdown note, nothing else.
`;

export async function getWebLLMEngine(onProgress?: InitProgressCallback) {
    if (!enginePromise) {
        enginePromise = CreateMLCEngine(SELECTED_MODEL, { initProgressCallback: onProgress });
    }
    return enginePromise;
}

export async function synthesizeNoteWithLocalModel(
    transcript: string,
    onProgress?: InitProgressCallback
): Promise<string> {
    if (!transcript.trim()) return '';

    try {
        const engine = await getWebLLMEngine(onProgress);

        const prompt = PROMPT_TEMPLATE.replace('{TRANSCRIPT}', transcript);

        const messages = [
            { role: "user", content: prompt }
        ];

        // We use chat completion API from WebLLM
        const reply = await engine.chat.completions.create({
            messages,
            temperature: 0.2, // Low temperature for deterministic note-taking
        });

        return reply.choices[0].message.content || '';
    } catch (err) {
        console.error("WebLLM Generation Error:", err);
        throw err;
    }
}
