import React, { useRef } from 'react';
import { IMAGE_UPLOAD } from '../../constants';

interface ImageUploadProps {
  images: File[];
  onChange: (files: File[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((f) => {
      if (!IMAGE_UPLOAD.ALLOWED_TYPES.includes(f.type as any)) {
        errors.push(`${f.name}: unsupported format`);
      } else if (f.size > IMAGE_UPLOAD.MAX_SIZE) {
        errors.push(`${f.name}: exceeds 5MB`);
      } else {
        valid.push(f);
      }
    });

    const combined = [...images, ...valid].slice(0, IMAGE_UPLOAD.MAX_COUNT);
    onChange(combined);
    if (errors.length) alert(errors.join('\n'));
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">
        Images ({images.length}/{IMAGE_UPLOAD.MAX_COUNT})
      </p>

      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((f, i) => (
          <div key={i} className="relative w-20 h-20">
            <img
              src={URL.createObjectURL(f)}
              alt={`Preview ${i + 1}`}
              className="w-full h-full object-cover rounded border border-gray-200"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove image ${i + 1}`}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {images.length < IMAGE_UPLOAD.MAX_COUNT && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_UPLOAD.ALLOWED_TYPES.join(',')}
            multiple
            className="sr-only"
            aria-label="Upload images"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + Add Images (JPEG, PNG, WebP · max 5MB each)
          </button>
        </>
      )}
    </div>
  );
};

export default ImageUpload;
