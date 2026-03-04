interface Env {
    GEMINI_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;
        const body = await request.json() as { transcript?: string };
        const transcript = body.transcript;

        if (!transcript) {
            return new Response(JSON.stringify({ error: "Missing transcript data" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "Server API Key not configured on edge" }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Call Gemini API directly from the Edge Worker
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${env.GEMINI_API_KEY}`;

        const promptTemplate = `
You are an expert transcriber and note-taker. Your task is to process a raw transcript from a speech recognition engine.
The input is likely in Taiwanese Mandarin and may contain homophone errors (e.g., '或是' vs '火勢').

Please perform the following transformations:
1. Fixer: Correct any Taiwanese-specific homophones or transcription errors.
2. Note Synthesizer: Transform the raw text into a well-structured digital note.
3. Smart Highlight: Identify 'Key Insights' and wrap them in a <mark> tag.
4. Smart Indentation: Group related sentences into bullet points or nested lists based on semantic flow.
5. Formatting: Output strict Markdown (with the exception of <mark> tags). Use # for main title and ## for sections.

Input Transcript:
"${transcript}"

Output only the synthesized markdown note, nothing else.`;

        const payload = {
            contents: [{ parts: [{ text: promptTemplate }] }]
        };

        const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiRes.ok) {
            const errorText = await geminiRes.text();
            return new Response(JSON.stringify({ error: "Gemini Synthesis Failed", details: errorText }), {
                status: geminiRes.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const geminiData = await geminiRes.json();
        const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return new Response(JSON.stringify({ note: generatedText }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
