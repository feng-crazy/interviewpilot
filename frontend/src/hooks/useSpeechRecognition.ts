import { useRef, useState, useCallback } from 'react';

interface SpeechResult {
  text: string;
  is_final: boolean;
  error?: string;
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript('');
    setFinalTranscript('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/speech`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[Speech] WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data) as SpeechResult;
        if (data.error) {
          setError(data.error);
          console.error('[Speech] Error from server:', data.error);
          stopRecording();
          return;
        }
        if (data.text) {
          console.log('[Speech] Transcript:', data.text, 'is_final:', data.is_final);
          if (data.is_final) {
            setFinalTranscript(prev => prev + data.text);
            setTranscript('');
          } else {
            setTranscript(data.text);
          }
        }
      };

      ws.onerror = (event) => {
        const errorMsg = 'WebSocket connection error';
        setError(errorMsg);
        console.error('[Speech] WebSocket error:', event);
        setIsRecording(false);
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        console.log('[Speech] WebSocket closed:', event.code, event.reason);
        if (event.code !== 1000 && !error) {
          setError(`Connection closed unexpectedly: ${event.reason || 'code ' + event.code}`);
        }
      };

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          setIsConnected(true);
          resolve();
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('WebSocket connection failed'));
        };
      });

      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);

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
      workletNodeRef.current = workletNode;
      source.connect(workletNode);

      workletNode.port.onmessage = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
        }
      };

      URL.revokeObjectURL(workletUrl);
      setIsRecording(true);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMsg);
      console.error('[Speech] Start recording error:', err);
      setIsRecording(false);
      setIsConnected(false);

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log('[Speech] Stopping recording...');

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'User stopped recording');
      }
      wsRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsConnected(false);
  }, []);

  const getFullTranscript = useCallback(() => {
    return finalTranscript + transcript;
  }, [finalTranscript, transcript]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isRecording,
    isConnected,
    transcript,
    finalTranscript,
    error,
    startRecording,
    stopRecording,
    getFullTranscript,
    clearError,
  };
}