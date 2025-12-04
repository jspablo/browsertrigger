# 🔫 browsertrigger

**browsertrigger** is an open source browser extension that helps you collect data from the web and integrate it with your favorite automation tools and AI agents. The content you see is what you send, no third scrapers.

## ✨ Features

### 📸 WYSIWYG Data Collection
Capture exactly what you see on any webpage:
- **Selected Text** - Highlight and capture any text selection
- **Full Page Text** - Extract all visible text from the current page
- **Screenshots** - Capture visual snapshots of the current viewport

### 🔒 Privacy First
- **100% Local Processing** - All data processing happens in the browser

### ⚡ Trigger Automations & AI Agents
Connect browsertrigger to:
- ✅ **Workflow automation tools** - Integrate with platforms like n8n, Zapier, Make ...
- ✅ **Custom Applications** - Use your own webhooks and APIs
- ✅ **AI Agents** - Send data directly to your AI Agents

### 🌐 Cross-Browser Compatible
Built with WXT framework for maximum compatibility:
- ✅ **Google Chrome** - Full support
- ✅ **Mozilla Firefox** - Full support
- ✅ **Safari** - Compatible (requires testing)

## 📦 Installation

### From Source
```bash
# Clone the repository
git clone https://github.com/jspablo/browsertrigger.git
cd browsertrigger

# Install dependencies
npm install

# Development mode (Chrome)
npm run dev

# Build
npm run build
```

## 🚀 Quick Start

### 1. Capture Content
- Right click on any webpage
- Select **browsertrigger** from the context menu
- Choose your capture method:
  - **Send Text Selected** - Capture highlighted text
  - **Send Full Page** - Capture all page text
  - **Send Screenshot** - Capture visible viewport

### 2. Configure Webhook
Add new webhook and update its fields:
- **Name**: Descriptive name for your webhook
- **URL**: Your endpoint URL
- **Method**: GET or POST
- **Field Name**: Parameter name for the captured data
- **Authentication**: None, Basic, or Custom Header

### 3. Send Data
- View the captured content in the left panel
- Click **"Send content"** on any configured webhook
- View the response in the right panel

## 🙏 Acknowledgments

- Built with [WXT](https://wxt.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/) and [LobeHub](https://icons.lobehub.com/)
