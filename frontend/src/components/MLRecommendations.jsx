import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, Calendar, Star, Plus } from 'lucide-react';

/**
 * ML Recommendations Component
 * Shows personalized habit recommendations based on ML analysis
 */
const MLRecommendations = ({ userId = 'guest', onAddHabit }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ml/recommendations?user_id=${userId}&limit=5`);
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Could not load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecommendation = (rec) => {
    if (onAddHabit) {
      onAddHabit({
        name: rec.habit_name,
        category: rec.category,
        target_frequency: rec.suggested_frequency,
        estimated_duration: rec.suggested_duration,
        preferred_time_of_day: rec.suggested_time,
        difficulty: 'medium'
      });
    }
  };

  if (loading) {
    return (
      <div className="ml-recommendations-loading flex items-center justify-center p-8">
        <Sparkles className="w-6 h-6 animate-pulse text-purple-600" />
        <span className="ml-2 text-gray-600">Finding perfect habits for you...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-recommendations-error p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="ml-recommendations-empty p-8 text-center text-gray-500">
        <Sparkles className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>Complete more habits to get personalized recommendations!</p>
      </div>
    );
  }

  return (
    <div className="ml-recommendations-container">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-900">Recommended for You</h3>
      </div>

      <div className="recommendations-grid grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec, index) => (
          <div 
            key={index}
            className="recommendation-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-lg text-gray-900 flex-1">
                {rec.habit_name}
              </h4>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                {rec.category}
              </span>
            </div>

            {/* Success Probability */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-semibold text-green-600">
                  {(rec.success_probability * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${rec.success_probability * 100}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{rec.suggested_frequency}x per week</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{rec.suggested_duration} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span className="capitalize">{rec.suggested_time}</span>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Star className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-purple-900">{rec.reason}</p>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={() => handleAddRecommendation(rec)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Habit
            </button>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchRecommendations}
          className="text-purple-600 hover:text-purple-700 text-sm font-semibold"
        >
          Refresh Recommendations
        </button>
      </div>
    </div>
  );
};

export default MLRecommendations;
