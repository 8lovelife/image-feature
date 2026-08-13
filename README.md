# Image Feature Extraction

An interactive teaching tool for exploring how classic computer-vision and deep-learning models turn images into **feature vectors** — and how those vectors can be compared to measure image similarity.

Upload or pick sample images, choose a feature-extraction method, and visualize the resulting feature vectors, distances, and a 3D feature-space representation — all in the browser.

> ⚠️ **Note:** This app is a visual/educational demo. The "deep learning" feature extractors (ResNet-50, VGG-16, MobileNet) do not run real neural network inference in the browser — they generate representative synthetic vectors of the correct dimensionality to illustrate how each method's output differs. The Color Histogram feature is computed from the actual image pixels.

## ✨ Features

- 📷 **Select images** from built-in samples or upload your own
- 🧠 **8 feature-extraction methods**, split into two categories:
  - **Deep Learning:** ResNet-50 (2048-d), VGG-16 (4096-d), MobileNet (1024-d)
  - **Traditional CV:** SIFT (128-d), HOG (3780-d), LBP (256-d), Color Histogram (768-d), ORB (256-d)
- 📊 **Real color histogram** computation and visualization (per-channel RGB bar chart)
- 🔍 **Image-to-image similarity**, using cosine, Euclidean, and Manhattan distance metrics
- 🧩 **Interactive 3D feature-space view** (via Three.js) illustrating how feature dimensions map to a spatial representation
- 🔗 Each method links to its reference paper and open-source implementation (e.g. OpenCV, PyTorch Vision, scikit-image)
- 📱 Responsive, resizable three-panel layout (image selection → feature extraction → results)

## 🖼 How It Works

1. **Left panel** — pick one or more sample images, or upload your own.
2. **Middle panel** — choose a feature-extraction method (Deep Learning or Traditional CV) from the dropdown. A feature vector is generated for every selected image.
3. **Right panel** — inspect the raw feature vector, view the color histogram chart (for Color Histogram), compare images using different distance metrics, and explore the 3D feature-space visualization.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) 15 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Radix UI, shadcn-style components |
| Charts | [Recharts](https://recharts.org/) |
| 3D visualization | [Three.js](https://threejs.org/) via `@react-three/fiber` and `@react-three/drei` |
| Language | TypeScript |

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm (or your preferred package manager)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/8lovelife/image-feature.git
cd image-feature

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Build the app for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |

## 📁 Project Structure

```
.
├── app/
│   ├── layout.tsx        # Root layout & metadata
│   └── page.tsx           # Main page: state, feature generation, similarity calc
├── components/
│   ├── left-panel.tsx            # Image selection / upload
│   ├── middle-panel.tsx          # Feature method selector + extraction settings
│   ├── right-panel.tsx           # Feature vector, distances, tabs
│   ├── color-histogram-chart.tsx # RGB histogram chart (Recharts)
│   ├── image-features-display.tsx# Raw feature vector viewer
│   ├── feature-space-tab.tsx     # 3D feature-space visualization (Three.js)
│   └── ui/                       # shadcn/ui-style primitives
├── lib/
│   └── feature-vector.ts  # Feature vector generation logic
└── public/                # Static assets & sample images
```


## 📜 License

MIT License © 2025 [8lovelife](https://github.com/8lovelife)
