"""
Text-to-Speech Service using Hugging Face models
Shared by both WebRTC and Twilio
"""
import os
import io
import numpy as np
from typing import Optional
from transformers import SpeechT5Processor, SpeechT5ForTextToSpeech, SpeechT5HifiGan
import torch
import soundfile as sf

class TTSService:
    """Text-to-Speech using microsoft/speecht5_tts"""
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🎤 Initializing TTS on {self.device}")
        
        # Load models
        self.processor = SpeechT5Processor.from_pretrained("microsoft/speecht5_tts")
        self.model = SpeechT5ForTextToSpeech.from_pretrained("microsoft/speecht5_tts").to(self.device)
        self.vocoder = SpeechT5HifiGan.from_pretrained("microsoft/speecht5_hifigan").to(self.device)
        
        # Load speaker embeddings (kid-like voice)
        from datasets import load_dataset
        embeddings_dataset = load_dataset("Matthijs/cmu-arctic-xvectors", split="validation")
        # Speaker 3000 provides a lighter tone that works well for kid voice with pitch shifting
        self.speaker_embeddings = torch.tensor(embeddings_dataset[3000]["xvector"]).unsqueeze(0).to(self.device)
        
        print("✓ TTS initialized")
    
    def text_to_speech(self, text: str, output_format: str = "wav", robot_voice: bool = False) -> bytes:
        """
        Convert text to speech audio with kid-like voice
        
        Args:
            text: Text to convert
            output_format: Audio format (wav, mp3)
            robot_voice: Apply robotic effect to voice (deprecated, kept for compatibility)
        
        Returns:
            Audio bytes
        """
        # Process text
        inputs = self.processor(text=text, return_tensors="pt").to(self.device)
        
        # Generate speech
        with torch.no_grad():
            speech = self.model.generate_speech(
                inputs["input_ids"],
                self.speaker_embeddings,
                vocoder=self.vocoder
            )
        
        # Convert to numpy
        audio_np = speech.cpu().numpy()
        
        # Apply kid-like voice effect (higher pitch, energetic)
        import librosa
        # Shift up by 5 semitones for cute, child-like voice
        audio_np = librosa.effects.pitch_shift(audio_np, sr=16000, n_steps=5)
        # Slightly speed up for more energetic, kid-like sound
        audio_np = librosa.effects.time_stretch(audio_np, rate=1.15)
        
        # Convert to bytes
        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, audio_np, samplerate=16000, format='WAV')
        audio_buffer.seek(0)
        
        return audio_buffer.read()
    
    def text_to_speech_stream(self, text: str):
        """
        Stream audio generation (for real-time applications)
        Yields audio chunks as they're generated
        """
        # For now, return full audio (streaming TTS is complex)
        # Can be enhanced later with streaming models
        audio_bytes = self.text_to_speech(text)
        
        # Chunk the audio for streaming
        chunk_size = 4096
        for i in range(0, len(audio_bytes), chunk_size):
            yield audio_bytes[i:i + chunk_size]


# Singleton instance
_tts_service: Optional[TTSService] = None

def get_tts_service() -> TTSService:
    """Get or create TTS service singleton"""
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
