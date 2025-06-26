# 🖥️ TopCPUGraph - GNOME Shell Extension

A **minimalist real-time CPU usage graph** for GNOME Shell that displays live CPU activity directly in your top panel.


## ✨ Features

- **📊 Real-time CPU monitoring** - Updates every second with smooth animations
- **🎨 Color-coded usage levels** - Green (low) → Blue (medium) → Red (high)
- **🔍 Hover tooltip** - Shows current CPU percentage on hover
- **🖱️ Click to open** - Left-click opens GNOME System Monitor
- **🎯 Minimalist design** - Clean integration with GNOME Shell themes
- **🌙 Theme compatible** - Automatically adapts to light/dark themes
- **⚡ Lightweight** - Minimal resource usage, won't slow down your system

## 🚀 Installation

### Option 1: Manual Installation (Recommended)

1. **Download the extension:**
   ```bash
   git clone https://github.com/rohitkr150015/topcpugraph.git
   cd topcpugraph
   ```

2. **Copy to GNOME extensions directory:**
   ```bash
   cp -r cpu-graph@rohitkr150015.github.io ~/.local/share/gnome-shell/extensions/
   ```

3. **Restart GNOME Shell:**
   - Press `Alt + F2`, type `r`, and press Enter
   - Or log out and log back in

4. **Enable the extension:**
   ```bash
   gnome-extensions enable cpu-graph@rohitkr150015.github.io
   ```

### Option 2: Using GNOME Extensions Website

1. Visit [extensions.gnome.org](https://extensions.gnome.org)
2. Search for "Top CPU Graph"
3. Click "Install" and follow the prompts

## 📁 File Structure

```
cpu-graph@rohitkr150015.github.io/
├── extension.js          # Main extension logic
├── utils.js              # CPU usage calculation utilities
├── stylesheet.css        # Styling and theme support
├── metadata.json         # Extension metadata
├── prefs.js              # Preferences window (future enhancement)
├── icons/
│   └── icon.svg          # Extension icon
└── README.md            # This file
```

## 🎛️ Usage

Once installed and enabled:

- **View CPU usage**: The graph appears in your top panel (right side by default)
- **Get details**: Hover over the graph to see current CPU percentage
- **Open System Monitor**: Left-click the graph to open detailed system information
- **Customize**: Access preferences through GNOME Extensions app (coming soon)

## 🔧 Configuration

The extension currently supports these customizations:

- **Graph dimensions**: 120x24 pixels (configurable in future versions)
- **Update interval**: 1 second (optimal for real-time monitoring)
- **History length**: 60 data points (2 minutes of history)
- **Color scheme**: Automatic based on usage levels

## 🔍 Technical Details

### CPU Usage Calculation

The extension reads from `/proc/stat` to calculate CPU usage:

```javascript
// Simplified calculation
const usage = ((totalDiff - idleDiff) / totalDiff) * 100;
```

### Color Mapping

- **0-30%**: Green/Cyan (`rgba(0.2, 0.8, 0.6, 0.9)`)
- **30-70%**: Blue/Violet (`rgba(0.4, 0.6, 1.0, 0.9)`)
- **70-100%**: Red (`rgba(1.0, 0.3, 0.3, 0.9)`)

## 🛠️ Development

### Prerequisites

- GNOME Shell 45, 46, or 47
- GJS (GNOME JavaScript bindings)
- Basic knowledge of GNOME Shell extensions

### Running in Development Mode

1. Enable debug logging:
   ```bash
   journalctl -f -o cat /usr/bin/gnome-shell
   ```

2. Reload the extension:
   ```bash
   gnome-extensions disable cpu-graph@rohitkr150015.github.io
   gnome-extensions enable cpu-graph@rohitkr150015.github.io
   ```

### Building for Distribution

```bash
# Create zip file for distribution
zip -r cpu-graph@rohitkr150015.github.io.zip cpu-graph@rohitkr150015.github.io/
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/awesome-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add awesome feature'`
5. **Push to the branch**: `git push origin feature/awesome-feature`
6. **Open a Pull Request**

### Feature Ideas

- [ ] Per-core CPU monitoring
- [ ] Customizable color schemes
- [ ] Adjustable graph dimensions
- [ ] Temperature monitoring
- [ ] Memory usage integration
- [ ] Export usage data

## 📋 Compatibility

| GNOME Shell Version | Status |
|-------------------|---------|
| 45.x | ✅ Supported |
| 46.x | ✅ Supported |
| 47.x | ✅ Supported |
| 48.x |