import { useState, useCallback } from 'react'

interface VoiceModeOptions {
  onTranscript: (text: string) => void
  onListeningChange: (listening: boolean) => void
  continuous?: boolean
}

export function useVoiceMode({ onTranscript, onListeningChange, continuous = false }: VoiceModeOptions) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Check if Web Speech API is available
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition not supported on this device')
      return
    }

    setError(null)
    setTranscript('')
    setListening(true)
    onListeningChange(true)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.lang = 'en-GB'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(interimTranscript || finalTranscript)
      
      if (finalTranscript) {
        onTranscript(finalTranscript.trim())
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Error: ${event.error}`)
      }
      setListening(false)
      onListeningChange(false)
    }

    recognition.onend = () => {
      setListening(false)
      onListeningChange(false)
    }

    recognition.start()

    // Store recognition instance for stopping
    ;(window as any).__voiceRecognition = recognition
  }, [continuous, isSupported, onTranscript, onListeningChange])

  const stopListening = useCallback(() => {
    const recognition = (window as any).__voiceRecognition
    if (recognition) {
      recognition.stop()
    }
    setListening(false)
    onListeningChange(false)
  }, [onListeningChange])

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      setError('Text-to-speech not supported')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    // Try to use a natural-sounding voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Karen') || 
      v.name.includes('Daniel')
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  return {
    listening,
    speaking,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  }
}
