import { supabase } from '../lib/supabase';

/**
 * Normalizes and fetches a signed URL for a private visit selfie.
 * @param selfiePath The stored storage path or fallback URL.
 * @returns A promise that resolves to the valid display URL, or null if invalid.
 */
export async function getVisitSelfieUrl(selfiePath: string | null | undefined): Promise<string | null> {
  if (!selfiePath) return null;

  try {
    // If it's already a full HTTP URL (e.g., from an older public implementation), just return it
    if (selfiePath.startsWith('http://') || selfiePath.startsWith('https://')) {
      return selfiePath;
    }

    // Clean up any stray prefixes if necessary (in case it was saved incorrectly)
    let cleanPath = selfiePath;
    const bucketPrefix = 'visit-selfies/';
    if (cleanPath.startsWith(bucketPrefix)) {
      cleanPath = cleanPath.substring(bucketPrefix.length);
    }

    // Generate a secure signed URL valid for 15 minutes (900 seconds)
    const { data, error } = await supabase.storage
      .from('visit-selfies')
      .createSignedUrl(cleanPath, 900);

    if (error) {
      console.warn('Unable to generate signed URL for selfie:', error.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Error in getVisitSelfieUrl:', err);
    return null;
  }
}
