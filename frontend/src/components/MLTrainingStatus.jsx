import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';

/**
 * ML Training Status Component
 * Shows ML model training status and allows manual training
 */
const MLTrainingStatus = ({ userId = 'guest' }) => {
  const [status, setStatus] = useState(null);
  const [training, setTraining] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, [userId]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ml/training-status?user_id=${userId}`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching training status:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerTraining = async () => {
    setTraining(true);
    try {
      const response = await fetch(`/api/ml/train?user_id=${userId}`, {
        method: 'POST'
      });
      const result = await response.json();
      
      // Show success message
      alert(`Training complete! ${result.models_trained.length} models trained.`);
      
      // Refresh status
      await fetchStatus();
    } catch (error) {
      console.error('Error training models:', error);
      alert('Training failed. Please try again.');
    } finally {
      setTraining(false);
    }
  };

  if (loading) {
    return (
      <div className="ml-training-status-loading p-4">
        <Brain className="w-5 h-5 animate-pulse" />
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const canTrain = status.total_completions >= status.min_samples_required;
  const needsTraining = status.new_completions_since_training >= status.retrain_threshold;

  return (
    <div className="ml-training-status bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">ML Training Status</h3>
        </div>
        {needsTraining && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
            Training Recommended
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="stat-card bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 mb-1">Total Completions</div>
          <div className="text-2xl font-bold text-purple-900">
            {status.total_completions}
          </div>
        </div>

        <div className="stat-card bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">New Since Training</div>
          <div className="text-2xl font-bold text-blue-900">
            {status.new_completions_since_training}
          </div>
        </div>
      </div>

      {/* Last Training Time */}
      {status.last_training_time && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Clock className="w-4 h-4" />
          <span>
            Last trained: {new Date(status.last_training_time).toLocaleString()}
          </span>
        </div>
      )}

      {/* Model Status */}
      <div className="models-status mb-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">Models Available:</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Difficulty Estimator</span>
            {status.models_available.difficulty_estimator ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <span className="text-gray-400">Not trained</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Duration Predictor</span>
            {status.models_available.duration_predictor ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <span className="text-gray-400">Not trained</span>
            )}
          </div>
        </div>
      </div>

      {/* Training Button */}
      {canTrain ? (
        <button
          onClick={triggerTraining}
          disabled={training}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
            training
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : needsTraining
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
          }`}
        >
          {training ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Training Models...
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              {needsTraining ? 'Train Now (Recommended)' : 'Retrain Models'}
            </>
          )}
        </button>
      ) : (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Complete {status.min_samples_required - status.total_completions} more habits to enable ML training
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${(status.total_completions / status.min_samples_required) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Models automatically retrain after every {status.retrain_threshold} new completions
      </div>
    </div>
  );
};

export default MLTrainingStatus;
