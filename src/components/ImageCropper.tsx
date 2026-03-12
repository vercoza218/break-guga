'use client';

import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropDone = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    const canvas = document.createElement('canvas');
    const image = new Image();
    image.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.src = imageSrc;
    });

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    canvas.toBlob((blob) => {
      if (blob) onCropComplete(blob);
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropDone}
          showGrid={false}
        />
      </div>

      <div className="bg-dark-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 shrink-0">Zoom:</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-gold"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-500 transition-colors min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gold text-black font-bold py-3 rounded-lg hover:bg-gold-light transition-colors min-h-[44px]"
          >
            Recortar e Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
