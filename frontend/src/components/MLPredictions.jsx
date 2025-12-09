import React, { useState, useEffect } from 'react';
import { Brain, Clock, TrendingUp, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

/**
 * ML Predictions Component
 * Shows difficulty and duration predictions when creating/editing habits
 */
const MLPredictions = ({ habitData, userId = 'guest' }) => {
  const [difficultyPrediction, setDifficultyPrediction] = useState(null);
  const [durationPrediction, setDurationPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (habitData && habitData.name && habitData.target_frequency && habitData.estimated_duration) {
      fetchPredictions();
    }
  }, [habitData]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      // Fetch difficulty prediction
      const diffRes = await fetch('/api/ml/predict-difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...habitData, user_id: userId })
      });
      const diffData = await diffRes.json();
      setDifficultyPrediction(diffData);

      // Fetch duration prediction
      const durRes = await fetch('/api/ml/predict-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...habitData, user_id: userId })
      });
      const durData = await durRes.json();
      setDurationPrediction(durData);
    } catch (error) {
      console.error('Error fetching ML predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ml-predictions-loading">
        <Brain className="w-5 h-5 animate-spin" />
        <span>Analyzing with ML...</span>
      </div>
    );
  }

  if (!difficultyPrediction && !durationPrediction) {
    return null;
  }

  return (
    <div className="ml-predictions-container space-y-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
      <div className="flex items-center gap-2 text-purple-700 font-semibold">
        <Brain className="w-5 h-5" />
        <span>AI Predictions</span>
      </div>

      {/* Difficulty Prediction */}
      {difficultyPrediction && (
        <div className="difficulty-prediction bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Difficulty Assessment</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              difficultyPrediction.difficulty_level === 'easy' 
                ? 'bg-green-100 text-green-700'
                : difficultyPrediction.difficulty_level === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {difficultyPrediction.difficulty_level}
            </span>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Success Probability</span>
              <span className="font-semibold text-gray-900">
                {(difficultyPrediction.success_probability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  difficultyPrediction.success_probability > 0.7 
                    ? 'bg-green-500'
                    : difficultyPrediction.success_probability > 0.4
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${difficultyPrediction.success_probability * 100}%` }}
              />
            </div>
          </div>

          {difficultyPrediction.suggestions && difficultyPrediction.suggestions.length > 0 && (
            <div className="suggestions space-y-2">
              {difficultyPrediction.suggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {difficultyPrediction.model_trained && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Prediction based on your personal data</span>
            </div>
          )}
        </div>
      )}

      {/* Duration Prediction */}
      {durationPrediction && durationPrediction.predicted_duration !== durationPrediction.planned_duration && (
        <div className="duration-prediction bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="font-semibold">Duration Insight</span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm text-gray-600">You estimated</div>
              <div className="text-lg font-semibold text-gray-900">
                {durationPrediction.planned_duration} min
              </div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div>
              <div className="text-sm text-gray-600">AI predicts</div>
              <div className="text-lg font-semibold text-purple-600">
                {durationPrediction.predicted_duration} min
              </div>
            </div>
          </div>

          {durationPrediction.difference !== 0 && (
            <div className={`flex items-start gap-2 text-sm p-2 rounded ${
              durationPrediction.difference > 0 
                ? 'bg-yellow-50 text-yellow-800'
                : 'bg-green-50 text-green-800'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{durationPrediction.suggestion}</span>
            </div>
          )}

          {durationPrediction.model_trained && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Based on your completion history</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MLPredictions;
