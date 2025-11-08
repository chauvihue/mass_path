import { useState } from 'react';
import { AnalysisResponse, FoodItem } from '../types';
import { api } from '../services/api';

export function useNutrition() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  const analyzeImage = async (imageFile: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.analyzeImage(imageFile);
      setAnalysis(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setError(null);
  };

  return {
    loading,
    error,
    analysis,
    analyzeImage,
    reset,
  };
}

