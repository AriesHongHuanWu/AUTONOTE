import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT_TEMPLATE = `
You are an expert transcriber and note-taker. Your task is to process a raw transcript from a speech recognition engine.
The input is likely in Taiwanese Mandarin and may contain homophone errors (e.g., '或是' vs '火勢').

Please perform the following transformations:
1. Fixer: Correct any Taiwanese-specific homophones or transcription errors.
2. Note Synthesizer: Transform the raw text into a well-structured digital note.
3. Smart Highlight: Identify 'Key Insights' and wrap them in a <mark> tag.
4. Smart Indentation: Group related sentences into bullet points or nested lists based on semantic flow.
5. Formatting: Output strict Markdown (with the exception of <mark> tags). Use # for main title and ## for sections.

Input Transcript:
"{TRANSCRIPT}"

Output only the synthesized markdown note, nothing else.
`;

export async function synthesizeNoteWithGemini(transcript: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error('Gemini API Key is required');

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using the model requested by the user
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = PROMPT_TEMPLATE.replace('{TRANSCRIPT}', transcript);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

export async function synthesizeNoteWithServer(transcript: string, serverUrl: string): Promise<string> {
    if (!serverUrl) throw new Error('Server API URL is required');

    const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
        throw new Error(`Server API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.note || data.text || '';
}
