import { useState, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { CameraCapture } from '../components/camera/CameraCapture';
import { ImagePreview } from '../components/camera/ImagePreview';
import { useNutrition } from '../hooks/useNutrition';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const Camera: FC = () => {
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { loading, analyzeImage, error } = useNutrition();

  const handleCapture = (src: string) => {
    setImageSrc(src);
    // Convert data URL to File for API
    fetch(src)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        setImageFile(file);
      });
  };

  const handleFileUpload = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    
    try {
      const result = await analyzeImage(imageFile);
      // Navigate to results page with analysis data
      navigate('/results', {
        state: {
          imageSrc,
          analysis: result,
        },
      });
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  if (loading && !imageSrc) {
    return (
      <Layout title="Analyzing...">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Analyzing your meal...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Capture Meal">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {!imageSrc ? (
          <CameraCapture
            onCapture={handleCapture}
            onFileUpload={handleFileUpload}
          />
        ) : (
          <ImagePreview
            imageSrc={imageSrc}
            onRetake={() => {
              setImageSrc(null);
              setImageFile(null);
            }}
            onConfirm={handleAnalyze}
            loading={loading}
          />
        )}
      </div>
    </Layout>
  );
};

