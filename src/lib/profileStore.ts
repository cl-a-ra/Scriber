export interface LocalProfile {
  displayName: string;
  bio: string;
  photoData: string | null;
  useAccountPhoto: boolean;
}

type ProfileStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const MAX_PROFILE_PHOTO_LENGTH = 200000;

export function profileStorageKey(userId: string | null): string {
  return userId ? `scriber_profile_v1:user:${userId}` : 'scriber_profile_v1:guest';
}

export function validateProfile(value: unknown): LocalProfile {
  if (!value || typeof value !== 'object') throw new Error('The saved profile is invalid.');
  const profile = value as Record<string, unknown>;
  if (typeof profile.displayName !== 'string' || !profile.displayName.trim() || profile.displayName.length > 100) {
    throw new Error('Your display name must contain 1 to 100 characters.');
  }
  if (typeof profile.bio !== 'string' || profile.bio.length > 280) throw new Error('Your bio must be 280 characters or fewer.');
  if (typeof profile.useAccountPhoto !== 'boolean') throw new Error('The profile photo setting is invalid.');
  const photoData = profile.photoData;
  if (photoData !== null && typeof photoData !== 'string') throw new Error('The profile picture is invalid.');
  if (typeof photoData === 'string' && (photoData.length > MAX_PROFILE_PHOTO_LENGTH ||
    !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photoData))) {
    throw new Error('Your profile picture is invalid or too large. Please choose a new picture.');
  }
  return {
    displayName: profile.displayName.trim(), bio: profile.bio.trim(),
    photoData: typeof photoData === 'string' ? photoData : null, useAccountPhoto: profile.useAccountPhoto,
  };
}

export function loadLocalProfile(userId: string | null, fallbackName: string, storage: ProfileStorage = localStorage): { profile: LocalProfile; error: string } {
  const fallback: LocalProfile = { displayName: fallbackName, bio: '', photoData: null, useAccountPhoto: Boolean(userId) };
  try {
    const raw = storage.getItem(profileStorageKey(userId));
    return { profile: raw ? validateProfile(JSON.parse(raw)) : fallback, error: '' };
  } catch (error) {
    console.error('Unable to load local profile', { name: error instanceof Error ? error.name : 'Unknown error' });
    return { profile: fallback, error: 'Your saved profile could not be loaded. Existing data will not be replaced until you save a profile.' };
  }
}

export function saveLocalProfile(userId: string | null, profile: LocalProfile, storage: ProfileStorage = localStorage): LocalProfile {
  const validated = validateProfile(profile);
  storage.setItem(profileStorageKey(userId), JSON.stringify(validated));
  return validated;
}

export async function prepareProfilePhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP picture.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose a picture smaller than 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error('This picture could not be opened. Please choose a different image.');
    }
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    if (size <= 0) throw new Error('This picture has no usable image data.');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser cannot prepare a profile picture.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 256, 256);
    context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, 256, 256);
    const photo = canvas.toDataURL('image/jpeg', 0.85);
    if (photo.length > MAX_PROFILE_PHOTO_LENGTH) throw new Error('The resized picture is still too large. Please choose a simpler picture.');
    return photo;
  } finally {
    URL.revokeObjectURL(url);
  }
}
