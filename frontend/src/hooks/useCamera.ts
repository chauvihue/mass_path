import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

export function useCamera() {
  const [image, setImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImage(imageSrc);
        setIsCapturing(false);
      }
    }
  }, []);

  const startCapture = () => {
    setIsCapturing(true);
  };

  const stopCapture = () => {
    setIsCapturing(false);
  };

  const reset = () => {
    setImage(null);
    setIsCapturing(false);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return {
    image,
    isCapturing,
    webcamRef,
    capture,
    startCapture,
    stopCapture,
    reset,
    handleFileUpload,
  };
}

