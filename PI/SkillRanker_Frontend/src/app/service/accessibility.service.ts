import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extraLarge';
  textToSpeech: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  reduceMotion: boolean;
  focusIndicators: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private readonly STORAGE_KEY = 'app_accessibility_settings';
  
  private settings = new BehaviorSubject<AccessibilitySettings>(this.getDefaultSettings());
  public settings$: Observable<AccessibilitySettings> = this.settings.asObservable();

  private fontSizeMultipliers: { [key: string]: number } = {
    'small': 0.85,
    'medium': 1,
    'large': 1.2,
    'extraLarge': 1.5
  };

  constructor() {
    this.initializeAccessibility();
  }

  private getDefaultSettings(): AccessibilitySettings {
    return {
      highContrast: false,
      fontSize: 'medium',
      textToSpeech: false,
      screenReader: false,
      keyboardNavigation: true,
      reduceMotion: this.prefersReducedMotion(),
      focusIndicators: true
    };
  }

  private initializeAccessibility(): void {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem(this.STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        this.settings.next({ ...this.getDefaultSettings(), ...parsedSettings });
      } catch (e) {
        console.warn('Failed to parse accessibility settings', e);
      }
    }

    // Apply system preferences
    if (this.prefersReducedMotion()) {
      this.updateSetting('reduceMotion', true);
    }

    // Apply settings to DOM
    this.applyAccessibilitySettings(this.settings.value);
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  updateSetting<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ): void {
    const currentSettings = this.settings.value;
    const updatedSettings = { ...currentSettings, [key]: value };
    this.settings.next(updatedSettings);
    this.applyAccessibilitySettings(updatedSettings);
    this.saveSettings(updatedSettings);
  }

  private applyAccessibilitySettings(settings: AccessibilitySettings): void {
    const root = document.documentElement;

    // High Contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    // Font Size
    const fontMultiplier = this.fontSizeMultipliers[settings.fontSize];
    root.style.setProperty('--font-size-multiplier', fontMultiplier.toString());

    // Reduce Motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Focus Indicators
    if (settings.focusIndicators) {
      root.classList.add('show-focus-indicators');
    } else {
      root.classList.remove('show-focus-indicators');
    }

    // Keyboard Navigation
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation-enabled');
    }

    // Screen Reader
    if (settings.screenReader) {
      root.setAttribute('aria-label', 'Screen reader mode enabled');
    }
  }

  private saveSettings(settings: AccessibilitySettings): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
  }

  getSettings(): AccessibilitySettings {
    return this.settings.value;
  }

  resetToDefaults(): void {
    const defaultSettings = this.getDefaultSettings();
    this.settings.next(defaultSettings);
    this.applyAccessibilitySettings(defaultSettings);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  enableHighContrast(): void {
    this.updateSetting('highContrast', true);
  }

  disableHighContrast(): void {
    this.updateSetting('highContrast', false);
  }

  setFontSize(size: 'small' | 'medium' | 'large' | 'extraLarge'): void {
    this.updateSetting('fontSize', size);
  }

  enableTextToSpeech(): void {
    this.updateSetting('textToSpeech', true);
  }

  disableTextToSpeech(): void {
    this.updateSetting('textToSpeech', false);
  }

  speak(text: string, lang: string = 'en'): void {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  // Announce important information for screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => announcement.remove(), 3000);
  }

  // Create keyboard shortcuts
  registerKeyboardShortcut(key: string, callback: () => void): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === key && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        callback();
      }
    });
  }
}
