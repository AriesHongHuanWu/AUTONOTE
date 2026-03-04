import { Layout } from './components/Layout';
import { FAB } from './components/FAB';
import { useStore } from './store/useStore';
import { useSherpaOnnx } from './hooks/useSherpaOnnx';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  const { isRecording, interimTranscript, finalSegments, aiSynthesizedNote, updateFinalSegment, activeTab, setActiveTab } = useStore();
  const { toggleRecording: toggleSpeech, isReady, statusText } = useSherpaOnnx();
  const { startRecording: startAudio, stopRecording: stopAudio } = useAudioRecorder();

  const handleToggleRecord = async () => {
    if (!isReady) {
      alert("Sherpa model is still loading: " + statusText);
      return;
    }

    if (!isRecording) {
      await startAudio();
      await toggleSpeech();
    } else {
      await toggleSpeech();
      const audioBlob = await stopAudio();
      if (audioBlob) {
        // Offer download for local storage per requirements
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `AutoNote_Recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <Layout>
      <div className="flex justify-center mb-8">
        <div className="bg-surface-variant/50 p-1.5 rounded-2xl flex gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab('recording')}
            className={`px-8 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'recording'
                ? 'bg-surface shadow text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
              }`}
          >
            Recording
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-8 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'notes'
                ? 'bg-surface shadow text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
              }`}
          >
            AI Notes
          </button>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        {activeTab === 'notes' ? (
          aiSynthesizedNote ? (
            <div className="handwritten-note animate-in slide-in-from-right-4 fade-in duration-500">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="font-handwritten text-4xl text-primary mb-6 border-b border-surface-variant pb-2" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="font-handwritten text-3xl text-primary/80 mt-8 mb-4" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="font-handwritten text-2xl mt-6 mb-3" {...props} />,
                  p: ({ node, ...props }) => <p className="text-lg leading-relaxed mb-4" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                  li: ({ node, ...props }) => <li className="text-lg" {...props} />,
                  mark: ({ node, ...props }) => <mark className="bg-yellow-200/50 dark:bg-yellow-500/30 px-1 rounded" {...props} />
                }}
              >
                {aiSynthesizedNote}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 opacity-50 space-y-4 animate-in fade-in">
              <p className="text-xl">No notes synthesized yet.</p>
              <p className="text-sm">Record some audio and click "Synthesize Note" to generate.</p>
            </div>
          )
        ) : (
          <div className="animate-in slide-in-from-left-4 fade-in duration-500">
            {finalSegments.length === 0 && !interimTranscript && !isRecording && (
              <div className="flex flex-col items-center justify-center h-64 opacity-50 space-y-4">
                {!isReady ? (
                  <p className="text-xl animate-pulse text-primary">{statusText}</p>
                ) : (
                  <p className="text-xl">Press the microphone to start taking notes.</p>
                )}
              </div>
            )}

            <div className="transcript-area space-y-4">
              {finalSegments.map((segment) => (
                <p
                  key={segment.id}
                  className="text-lg leading-relaxed text-on-surface hover:bg-surface-variant/50 p-2 rounded-lg transition-colors cursor-text outline-none focus:bg-surface-variant/50 focus:ring-2 focus:ring-primary/50"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateFinalSegment(segment.id, e.currentTarget.textContent || '')}
                >
                  {segment.text}
                </p>
              ))}

              {interimTranscript && (
                <p className="text-lg leading-relaxed text-on-surface-variant italic opacity-70 transition-opacity">
                  {interimTranscript}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <FAB isRecording={isRecording} onToggle={handleToggleRecord} />
    </Layout>
  );
}

export default App;
