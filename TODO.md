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

#### Server Side (✅ Completed)
- [x] LM Studio manager in `Server/backends/lmstudio/`
- [x] Server lifecycle management (start/stop/status)
- [x] Auto-start on native_host.py launch
- [x] API health checking
- [x] Strongly typed protocol

#### Memory Management Improvements (🔧 TODO)
- [ ] **Auto VRAM Detection & Layer Offloading**
  - llama-server requires manual `-ngl` (gpu layers) tuning
  - LM Studio auto-detects VRAM and splits layers intelligently
  - **We should add smart wrapper logic:**
    - Detect available GPU VRAM (via nvidia-smi or CUDA API)
    - Calculate optimal `-ngl` value based on model size
    - Auto-fallback to CPU if VRAM insufficient
    - Dynamic adjustment if model doesn't fit
  - Example: RTX 2070 (8GB) → auto-calculate max layers for model
  - Location: `Server/backends/bitnet/manager.py` and `Server/backends/lmstudio/manager.py`
  - **Inspiration**: [Lemonade SDK](https://github.com/lemonade-sdk/lemonade) does this for AMD NPU/GPU detection

#### Runtime Backend Selection (🔧 TODO - Inspired by Lemonade)
- [ ] **Add CLI flags for backend selection** (similar to Lemonade's `--llamacpp vulkan/rocm`):
  - `--backend bitnet-cpu` - Force BitNet CPU inference
  - `--backend bitnet-gpu` - Force BitNet GPU inference (CUDA)
  - `--backend llama-cuda` - Force standard llama.cpp with CUDA
  - `--backend llama-vulkan` - Force standard llama.cpp with Vulkan
  - `--backend llama-cpu` - Force CPU-only mode
  - Auto-detect if not specified
- [ ] **Hardware capability detection**:
  - Detect NVIDIA GPU (CUDA availability)
  - Detect AMD GPU (Vulkan/ROCm availability)
  - Detect Apple Silicon (Metal availability)
  - Auto-select best backend for hardware
- [ ] **Model-aware routing**:
  - BitNet models → BitNet backend (CPU or GPU based on hardware)
  - GGUF models → Standard llama.cpp (with best GPU backend)
  - Fallback chain: GPU → CPU if GPU unavailable

#### Extension Side (⏳ TODO - After Server Complete)
- [ ] Install LM Studio.js SDK (`npm install lmstudio`)
- [ ] Create LM Studio controller/integration layer
- [ ] Implement hybrid routing:
  - [ ] Direct SDK mode (when native app not available)
  - [ ] Native app proxy mode (when available)
  - [ ] Auto-detection and fallback logic
- [ ] Add LM Studio status check in Integrations tab
- [ ] Update model selection UI:
  - [ ] Show available backends (BitNet, LM Studio, WebGPU)
  - [ ] Model type detection and routing
  - [ ] Backend status indicators
- [ ] Connection check button in UI
- [ ] Handle LM Studio not installed/not running states
- [ ] Add "Install LM Studio" guidance when missing

#### Integration Points
- [ ] Extension checks native app availability
- [ ] Extension checks LM Studio availability (both direct and via native)
- [ ] Smart backend selection based on model type:
  - BitNet models → Native app (required)
  - LM Studio models → Direct SDK (preferred) or Native proxy
  - WebGPU models → Browser only
- [ ] Status dashboard showing all backend availability

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

