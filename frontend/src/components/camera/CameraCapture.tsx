import { useRef, FC } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '../common/Button';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onFileUpload: (file: File) => void;
  onClose?: () => void;
}

export const CameraCapture: FC<CameraCaptureProps> = ({
  onCapture,
  onFileUpload,
  onClose,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      
      <div className="relative bg-black rounded-lg overflow-hidden">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full h-auto"
          videoConstraints={{
            facingMode: 'environment',
          }}
        />
      </div>

      <div className="mt-4 flex gap-4 justify-center">
        <Button onClick={capture} size="lg" className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Capture Photo
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload Image
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

