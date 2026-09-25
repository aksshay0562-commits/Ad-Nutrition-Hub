/**
 * Haptic Vibration Feedback Utility for AD Nutrition Hub
 * Provides tactile confirmation for button interactions and barcode/QR scan events.
 */

export type HapticType = 'light' | 'medium' | 'success' | 'double' | 'error';

export function triggerHaptic(type: HapticType = 'light'): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    switch (type) {
      case 'light':
        // Gentle tactile tick on button click
        return navigator.vibrate(35);
      case 'medium':
        // Moderate tactile press
        return navigator.vibrate(55);
      case 'success':
      case 'double':
        // Celebratory double-pulse when a product barcode/QR scan result is successfully recognized and processed
        return navigator.vibrate([60, 45, 90]);
      case 'error':
        // Negative alert vibration pattern
        return navigator.vibrate([100, 50, 100]);
      default:
        return navigator.vibrate(40);
    }
  } catch (err) {
    // Vibration blocked by device or browser policy
    return false;
  }
}
