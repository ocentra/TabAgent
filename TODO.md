# Tab Agent TODO List

Future improvements and migrations for the Tab Agent project.

## 🎨 Tailwind v4 Migration

### Current State
We're using Tailwind CSS with traditional `tailwind.config.js` configuration file.

### Migration Goal
Move to Tailwind v4's inline configuration in CSS for cleaner setup.

### Current Approach:
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ["src/**/*.{html,js}"],
  safelist: [...],
  theme: { extend: {} }
}
```

```css
/* src/input.css */
@import "tailwindcss";
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Target Approach (Tailwind v4):
```css
/* src/input.css */
@import "tailwindcss" theme({
  --color-primary: #3b82f6;
  /* Other theme customizations inline */
});

@theme {
  --breakpoint-3xl: 1920px;
}

@utility dark {
  @media (prefers-color-scheme: dark) {
    @apply &;
  }
}
```

### Benefits:
- ✅ No separate config file needed
- ✅ All configuration in one place (CSS)
- ✅ Better type safety with CSS variables
- ✅ Simpler project structure

### Steps to Migrate:
1. Update to Tailwind CSS v4 (`npm install tailwindcss@next`)
2. Move `tailwind.config.js` settings to inline CSS theme
3. Update dark mode configuration
4. Move safelist to CSS utilities
5. Test all styles work correctly
6. Delete `tailwind.config.js`
7. Update build command (may not need `--config` flag)

### Estimated Effort:
- 1-2 hours
- Low risk (can test before fully switching)

### Priority:
- 🟡 Medium (nice to have, not urgent)
- Current setup works fine

---

## 🔮 Other Future Improvements

### Store Publication
- [ ] Create Chrome Web Store developer account
- [ ] Create Firefox Add-ons developer account
- [ ] Create Edge Add-ons developer account
- [ ] Submit extension for review
- [ ] Update extension IDs after approval
- [ ] Test store installations

### Code Signing
- [ ] Get Windows code signing certificate
- [ ] Sign MSI installer
- [ ] Get Apple Developer ID
- [ ] Sign and notarize PKG installer

### Auto-Update System
- [ ] Implement extension auto-update notification
- [ ] Native host self-update via extension trigger
- [ ] Version comparison and changelog display

### LM Studio Integration
- [ ] Deep integration with LM Studio API
- [ ] Model management through extension
- [ ] Auto-start LM Studio when needed

### Testing
- [ ] Unit tests for core functionality
- [ ] Integration tests for native messaging
- [ ] End-to-end tests for full workflow
- [ ] Cross-platform installer testing

### Documentation
- [ ] Video installation tutorial
- [ ] Developer contribution guide
- [ ] API documentation
- [ ] User manual

---

**Note:** This TODO list tracks future improvements, not immediate work.

