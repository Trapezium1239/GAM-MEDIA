/**
 * Safe Haptics wrapper — works on web (no-op) and native (Capacitor).
 * Every invocation is guarded so a missing plugin never crashes UI.
 */
export type HapticStrength = 'light' | 'medium' | 'heavy';

export async function triggerHaptic(strength: HapticStrength = 'light'): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const style =
      strength === 'heavy' ? ImpactStyle.Heavy : strength === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
    await Haptics.impact({ style });
  } catch {
    // No-op on web / when plugin unavailable — never break UX for haptics.
  }
}

export async function triggerSelectionHaptic(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { Haptics } = await import('@capacitor/haptics');
    await Haptics.selectionStart();
  } catch {
    // silent
  }
}
