export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface ImageValidationResult {
  ok: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: "Chỉ nhận ảnh JPG, PNG hoặc WEBP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Ảnh phải nhỏ hơn 5MB." };
  }
  return { ok: true };
}

/**
 * Thu nhỏ ảnh về tối đa `maxDimension` px cạnh dài rồi nén thành JPEG.
 * Ảnh nhỏ hơn giới hạn thì giữ nguyên kích thước, chỉ nén lại.
 */
export async function resizeImageToJpeg(
  file: File,
  maxDimension: number,
  quality = 0.85
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Không nén được ảnh."))),
      "image/jpeg",
      quality
    );
  });
}
