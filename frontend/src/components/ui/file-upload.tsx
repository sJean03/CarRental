'use client';

import { useCallback, useState, useId } from 'react';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  value?: string; // Existing uploaded image URL
  disabled?: boolean;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = 'image/jpeg,image/jpg,image/png',
  maxSize = 5,
  className,
  value,
  disabled = false,
}: FileUploadProps) {
  const fileInputId = useId(); // Generate unique ID for this instance
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim());
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, JPEG, or PNG images only.';
    }

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSize}MB`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Import the upload function
      const { uploadToCloudinary } = await import('@/lib/utils/cloudinary');

      // Simulate progress (Cloudinary doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const url = await uploadToCloudinary(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setPreview(url);
      onUploadComplete(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0];
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        if (onUploadError) {
          onUploadError(validationError);
        }
        return;
      }

      await uploadFile(file);
    },
    [disabled, accept, maxSize]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      if (onUploadError) {
        onUploadError(validationError);
      }
      return;
    }

    await uploadFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onUploadComplete('');
  };

  if (preview && !isUploading) {
    return (
      <div className={cn('relative', className)}>
        <div className="relative rounded-lg border-2 border-green-500 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <img
              src={preview}
              alt="Uploaded preview"
              className="h-20 w-20 rounded-md object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Upload Successful</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your driver's license has been uploaded
              </p>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          isDragging && !disabled
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-gray-400'
        )}
      >
        <label
          htmlFor={fileInputId}
          className={cn(
            'flex flex-col items-center justify-center p-6 cursor-pointer',
            disabled && 'cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <div className="w-full max-w-xs">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                JPG, JPEG or PNG (max {maxSize}MB)
              </p>
            </>
          )}
        </label>
        <input
          id={fileInputId}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          aria-label="File upload input"
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <X className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
