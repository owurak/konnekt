const MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_PROFILE_PHOTO_SIZE_BYTES = 15 * 1024 * 1024;
const PROFILE_PHOTO_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read selected image."));
    reader.readAsDataURL(file);
  });
}

export function validateProfilePhotoFile(file: File, stage: "source" | "upload" = "source") {
  if (!PROFILE_PHOTO_ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Choose a JPG, PNG, WebP, or GIF image for your profile photo.");
  }

  const maxSize = stage === "source" ? MAX_SOURCE_PROFILE_PHOTO_SIZE_BYTES : MAX_PROFILE_PHOTO_SIZE_BYTES;
  if (file.size > maxSize) {
    throw new Error(
      stage === "source"
        ? "Choose an image that is 15 MB or smaller."
        : "Profile photo must be 5 MB or smaller after optimization."
    );
  }
}

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("We could not read that image. Try a JPG, PNG, or WebP file."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("We could not prepare that image for upload."));
      },
      type,
      quality
    );
  });
}

export async function optimizeProfilePhotoFile(file: File) {
  validateProfilePhotoFile(file, "source");

  if (file.type === "image/gif" && file.size <= MAX_PROFILE_PHOTO_SIZE_BYTES) {
    return file;
  }

  if (file.size <= 900 * 1024 && file.type !== "image/png") {
    return file;
  }

  const image = await loadImageElement(file);
  const maxDimension = 1200;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare that image for upload.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const baseName = file.name.replace(/\.[^.]+$/, "") || "profile-photo";
  const qualities = [0.88, 0.8, 0.72, 0.64];
  let latestBlob: Blob | null = null;

  for (const quality of qualities) {
    latestBlob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (latestBlob.size <= MAX_PROFILE_PHOTO_SIZE_BYTES) {
      return new File([latestBlob], `${baseName}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }
  }

  if (latestBlob) {
    return new File([latestBlob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  return file;
}

export function getStorageUploadErrorMessage(uploadError: unknown) {
  const message = uploadError instanceof Error ? uploadError.message : String(uploadError);

  if (message.includes("storage/unauthorized")) {
    return "Firebase Storage blocked this upload. Deploy the latest storage.rules and make sure you are signed in.";
  }
  if (message.includes("storage/bucket-not-found") || message.includes("storage/invalid-url")) {
    return "Firebase Storage is not configured correctly. Check VITE_FIREBASE_STORAGE_BUCKET in your hosting environment.";
  }
  if (message.includes("storage/quota-exceeded")) {
    return "Firebase Storage quota has been exceeded. Check your Firebase project billing or quota.";
  }
  if (message.includes("storage/retry-limit-exceeded") || message.includes("storage/canceled")) {
    return "The upload could not finish. Check your internet connection and try again.";
  }

  return message || "Unable to upload this profile photo. Try a smaller JPG or PNG image.";
}

export function getSocialAuthErrorMessage(error: unknown, providerName?: "google") {
  const message = error instanceof Error ? error.message : String(error);
  const providerLabel = providerName === "google" ? "Google" : "social";

  if (message.includes("auth/popup-closed-by-user")) {
    return "Sign-in was cancelled before it completed.";
  }
  if (message.includes("auth/popup-blocked")) {
    return "Your browser blocked the sign-in popup. Try again, or use email and password.";
  }
  if (message.includes("auth/operation-not-allowed")) {
    return `Enable ${providerLabel} sign-in in Firebase Authentication first.`;
  }
  if (message.includes("auth/unauthorized-domain")) {
    return "Add this domain to Firebase Authentication authorized domains.";
  }
  if (message.includes("auth/account-exists-with-different-credential")) {
    return "An account already exists with this email using another sign-in method. Login with that method first.";
  }

  return message || `${providerLabel} sign-in failed.`;
}

export function shouldUseRedirectSignIn() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}
