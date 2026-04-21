export type ImageValidationOptions = {
  maxSizeMB: number;
  maxWidth: number;
  maxHeight: number;
};

export const AVATAR_IMAGE_LIMITS: ImageValidationOptions = {
  maxSizeMB: 2,
  maxWidth: 1024,
  maxHeight: 1024,
};

export const PRODUCT_IMAGE_LIMITS: ImageValidationOptions = {
  maxSizeMB: 5,
  maxWidth: 1600,
  maxHeight: 1600,
};

export const SERVICE_IMAGE_LIMITS: ImageValidationOptions = {
  maxSizeMB: 5,
  maxWidth: 1600,
  maxHeight: 1600,
};

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    image.src = url;
  });
};

export const validateImageFile = async (
  file: File,
  { maxSizeMB, maxWidth, maxHeight }: ImageValidationOptions
): Promise<string | null> => {
  if (!file.type.startsWith('image/')) {
    return 'El archivo seleccionado no es una imagen válida.';
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return `La imagen pesa ${sizeMB} MB. El máximo permitido es ${maxSizeMB} MB.`;
  }

  const { width, height } = await getImageDimensions(file);
  if (width > maxWidth || height > maxHeight) {
    return `La imagen es muy grande (${width}x${height}px). Máximo ${maxWidth}x${maxHeight}px.`;
  }

  return null;
};
