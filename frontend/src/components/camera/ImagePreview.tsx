import { FC } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '../common/Button';

interface ImagePreviewProps {
  imageSrc: string;
  onRetake: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const ImagePreview: FC<ImagePreviewProps> = ({
  imageSrc,
  onRetake,
  onConfirm,
  loading = false,
}) => {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <img
          src={imageSrc}
          alt="Preview"
          className="w-full h-auto"
        />
      </div>

      <div className="mt-4 flex gap-4 justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={onRetake}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Retake
        </Button>
        
        <Button
          size="lg"
          onClick={onConfirm}
          loading={loading}
          className="flex items-center gap-2"
        >
          Analyze Food
        </Button>
      </div>
    </div>
  );
};

