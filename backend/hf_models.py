"""
Hugging Face Models Integration
Phase 4: AI Agents Architecture

This module provides interfaces to Hugging Face models for:
- Intent classification
- Sentence embeddings
- Text generation
- NLP tasks
"""
import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from functools import lru_cache

logger = logging.getLogger(__name__)

# Check if transformers is available
try:
    from transformers import pipeline, AutoTokenizer, AutoModel
    from sentence_transformers import SentenceTransformer
    import torch
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False
    logger.warning("Hugging Face transformers not available. Install with: pip install transformers sentence-transformers torch")


class HuggingFaceModels:
    """
    Manages Hugging Face model instances and provides inference methods
    """
    
    def __init__(self):
        self.models = {}
        self.device = "cuda" if HF_AVAILABLE and torch.cuda.is_available() else "cpu"
        logger.info(f"HuggingFace models will use device: {self.device}")
        
        if HF_AVAILABLE:
            self._initialize_models()
    
    def _initialize_models(self):
        """
        Initialize Hugging Face models (lazy loading)
        """
        logger.info("Hugging Face models initialized (lazy loading enabled)")
    
    @lru_cache(maxsize=1)
    def get_intent_classifier(self):
        """
        Get zero-shot classification model for intent recognition
        Model: facebook/bart-large-mnli
        """
        if not HF_AVAILABLE:
            logger.error("Transformers not available")
            return None
        
        try:
            if 'intent_classifier' not in self.models:
                logger.info("Loading intent classification model...")
                self.models['intent_classifier'] = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=0 if self.device == "cuda" else -1
                )
            return self.models['intent_classifier']
        except Exception as e:
            logger.error(f"Failed to load intent classifier: {e}")
            return None
    
    @lru_cache(maxsize=1)
    def get_sentence_embedder(self):
        """
        Get sentence embedding model for similarity and recommendations
        Model: sentence-transformers/all-MiniLM-L6-v2
        """
        if not HF_AVAILABLE:
            logger.error("Sentence transformers not available")
            return None
        
        try:
            if 'sentence_embedder' not in self.models:
                logger.info("Loading sentence embedding model...")
                self.models['sentence_embedder'] = SentenceTransformer(
                    'sentence-transformers/all-MiniLM-L6-v2',
                    device=self.device
                )
            return self.models['sentence_embedder']
        except Exception as e:
            logger.error(f"Failed to load sentence embedder: {e}")
            return None
    
    @lru_cache(maxsize=1)
    def get_text_generator(self):
        """
        Get text generation model for chatbot responses
        Model: microsoft/DialoGPT-medium
        """
        if not HF_AVAILABLE:
            logger.error("Transformers not available")
            return None
        
        try:
            if 'text_generator' not in self.models:
                logger.info("Loading text generation model...")
                self.models['text_generator'] = pipeline(
                    "text-generation",
                    model="microsoft/DialoGPT-medium",
                    device=0 if self.device == "cuda" else -1
                )
            return self.models['text_generator']
        except Exception as e:
            logger.error(f"Failed to load text generator: {e}")
            return None
    
    def classify_intent(self, text: str, candidate_labels: List[str]) -> Dict[str, Any]:
        """
        Classify user intent using zero-shot classification
        
        Args:
            text: User input text
            candidate_labels: List of possible intents
            
        Returns:
            Dict with labels and scores
        """
        classifier = self.get_intent_classifier()
        
        if classifier is None:
            # Fallback to simple keyword matching
            return self._fallback_intent_classification(text, candidate_labels)
        
        try:
            result = classifier(text, candidate_labels)
            return {
                'intent': result['labels'][0],
                'confidence': result['scores'][0],
                'all_scores': dict(zip(result['labels'], result['scores']))
            }
        except Exception as e:
            logger.error(f"Intent classification error: {e}")
            return self._fallback_intent_classification(text, candidate_labels)
    
    def _fallback_intent_classification(self, text: str, candidate_labels: List[str]) -> Dict[str, Any]:
        """
        Fallback intent classification using keyword matching
        """
        text_lower = text.lower()
        
        # Simple keyword-based matching
        intent_keywords = {
            'create_habit': ['create', 'add', 'new', 'start', 'begin'],
            'schedule': ['schedule', 'plan', 'organize', 'timetable'],
            'conflict': ['conflict', 'overlap', 'clash', 'reschedule'],
            'analytics': ['progress', 'stats', 'how am i doing', 'insights'],
            'conversation': ['hello', 'hi', 'help', 'what can you do']
        }
        
        scores = {}
        for label in candidate_labels:
            keywords = intent_keywords.get(label, [])
            score = sum(1 for keyword in keywords if keyword in text_lower)
            scores[label] = score / max(len(keywords), 1)
        
        if not scores or max(scores.values()) == 0:
            return {
                'intent': 'conversation',
                'confidence': 0.5,
                'all_scores': scores
            }
        
        best_intent = max(scores, key=scores.get)
        return {
            'intent': best_intent,
            'confidence': scores[best_intent],
            'all_scores': scores
        }
    
    def get_embeddings(self, texts: List[str]) -> Optional[List[List[float]]]:
        """
        Get sentence embeddings for similarity comparison
        
        Args:
            texts: List of text strings
            
        Returns:
            List of embedding vectors
        """
        embedder = self.get_sentence_embedder()
        
        if embedder is None:
            logger.warning("Sentence embedder not available")
            return None
        
        try:
            embeddings = embedder.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            return None
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity between two texts
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score (0-1)
        """
        embedder = self.get_sentence_embedder()
        
        if embedder is None:
            # Fallback to simple word overlap
            words1 = set(text1.lower().split())
            words2 = set(text2.lower().split())
            if not words1 or not words2:
                return 0.0
            return len(words1 & words2) / len(words1 | words2)
        
        try:
            embeddings = embedder.encode([text1, text2])
            similarity = torch.nn.functional.cosine_similarity(
                torch.tensor(embeddings[0]).unsqueeze(0),
                torch.tensor(embeddings[1]).unsqueeze(0)
            )
            return float(similarity.item())
        except Exception as e:
            logger.error(f"Similarity calculation error: {e}")
            return 0.0
    
    def find_similar_habits(self, query: str, habit_descriptions: List[str], top_k: int = 5) -> List[Tuple[int, float]]:
        """
        Find habits similar to a query using semantic search
        
        Args:
            query: Search query
            habit_descriptions: List of habit descriptions
            top_k: Number of results to return
            
        Returns:
            List of (index, similarity_score) tuples
        """
        embedder = self.get_sentence_embedder()
        
        if embedder is None or not habit_descriptions:
            return []
        
        try:
            # Encode query and habits
            query_embedding = embedder.encode([query])[0]
            habit_embeddings = embedder.encode(habit_descriptions)
            
            # Calculate similarities
            similarities = []
            for idx, habit_emb in enumerate(habit_embeddings):
                similarity = torch.nn.functional.cosine_similarity(
                    torch.tensor(query_embedding).unsqueeze(0),
                    torch.tensor(habit_emb).unsqueeze(0)
                )
                similarities.append((idx, float(similarity.item())))
            
            # Sort by similarity and return top_k
            similarities.sort(key=lambda x: x[1], reverse=True)
            return similarities[:top_k]
            
        except Exception as e:
            logger.error(f"Similar habits search error: {e}")
            return []
    
    def generate_response(self, prompt: str, max_length: int = 100) -> Optional[str]:
        """
        Generate conversational response
        
        Args:
            prompt: Input prompt
            max_length: Maximum response length
            
        Returns:
            Generated text
        """
        generator = self.get_text_generator()
        
        if generator is None:
            return None
        
        try:
            result = generator(
                prompt,
                max_length=max_length,
                num_return_sequences=1,
                pad_token_id=50256
            )
            return result[0]['generated_text']
        except Exception as e:
            logger.error(f"Text generation error: {e}")
            return None


# Global instance
hf_models = HuggingFaceModels()


# Convenience functions
def classify_intent(text: str, candidate_labels: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Classify user intent
    """
    if candidate_labels is None:
        candidate_labels = [
            'create_habit',
            'schedule',
            'conflict',
            'analytics',
            'conversation'
        ]
    return hf_models.classify_intent(text, candidate_labels)


def get_habit_similarity(habit1: str, habit2: str) -> float:
    """
    Calculate similarity between two habits
    """
    return hf_models.calculate_similarity(habit1, habit2)


def find_similar_habits(query: str, habits: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Find habits similar to query
    """
    descriptions = [h.get('description', h.get('name', '')) for h in habits]
    similar_indices = hf_models.find_similar_habits(query, descriptions, top_k)
    
    return [
        {
            'habit': habits[idx],
            'similarity': score
        }
        for idx, score in similar_indices
    ]
