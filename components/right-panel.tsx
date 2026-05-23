"use client";

import { useMemo, useState } from "react";
import { ImageIcon, BarChart3, Cpu, Brain, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { FeatureType } from "./middle-panel";
import ColorHistogramChart from "./color-histogram-chart";
import ImageFeatureDisplay from "./image-features-display";
import FeatureSpaceTab, {
  type FeatureSpaceValues,
  DEFAULT_VALUES,
} from "./feature-space-tab";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SelectedImage {
  id: number;
  src: string;
  alt: string;
  description: string;
  features: { [key: string]: number[] };
}

interface RightPanelProps {
  selectedImages: SelectedImage[];
  currentFeatureType: FeatureType;
}

// ─────────────────────────────────────────────────────────────
// Feature info metadata
// ─────────────────────────────────────────────────────────────

const featureInfo = {
  resnet: {
    name: "ResNet-50",
    dimensions: 2048,
    category: "Machine Learning",
    description: "Deep Residual Network with skip connections",
    license: "Apache 2.0",
    repository: "https://github.com/pytorch/vision",
    paper: "Deep Residual Learning for Image Recognition (2015)",
  },
  vgg: {
    name: "VGG-16",
    dimensions: 4096,
    category: "Machine Learning",
    description: "Visual Geometry Group Convolutional Neural Network",
    license: "MIT",
    repository: "https://github.com/pytorch/vision",
    paper:
      "Very Deep Convolutional Networks for Large-Scale Image Recognition (2014)",
  },
  mobilenet: {
    name: "MobileNet",
    dimensions: 1024,
    category: "Machine Learning",
    description: "Efficient CNN for mobile and embedded vision applications",
    license: "Apache 2.0",
    repository: "https://github.com/tensorflow/models",
    paper:
      "MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications (2017)",
  },
  sift: {
    name: "SIFT",
    dimensions: 128,
    category: "Traditional",
    description: "Scale-Invariant Feature Transform for keypoint detection",
    license: "BSD",
    repository: "https://github.com/opencv/opencv",
    paper: "Distinctive Image Features from Scale-Invariant Keypoints (2004)",
  },
  hog: {
    name: "HOG",
    dimensions: 3780,
    category: "Traditional",
    description: "Histogram of Oriented Gradients for object detection",
    license: "BSD",
    repository: "https://github.com/scikit-image/scikit-image",
    paper: "Histograms of Oriented Gradients for Human Detection (2005)",
  },
  lbp: {
    name: "LBP",
    dimensions: 256,
    category: "Traditional",
    description: "Local Binary Patterns for texture classification",
    license: "BSD",
    repository: "https://github.com/scikit-image/scikit-image",
    paper:
      "Multiresolution Gray-Scale and Rotation Invariant Texture Classification with Local Binary Patterns (2002)",
  },
  color_histogram: {
    name: "Color Histogram",
    dimensions: 768,
    category: "Traditional",
    description: "RGB color distribution histogram",
    license: "Public Domain",
    repository: "https://github.com/opencv/opencv",
    paper: "Color indexing (1991)",
  },
  orb: {
    name: "ORB",
    dimensions: 256,
    category: "Traditional",
    description: "Oriented FAST and Rotated BRIEF feature detector",
    license: "BSD",
    repository: "https://github.com/opencv/opencv",
    paper: "ORB: An efficient alternative to SIFT or SURF (2011)",
  },
};

// ─────────────────────────────────────────────────────────────
// Feature vector → 7D mapping
//
// Strategy: divide the raw vector into 7 equal segments,
// compute the mean of each segment, then normalise each mean
// into the slider's target range using min-max scaling across
// all 7 segment means.
// ─────────────────────────────────────────────────────────────

function mapVectorTo7D(vec: number[]): FeatureSpaceValues {
  if (!vec || vec.length === 0) return DEFAULT_VALUES;

  // Split into 7 roughly-equal chunks and take mean of each
  const n = vec.length;
  const segMeans = Array.from({ length: 7 }, (_, i) => {
    const start = Math.floor((i * n) / 7);
    const end = Math.floor(((i + 1) * n) / 7);
    const slice = vec.slice(start, end);
    return slice.reduce((s, v) => s + v, 0) / (slice.length || 1);
  });

  // Global min/max for normalisation
  const gMin = Math.min(...segMeans);
  const gMax = Math.max(...segMeans);
  const gRange = gMax - gMin || 1;

  // Normalise 0→1
  const norm = segMeans.map((v) => (v - gMin) / gRange);

  // Map each normalised value into its slider range
  const mapTo = (t: number, lo: number, hi: number) =>
    parseFloat((lo + t * (hi - lo)).toFixed(3));

  return {
    f1: mapTo(norm[0], -5, 5), // X轴
    f2: mapTo(norm[1], -5, 5), // Z轴
    f3: mapTo(norm[2], -5, 5), // Y轴
    f4: mapTo(norm[3], 0, 360), // 色相
    f5: mapTo(norm[4], 0.1, 1.0), // 大小
    f6: mapTo(norm[5], 0.1, 1.0), // 透明度
    f7: mapTo(norm[6], 0, 3), // 几何形状
  };
}

// ─────────────────────────────────────────────────────────────
// RightPanel
// ─────────────────────────────────────────────────────────────

export default function RightPanel({
  selectedImages,
  currentFeatureType,
}: RightPanelProps) {
  const currentFeatureInfo = featureInfo[currentFeatureType];
  const isMachineLearning = currentFeatureInfo.category === "Machine Learning";

  // Which image is active in the 3D view (picker shown in Tab 2 header)
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Clamp index in case images are removed
  const safeIndex = Math.min(
    activeImageIndex,
    Math.max(0, selectedImages.length - 1),
  );

  // Derive 7D values from the currently-active image's feature vector
  const featureSpaceValues = useMemo<FeatureSpaceValues | undefined>(() => {
    if (selectedImages.length === 0) return undefined;
    const vec = selectedImages[safeIndex]?.features[currentFeatureType];
    return vec ? mapVectorTo7D(vec) : undefined;
  }, [selectedImages, safeIndex, currentFeatureType]);

  const sourceLabel =
    selectedImages.length > 0
      ? `Image #${safeIndex + 1} · ${currentFeatureType.toUpperCase()}`
      : undefined;

  return (
    <div className="h-full p-2 md:p-4 flex flex-col">
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            {isMachineLearning ? (
              <Brain className="h-5 w-5 flex-shrink-0" />
            ) : (
              <Cpu className="h-5 w-5 flex-shrink-0" />
            )}
            <span>Image Feature Details</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 overflow-hidden p-2 md:p-4 pt-0">
          <Tabs defaultValue="features" className="h-full flex flex-col">
            <TabsList className="shrink-0 mb-3 w-full">
              <TabsTrigger
                value="features"
                className="flex-1 flex items-center gap-1.5 text-xs"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                特征向量详情
              </TabsTrigger>
              <TabsTrigger
                value="dimreduction"
                className="flex-1 flex items-center gap-1.5 text-xs"
              >
                <Box className="h-3.5 w-3.5" />
                7维降维演示
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Feature Vectors */}
            <TabsContent
              value="features"
              className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-full w-full">
                <div className="space-y-4 md:space-y-6 pr-2">
                  {selectedImages.map((image, index) => (
                    <div
                      key={image.id}
                      className={`space-y-2 md:space-y-3 rounded-xl p-2 -mx-2 transition-colors cursor-pointer ${
                        index === safeIndex
                          ? "bg-muted/60 ring-1 ring-border"
                          : "hover:bg-muted/30"
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2 flex items-center gap-2">
                        <ImageIcon className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                        Image #{index + 1} Features
                        {index === safeIndex && (
                          <span className="ml-auto text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                            3D 联动中
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-muted-foreground mb-2">
                        {image.description} | Dimensions:{" "}
                        {image.features[currentFeatureType]?.length ||
                          currentFeatureInfo.dimensions}
                      </div>
                      <ImageFeatureDisplay
                        image={image}
                        featureVector={image.features[currentFeatureType]}
                      />
                      <div className="mt-2 md:mt-4">
                        <ColorHistogramChart
                          featureVector={image.features[currentFeatureType]}
                        />
                      </div>
                    </div>
                  ))}
                  {selectedImages.length === 0 && (
                    <div className="text-center text-muted-foreground py-6 md:py-8">
                      <BarChart3 className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm md:text-base">
                        Select images to view feature vector details
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tab 2: 7D Visualization — driven by selected image */}
            <TabsContent
              value="dimreduction"
              className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden"
            >
              {/* Image picker (only shown when multiple images exist) */}
              {selectedImages.length > 1 && (
                <div className="flex gap-1.5 mb-2 flex-wrap shrink-0">
                  {selectedImages.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(i)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        i === safeIndex
                          ? "bg-foreground text-background border-foreground"
                          : "bg-muted text-muted-foreground border-border hover:border-foreground/40"
                      }`}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-4 h-4 rounded object-cover"
                      />
                      #{i + 1}
                    </button>
                  ))}
                </div>
              )}
              <div className="h-full rounded-lg p-1 overflow-hidden">
                <FeatureSpaceTab
                  initialValues={featureSpaceValues}
                  sourceLabel={sourceLabel}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
