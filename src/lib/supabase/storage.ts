import { createClient, isSupabaseConfigured } from './client';

export const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface AvatarUploadResult {
  url?: string;
  path?: string;
  error?: string;
}

export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Fòma fichye a dwe yon imaj JPEG, PNG, oswa WebP.',
    };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Gwosè foto a pa dwe depase 3 MB.',
    };
  }

  return { valid: true };
}

export async function uploadProfileAvatar(
  file: File,
  userId: string
): Promise<AvatarUploadResult> {
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    return { error: validation.error };
  }

  if (!isSupabaseConfigured()) {
    // Demo fallback for local development without Supabase credentials
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          path: `demo-avatars/${userId}-${Date.now()}`,
        });
      };
      reader.onerror = () => {
        resolve({ error: 'Erè pandan lekti imaj la.' });
      };
      reader.readAsDataURL(file);
    });
  }

  const supabase = createClient();
  if (!supabase) {
    return { error: 'Koneksyon Supabase pa disponib.' };
  }

  try {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const filePath = `${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return { error: 'Erè pandan telechajman foto a: ' + uploadError.message };
    }

    const { data: publicData } = supabase.storage
      .from('profile-avatars')
      .getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: filePath,
    };
  } catch (err: any) {
    console.error('Avatar upload exception:', err);
    return { error: err.message || 'Erè pandan telechajman foto a.' };
  }
}

export async function deleteProfileAvatar(
  filePathOrUrl: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!filePathOrUrl) return { success: true };

  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Koneksyon Supabase pa disponib.' };

  try {
    // Extract relative storage path
    let path = filePathOrUrl;
    if (filePathOrUrl.includes('profile-avatars/')) {
      path = filePathOrUrl.split('profile-avatars/')[1];
    }

    // Safety check: must belong to the user's folder
    if (!path.startsWith(`${userId}/`)) {
      return { success: false, error: 'Ou pa gen dwa efase foto sa a.' };
    }

    const { error } = await supabase.storage.from('profile-avatars').remove([path]);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
