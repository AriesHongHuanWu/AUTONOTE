import { Mic, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FABProps {
    isRecording: boolean;
    onToggle: () => void;
}

export function FAB({ isRecording, onToggle }: FABProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className={`fixed bottom-8 right-8 z-50 rounded-[24px] p-5 shadow-lg flex items-center justify-center transition-colors duration-300 ${isRecording
                ? 'bg-red-500 text-white shadow-red-500/30'
                : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-primary/30'
                }`}
            aria-label={isRecording ? 'Stop Transcript' : 'Start Transcript'}
        >
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={isRecording ? 'recording' : 'idle'}
                    initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
                    transition={{ duration: 0.2 }}
                >
                    {isRecording ? <StopCircle size={28} /> : <Mic size={28} />}
                </motion.div>
            </AnimatePresence>

            {/* Pulse Animation when recording */}
            {isRecording && (
                <motion.div
                    className="absolute inset-0 rounded-[24px] bg-red-400 -z-10"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            )}
        </motion.button>
    );
}
