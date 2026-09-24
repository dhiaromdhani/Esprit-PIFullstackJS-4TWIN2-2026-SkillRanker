# Translation & Accessibility Implementation Guide

## Overview
Your Angular application now has complete multi-language support (English, French, Arabic) and comprehensive accessibility features.

## Translation System

### Supported Languages
- **English** (en) - Default
- **French** (fr)
- **Arabic** (ar) - RTL Support

### Using Translations in Templates

#### Using the Pipe
```html
<!-- Simple translation -->
<h1>{{ 'common.home' | translate }}</h1>

<!-- With parameters (if needed in future) -->
<p>{{ 'messages.welcomeMessage' | translate: {name: userName} }}</p>
```

#### Using the Service
```typescript
import { TranslateService } from '@ngx-translate/core';

constructor(private translateService: TranslateService) {}

getTranslation() {
  this.translateService.get('common.dashboard').subscribe((res: string) => {
    console.log(res);
  });
}
```

### Adding New Translation Keys

1. **Add to all language files** (en.json, fr.json, ar.json):
   ```json
   {
     "section": {
       "key": "Translation text"
     }
   }
   ```

2. **Use in templates**:
   ```html
   {{ 'section.key' | translate }}
   ```

### Language Service

```typescript
import { LanguageService } from './service/language.service';

constructor(private languageService: LanguageService) {}

// Change language
this.languageService.setLanguage('fr');

// Get current language
const lang = this.languageService.getCurrentLanguage();

// Subscribe to language changes
this.languageService.currentLanguage$.subscribe(lang => {
  console.log('Language changed to:', lang);
});

// Get all languages
const languages = this.languageService.getLanguages();
```

## Accessibility Features

### Accessibility Service

```typescript
import { AccessibilityService } from './service/accessibility.service';

constructor(private accessibilityService: AccessibilityService) {}

// Update font size
this.accessibilityService.setFontSize('large');

// Toggle high contrast
this.accessibilityService.enableHighContrast();
this.accessibilityService.disableHighContrast();

// Text to speech
this.accessibilityService.enableTextToSpeech();
this.accessibilityService.speak('Hello World', 'en');
this.accessibilityService.stopSpeaking();

// Announce for screen readers
this.accessibilityService.announce('Item deleted successfully');

// Reset to defaults
this.accessibilityService.resetToDefaults();
```

### Accessibility Settings

Supported settings:
- `highContrast` - High contrast mode (black background, yellow text)
- `fontSize` - 'small' | 'medium' | 'large' | 'extraLarge'
- `textToSpeech` - Enable/disable text-to-speech
- `screenReader` - Screen reader mode
- `keyboardNavigation` - Enable/disable keyboard navigation
- `reduceMotion` - Reduce animations
- `focusIndicators` - Show focus indicators

## Language Selector Component

The `LanguageSelectorComponent` provides:
- Language selection dropdown
- Accessibility settings panel
- Font size adjustment
- High contrast toggle
- Text-to-speech toggle
- Reset accessibility settings

### Adding to Your App

Add to your layout (app.component.html or navbar):
```html
<app-language-selector></app-language-selector>
```

## Accessibility Best Practices

### 1. Semantic HTML
```html
<!-- ✓ Good -->
<header>
  <nav>Navigation</nav>
</header>
<main>
  <article>Content</article>
</main>
<footer>Footer</footer>

<!-- ✗ Avoid -->
<div class="header">
  <div class="nav">Navigation</div>
</div>
```

### 2. ARIA Labels
```html
<!-- For icon buttons -->
<button aria-label="Close menu">×</button>

<!-- For live regions -->
<div role="status" aria-live="polite" aria-atomic="true">
  {{ statusMessage }}
</div>

<!-- For form fields -->
<label for="email">Email</label>
<input id="email" type="email">
```

### 3. Focus Management
```html
<!-- Focusable elements have visible focus indicators -->
<button>Click me</button>

<!-- Min touch/click area: 44x44px -->
<button style="min-width: 44px; min-height: 44px;">Button</button>
```

### 4. Color Contrast
- Use sufficient color contrast (WCAG AA: 4.5:1 for text)
- Don't rely on color alone to convey information
- Test with high contrast mode enabled

### 5. Form Accessibility
```html
<!-- Always associate labels with inputs -->
<label for="name">Name:</label>
<input id="name" type="text" required>

<!-- Show error messages clearly -->
<input aria-invalid="true" aria-describedby="error">
<span id="error" role="alert">This field is required</span>
```

### 6. Images & Media
```html
<!-- Always provide alt text -->
<img src="logo.png" alt="Company Logo">

<!-- For decorative images -->
<img src="decoration.png" alt="">

<!-- For complex diagrams -->
<img src="chart.png" alt="Sales chart showing 25% growth">
```

### 7. Keyboard Navigation
```html
<!-- Ensure Tab order is logical -->
<form>
  <input type="text"> <!-- First Tab stop -->
  <input type="email"> <!-- Second Tab stop -->
  <button>Submit</button> <!-- Third Tab stop -->
</form>

<!-- Skip links for keyboard users -->
<a href="#main-content" class="sr-only">Skip to main content</a>
<main id="main-content">Content</main>
```

## CSS Classes for Accessibility

### Screen Reader Only Content
```css
.sr-only,
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

Usage:
```html
<span class="sr-only">This is only read by screen readers</span>
```

## Testing Accessibility

### Tools & Resources
1. **WAVE** - Browser extension for accessibility testing
2. **Axe DevTools** - Automated accessibility testing
3. **Screen Readers** - Test with NVDA (Windows) or VoiceOver (Mac)
4. **Keyboard Navigation** - Tab through entire app without mouse
5. **High Contrast** - Test with Windows High Contrast mode
6. **Font Size** - Test with browser zoom and font size changes

### Manual Testing Checklist
- [ ] All interactive elements are keyboard accessible
- [ ] Focus order is logical
- [ ] All images have descriptive alt text
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced to screen readers
- [ ] Color contrast meets WCAG AA standards
- [ ] Text is readable at 200% zoom
- [ ] App works with screen readers
- [ ] Keyboard shortcuts don't conflict with browser/OS shortcuts

## RTL Support (Arabic)

The system automatically handles RTL layout:
- Document direction set to `rtl`
- Text alignment adjusted
- Margins and padding flipped
- No manual RTL CSS needed in most cases

### Testing RTL
```html
<!-- Arabic content automatically RTL -->
<h1>{{ 'common.home' | translate }}</h1>

<!-- Check in browser: should render right-to-left -->
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Keyboard Shortcuts

You can register custom keyboard shortcuts:

```typescript
// Register Ctrl+Shift+A to announce page title
this.accessibilityService.registerKeyboardShortcut('a', () => {
  this.accessibilityService.announce(document.title);
});
```

## Troubleshooting

### Translations not showing
1. Ensure translation files are in `src/assets/i18n/`
2. Check browser console for loading errors
3. Verify JSON syntax in translation files

### Accessibility not working
1. Check browser console for errors
2. Verify services are injected properly
3. Ensure CSS file is imported: `@import 'styles-accessibility.css';`

### High Contrast mode not applying
1. Check for conflicting CSS
2. Ensure `:root.high-contrast-mode` selector is specific enough
3. Use `!important` if necessary for overrides

## Future Enhancements

- [ ] Language auto-detection
- [ ] Persistent accessibility preferences
- [ ] Custom color themes
- [ ] Font family options
- [ ] Additional keyboard shortcuts
- [ ] Dyslexia-friendly fonts
- [ ] Reading guide
- [ ] Page structure navigator
