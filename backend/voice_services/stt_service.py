"""
Speech-to-Text Service using Hugging Face Whisper
Shared by both WebRTC and Twilio
"""
import os
import io
import torch
from typing import Optional
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import soundfile as sf
import numpy as np

class STTService:
    """Speech-to-Text using openai/whisper-base"""
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🎧 Initializing STT on {self.device}")
        
        # Load Whisper model (base for speed, can upgrade to large-v3 for accuracy)
        self.processor = WhisperProcessor.from_pretrained("openai/whisper-base")
        self.model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-base").to(self.device)
        
        # Force English for faster processing
        self.model.config.forced_decoder_ids = self.processor.get_decoder_prompt_ids(
            language="english", 
            task="transcribe"
        )
        
        print("✓ STT initialized")
    
    def speech_to_text(self, audio_bytes: bytes, sample_rate: int = 16000) -> str:
        """
        Convert speech audio to text
        
        Args:
            audio_bytes: Audio data in bytes
            sample_rate: Audio sample rate (default 16000)
        
        Returns:
            Transcribed text
        """
        # Load audio from bytes
        # Try to handle different audio formats (WebM, WAV, etc.)
        audio_buffer = io.BytesIO(audio_bytes)
        
        try:
            audio_np, sr = sf.read(audio_buffer)
        except Exception as e:
            # If soundfile fails, save to temp file and use ffmpeg to convert
            print(f"soundfile failed, converting with ffmpeg: {e}")
            import tempfile
            import subprocess
            
            # Save WebM to temp file
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_webm:
                temp_webm.write(audio_bytes)
                temp_webm_path = temp_webm.name
            
            # Convert to WAV using ffmpeg with better settings
            temp_wav_path = temp_webm_path.replace('.webm', '.wav')
            try:
                result = subprocess.run([
                    'ffmpeg', '-y',  # Overwrite output
                    '-i', temp_webm_path,
                    '-ar', '16000',  # 16kHz sample rate
                    '-ac', '1',       # Mono
                    '-acodec', 'pcm_s16le',  # PCM 16-bit
                    temp_wav_path
                ], check=True, capture_output=True, text=True)
                
                print(f"✓ FFmpeg conversion successful")
                
                # Load the converted WAV
                audio_np, sr = sf.read(temp_wav_path)
                
                print(f"✓ Audio loaded: {len(audio_np)} samples at {sr}Hz")
                
                # Clean up temp files
                import os
                os.unlink(temp_webm_path)
                os.unlink(temp_wav_path)
            except subprocess.CalledProcessError as conv_error:
                print(f"❌ FFmpeg conversion failed:")
                print(f"   stdout: {conv_error.stdout}")
                print(f"   stderr: {conv_error.stderr}")
                import os
                if os.path.exists(temp_webm_path):
                    os.unlink(temp_webm_path)
                if os.path.exists(temp_wav_path):
                    os.unlink(temp_wav_path)
                raise Exception("Could not process audio format. Please check microphone settings.")
        
        # Resample if needed
        if sr != 16000:
            import librosa
            audio_np = librosa.resample(audio_np, orig_sr=sr, target_sr=16000)
        
        # Ensure mono
        if len(audio_np.shape) > 1:
            audio_np = audio_np.mean(axis=1)
        
        # Check audio duration
        duration = len(audio_np) / 16000
        print(f"Audio duration: {duration:.2f} seconds")
        
        if duration < 0.5:
            print("⚠️  Audio too short (< 0.5s), may not transcribe well")
        
        # Process audio
        inputs = self.processor(
            audio_np,
            sampling_rate=16000,
            return_tensors="pt"
        ).to(self.device)
        
        # Generate transcription
        with torch.no_grad():
            predicted_ids = self.model.generate(inputs["input_features"])
        
        # Decode
        transcription = self.processor.batch_decode(
            predicted_ids,
            skip_special_tokens=True
        )[0]
        
        return transcription.strip()
    
    def speech_to_text_file(self, audio_path: str) -> str:
        """
        Transcribe audio from file path
        
        Args:
            audio_path: Path to audio file
        
        Returns:
            Transcribed text
        """
        with open(audio_path, 'rb') as f:
            audio_bytes = f.read()
        
        return self.speech_to_text(audio_bytes)


# Singleton instance
_stt_service: Optional[STTService] = None

def get_stt_service() -> STTService:
    """Get or create STT service singleton"""
    global _stt_service
    if _stt_service is None:
        _stt_service = STTService()
    return _stt_service
