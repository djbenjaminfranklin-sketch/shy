import { supabase } from '../client';

// Ban user
export async function banUser(userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: true })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

// Unban user
export async function unbanUser(userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: false })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

// Warn user - increment warning count
export async function warnUser(userId: string): Promise<{ error: string | null }> {
  try {
    // Get current warning count
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('warning_count')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return { error: fetchError.message };
    }

    const currentCount = (profile?.warning_count as number) || 0;

    // Increment warning count
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ warning_count: currentCount + 1 })
      .eq('id', userId);

    if (updateError) {
      return { error: updateError.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Une erreur est survenue' };
  }
}

// Verify user manually
export async function verifyUser(userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: true, verified_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

// Delete user
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  try {
    // This should cascade delete related data based on DB constraints
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: 'Erreur lors de la suppression' };
  }
}

// Give boosts to user
export async function giveBoosts(userId: string, quantity: number): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get current boost count
    const { data: existingData } = await supabase
      .from('user_boosts')
      .select('boosts_available')
      .eq('user_id', userId)
      .single();

    const currentBoosts = existingData?.boosts_available || 0;

    // Upsert the boost balance
    const { error } = await supabase
      .from('user_boosts')
      .upsert({
        user_id: userId,
        boosts_available: currentBoosts + quantity,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: 'Une erreur inattendue est survenue' };
  }
}

// Update any profile field (full admin power)
export async function updateProfile(userId: string, updates: Record<string, unknown>): Promise<void> {
  await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
}
