export interface EvaluationResult {
  status: 'Correct' | 'Possible Mistake' | 'Could Not Evaluate';
  score: number;
  confidence: number;
  transcription: string;
  errors?: string[];
}

export class VoiceEvaluationService {
  /**
   * Mock evaluation for MVP phase 4 testing.
   * In a real implementation, this would call a speech-to-text API or use the Web Speech API.
   */
  static async evaluateAudio(audioBlob: Blob, expectedText: string): Promise<EvaluationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For the MVP, we'll return a mock "Correct" result to allow testing the flow
    return {
      status: 'Correct',
      score: 95,
      confidence: 0.9,
      transcription: expectedText,
    };
  }

  /**
   * This is a scaffold for the browser's native Web Speech API implementation.
   * Note: Web Speech API has varying support across browsers and limited Arabic support in some.
   */
  static startWebSpeechRecognition(
    expectedText: string,
    onResult: (result: EvaluationResult) => void
  ) {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      onResult({
        status: 'Could Not Evaluate',
        score: 0,
        confidence: 0,
        transcription: '',
        errors: ['Speech recognition is not supported in this browser.']
      });
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      // Simple string comparison for MVP. 
      // A robust system needs string normalization (removing diacritics/tashkeel).
      const normalizedTranscript = transcript.replace(/[\u064B-\u065F]/g, '');
      const normalizedExpected = expectedText.replace(/[\u064B-\u065F]/g, '');
      
      const isMatch = normalizedTranscript.includes(normalizedExpected) || normalizedExpected.includes(normalizedTranscript);

      onResult({
        status: isMatch ? 'Correct' : 'Possible Mistake',
        score: isMatch ? 90 : 50,
        confidence: confidence,
        transcription: transcript,
      });
    };

    recognition.onerror = (event: any) => {
      onResult({
        status: 'Could Not Evaluate',
        score: 0,
        confidence: 0,
        transcription: '',
        errors: [`Speech recognition error: ${event.error}`]
      });
    };

    recognition.start();
    return recognition;
  }
}
