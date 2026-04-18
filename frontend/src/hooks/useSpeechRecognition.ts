import { useRef, useState } from 'react';

interface SpeechResult {
  text: string;
  is_final: boolean;
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/speech`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data) as SpeechResult;
        if (data.text) {
          if (data.is_final) {
            setFinalTranscript(prev => prev + data.text);
            setTranscript('');
          } else {
            setTranscript(data.text);
          }
        }
      };
      
      ws.onerror = () => {
        setIsRecording(false);
      };
      
      await new Promise((resolve) => {
        ws.onopen = resolve;
      });
      
      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          process(inputs) {
            const input = inputs[0][0];
            if (input && this.port) {
              const pcm = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) {
                pcm[i] = Math.max(-32768, Math.min(32767, Math.floor(input[i] * 32768)));
              }
              this.port.postMessage(pcm.buffer);
            }
            return true;
          }
        }
        registerProcessor('pcm-processor', PCMProcessor);
      `;
      
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      
      await audioContextRef.current.audioWorklet.addModule(workletUrl);
      
      const workletNode = new AudioWorkletNode(audioContextRef.current, 'pcm-processor');
      source.connect(workletNode);
      
      workletNode.port.onmessage = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
        }
      };
      
      setIsRecording(true);
      setTranscript('');
      setFinalTranscript('');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
  };

  const getFullTranscript = () => {
    return finalTranscript + transcript;
  };

  return {
    isRecording,
    transcript,
    finalTranscript,
    startRecording,
    stopRecording,
    getFullTranscript,
  };
}