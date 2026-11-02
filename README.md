# Master Documents 📄✨

> **A premium, 100% offline-first Android and Web document viewer, utility suite, and private file vault.**

Designed with an Apple-inspired Liquid Glass dock, Droplert retro-modern aesthetics, true AMOLED black dark mode, and zero external cloud or network dependencies.

Developed by **[mahesh2008here](https://github.com/mahesh2008here)**.

---

## 🚀 Key Features

### 1. Universal Offline Document Reader
- **PDF Engine**: Vector & canvas rendering with pinch-to-zoom (up to 300%), rotation, bookmarking, in-document word search, and password-protected document decryption.
- **Word (`.docx`, `.doc`)**: Native style preservation, heading hierarchy outline, table of contents, and word counters via Mammoth.
- **Spreadsheets (`.xlsx`, `.xls`, `.csv`)**: Interactive multi-sheet tab navigation, grid layout, column sorting, and cell search via SheetJS.
- **Presentations (`.pptx`, `.ppt`)**: Slide-by-slide presenter view, card carousel jump, speaker notes, and subtitle extraction.
- **Markdown & Plain Text (`.md`, `.txt`)**: Syntax-highlighted code blocks, tables, task lists, and reading progress.
- **Images (`.png`, `.jpg`, `.webp`, `.svg`)**: Hardware-accelerated viewer with pan & zoom up to 800%.

### 2. Unique 3D Spatial Holographic Page Turn & Aperture Opening
- **Aperture Launch**: Documents open with a cinematic spatial expansion from center (`scale(0.92)` to `1.0` with instant optical blur clearance).
- **Holographic 3D Flip**: Page transitions feature an interactive depth perspective flip (`rotateY(-14deg)` with specular light sweep), replacing standard book turns.
- **Keyboard Support**: Navigate pages with `Arrow Left` / `Arrow Right`, `Page Up` / `Page Down`, or `Spacebar`.

### 3. Private File Locker (Encrypted Vault)
- **4-Digit PIN Security**: Protected with PIN access (default: `1234`) and custom PIN modification.
- **Simulated Biometric Fingerprint Sensor**: Instant one-tap biometric authentication.
- **Document Isolation**: Move sensitive files into/out of the locker with active vault badges on the dock.

### 4. Deep Document Utility Suite
- **PDF Full Text Extractor**: Extracts searchable raw text across all pages into clipboard or text files.
- **Word to Markdown Converter**: Reconstructs complete Markdown documents with heading levels and body copy.
- **PPTX Speaker Script Generator**: Aggregates slide titles and speaker notes into an organized presenter script.
- **Spreadsheet Matrix Extractor**: Converts Excel sheets into sanitized CSV or structured JSON matrices.
- **Privacy Metadata Sanitizer**: Audits file headers, strips proprietary tracking markers, and computes SHA-256 integrity checksums.

### 5. Liquid Glass & Droplert Retro-Modern UI
- **Dynamic Accent Customization**: Preset palette swatches (Vibrant Amber, Cyber Emerald, Electric Violet, Pacific Blue, Sunset Coral, Neon Lime) + native Hex Color Picker updating CSS variables in real time.
- **True AMOLED Dark Mode**: Pitch black `#000000` background for battery efficiency on OLED displays.
- **Android Scoped Storage Permission Dialog**: Simulates `READ_MEDIA_DOCUMENTS` and `MANAGE_EXTERNAL_STORAGE`.
- **UPI Creator Support**: Full-page support screen with privacy-masked UPI ID (`mahesh.2008here@oksbi`), offline SVG QR code generator, and preset contribution amounts.

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/mahesh2008here/master-documents.git

# Navigate into the project directory
cd master-documents

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Build for Production
```bash
npm run build
```
This produces optimized production assets in `/dist`.

### Type-Check & Linting
```bash
npm run lint
```

---

## 📁 Project Architecture

```
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx            # Apple-style Liquid Glass dock navigation
│   │   ├── HomeScreen.tsx           # Document catalog, format chips, search & sort
│   │   ├── ToolsScreen.tsx          # PDF, Word, PPT, Sheet & metadata utilities
│   │   ├── LockerScreen.tsx         # PIN & Biometric private document vault
│   │   ├── SettingsScreen.tsx       # Color accents, permissions, and GitHub info
│   │   ├── SupportScreen.tsx        # Hidden UPI ID & dynamic SVG QR code
│   │   ├── DocumentCard.tsx         # Droplert-styled card with format badges
│   │   ├── Dialogs/                 # Permissions, Import, Details, Rename modals
│   │   └── Reader/                  # PDF, Word, Excel, PPT, Text & Image viewers
│   ├── services/
│   │   ├── documentParser.ts        # Client-side offline parsing (PDF.js, Mammoth, SheetJS)
│   │   ├── storage.ts               # IndexedDB persistence for documents & preferences
│   │   ├── sampleDocuments.ts       # Pre-loaded offline demo documents
│   │   └── qrGenerator.ts           # Zero-dependency offline SVG QR code generator
│   ├── types/
│   │   └── document.ts              # TypeScript definitions & compatibility matrix
│   ├── App.tsx                      # Root controller, state & tab routing
│   └── index.css                    # Tailwind CSS v4, AMOLED dark mode, 3D keyframes
├── index.html                       # Fonts (Outfit, Plus Jakarta Sans, JetBrains Mono)
├── metadata.json                    # AI Studio manifest configuration
├── package.json                     # Dependencies & scripts
└── tsconfig.json                    # TypeScript configuration
```

---

## 🔒 Privacy & Offline Guarantee
- **No Cloud Uploads**: Documents are parsed 100% on-device in memory and stored securely in local IndexedDB.
- **No Tracking**: No telemetry, analytics, or external trackers.
- **Ad-Free**: Zero advertisements or sponsored links.

---

## 👤 Author & Support
- **Lead Developer**: [mahesh2008here](https://github.com/mahesh2008here)
- **Contact**: `mahesh.2008here@gmail.com`
- **License**: Apache 2.0 (Open Source)
