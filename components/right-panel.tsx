"use client";

import { useMemo } from "react";
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
  POINT_PALETTE,
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
  },
  vgg: {
    name: "VGG-16",
    dimensions: 4096,
    category: "Machine Learning",
    description: "Visual Geometry Group Convolutional Neural Network",
  },
  mobilenet: {
    name: "MobileNet",
    dimensions: 1024,
    category: "Machine Learning",
    description: "Efficient CNN for mobile and embedded vision applications",
  },
  sift: {
    name: "SIFT",
    dimensions: 128,
    category: "Traditional",
    description: "Scale-Invariant Feature Transform for keypoint detection",
  },
  hog: {
    name: "HOG",
    dimensions: 3780,
    category: "Traditional",
    description: "Histogram of Oriented Gradients for object detection",
  },
  lbp: {
    name: "LBP",
    dimensions: 256,
    category: "Traditional",
    description: "Local Binary Patterns for texture classification",
  },
  color_histogram: {
    name: "Color Histogram",
    dimensions: 768,
    category: "Traditional",
    description: "RGB color distribution histogram",
  },
  orb: {
    name: "ORB",
    dimensions: 256,
    category: "Traditional",
    description: "Oriented FAST and Rotated BRIEF feature detector",
  },
};

// ─────────────────────────────────────────────────────────────
// Feature vector → 7D mapping
// Splits the vector into 7 segments, takes segment means,
// then min-max normalises into each slider's range.
// ─────────────────────────────────────────────────────────────

function mapVectorTo7D(vec: number[]): FeatureSpaceValues {
  if (!vec || vec.length === 0) return DEFAULT_VALUES;
  const n = vec.length;
  const segMeans = Array.from({ length: 7 }, (_, i) => {
    const start = Math.floor((i * n) / 7);
    const end = Math.floor(((i + 1) * n) / 7);
    const slice = vec.slice(start, end);
    return slice.reduce((s, v) => s + v, 0) / (slice.length || 1);
  });
  const gMin = Math.min(...segMeans);
  const gMax = Math.max(...segMeans);
  const gRange = gMax - gMin || 1;
  const norm = segMeans.map((v) => (v - gMin) / gRange);
  const mapTo = (t: number, lo: number, hi: number) =>
    parseFloat((lo + t * (hi - lo)).toFixed(3));
  return {
    f1: mapTo(norm[0], -5, 5),
    f2: mapTo(norm[1], -5, 5),
    f3: mapTo(norm[2], -5, 5),
    f4: mapTo(norm[3], 0, 360),
    f5: mapTo(norm[4], 0.1, 1.0),
    f6: mapTo(norm[5], 0.1, 1.0),
    f7: mapTo(norm[6], 0, 3),
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

  // Build allImages array for FeatureSpaceTab — one entry per selected image
  const allImages = useMemo(
    () =>
      selectedImages.map((img, i) => {
        const vec = img.features[currentFeatureType];
        return {
          label: `#${i + 1}`,
          src: img.src,
          values: vec ? mapVectorTo7D(vec) : DEFAULT_VALUES,
        };
      }),
    [selectedImages, currentFeatureType],
  );

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
                空间中的特征向量
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Feature Vectors */}
            <TabsContent
              value="features"
              className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-full w-full">
                <div className="space-y-4 md:space-y-6 pr-2">
                  {selectedImages.map((image, index) => {
                    const pointColor =
                      POINT_PALETTE[index % POINT_PALETTE.length];
                    return (
                      <div key={image.id} className="space-y-2 md:space-y-3">
                        <h3 className="font-semibold text-sm md:text-base flex items-center gap-2">
                          {/* Thumbnail with color ring */}
                          <div className="relative shrink-0">
                            <img
                              src={image.src}
                              alt={image.alt}
                              className="w-10 h-10 rounded-lg object-cover"
                              style={{
                                outline: `2px solid ${pointColor}`,
                                outlineOffset: "1px",
                              }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: pointColor }}
                              />
                              <span>Image #{index + 1} Features</span>
                            </div>
                            <div className="text-xs font-normal text-muted-foreground mt-0.5">
                              {image.description}
                            </div>
                          </div>
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          Dimensions:{" "}
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
                    );
                  })}
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

            {/* Tab 2: 7D Visualization */}
            <TabsContent
              value="dimreduction"
              className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden"
            >
              <div className="h-full rounded-lg p-1 overflow-hidden">
                <FeatureSpaceTab
                  allImages={allImages.length > 0 ? allImages : undefined}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
