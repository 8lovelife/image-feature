"use client"

import { ImageIcon, BarChart3, Cpu, Brain, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { FeatureType } from "./middle-panel"
import ColorHistogramChart from "./color-histogram-chart"
import ImageFeatureDisplay from "./image-features-display"

interface SelectedImage {
    id: number
    src: string
    alt: string
    description: string
    features: { [key: string]: number[] }
}

interface RightPanelProps {
    selectedImages: SelectedImage[]
    currentFeatureType: FeatureType
}

const featureInfo = {
    // Open Source Deep Learning Features
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
        paper: "Very Deep Convolutional Networks for Large-Scale Image Recognition (2014)",
    },
    mobilenet: {
        name: "MobileNet",
        dimensions: 1024,
        category: "Machine Learning",
        description: "Efficient CNN for mobile and embedded vision applications",
        license: "Apache 2.0",
        repository: "https://github.com/tensorflow/models",
        paper: "MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications (2017)",
    },
    // Open Source Traditional Features
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
        paper: "Multiresolution Gray-Scale and Rotation Invariant Texture Classification with Local Binary Patterns (2002)",
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
}

export default function RightPanel({ selectedImages, currentFeatureType }: RightPanelProps) {
    const currentFeatureInfo = featureInfo[currentFeatureType]
    const isMachineLearning = currentFeatureInfo.category === "Machine Learning"

    return (
        <div className="h-full p-2 md:p-4 flex flex-col">
            <Card className="h-full flex flex-col overflow-hidden">
                <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl mb-4">
                        {isMachineLearning ? <Brain className="h-5 w-5 flex-shrink-0" /> : <Cpu className="h-5 w-5 flex-shrink-0" />}
                        <span>Image Feature Details</span>
                    </CardTitle>

                    {/* <div className="flex flex-col gap-2 md:gap-4"> */}
                    {/* <div className="block md:hidden space-y-2">
                            <div className="flex flex-wrap gap-1">
                                <Badge variant={isMachineLearning ? "default" : "secondary"} className="text-xs px-1.5 py-0.5">
                                    {isMachineLearning ? <Brain className="h-3 w-3 mr-1" /> : <Cpu className="h-3 w-3 mr-1" />}
                                    {currentFeatureInfo.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                    {currentFeatureInfo.dimensions}D
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{currentFeatureInfo.description}</p>
                        </div> */}
                    {/* 
                        <div className="hidden md:flex md:flex-row gap-4 lg:gap-6">
                            <div className="flex-1 p-3 lg:p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-2 lg:mb-3">
                                    <Badge variant={isMachineLearning ? "default" : "secondary"} className="text-xs px-2 py-0.5">
                                        {isMachineLearning ? <Brain className="h-3 w-3 mr-1.5" /> : <Cpu className="h-3 w-3 mr-1.5" />}
                                        {currentFeatureInfo.category}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                                        License: {currentFeatureInfo.license}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 lg:mb-3 leading-relaxed">{currentFeatureInfo.description}</p>

                                <div className="space-y-1 text-xs text-muted-foreground mb-3 lg:mb-4">
                                    <p><strong>Vector Dimensions:</strong> {currentFeatureInfo.dimensions}</p>
                                    <p><strong>Reference Paper:</strong> {currentFeatureInfo.paper}</p>
                                </div>

                                <Button variant="outline" size="sm" className="text-xs h-7 lg:h-8 px-2 lg:px-3" asChild>
                                    <a href={currentFeatureInfo.repository} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                        <ExternalLink className="h-3 w-3 lg:h-3.5 lg:w-3.5 mr-1 lg:mr-1.5" />
                                        Repo
                                    </a>
                                </Button>
                            </div>

                            <div className="flex-1 p-3 lg:p-4 rounded-lg border bg-secondary/30 dark:bg-secondary/20 text-secondary-foreground">
                                <h4 className="font-semibold text-sm mb-2">Implementation Notes</h4>
                                <div className="h-24 lg:h-32 pr-2">
                                    <div className="text-xs space-y-1">
                                        {currentFeatureType === "resnet" && (
                                            <>
                                                <p>• Pre-trained weights from ImageNet.</p>
                                                <p>• Features from avgpool layer.</p>
                                                <p>• Available in PyTorch/TensorFlow.</p>
                                            </>
                                        )}
                                        {currentFeatureType === "vgg" && (
                                            <>
                                                <p>• Simple and deep architecture.</p>
                                                <p>• FC7 layer (4096 dimensions).</p>
                                                <p>• Widely accessible models.</p>
                                            </>
                                        )}
                                        {currentFeatureType === "mobilenet" && (
                                            <>
                                                <p>• Efficient for mobile devices.</p>
                                                <p>• Depthwise separable convolutions.</p>
                                                <p>• TensorFlow Lite & PyTorch Mobile.</p>
                                            </>
                                        )}
                                        {currentFeatureType === "color_histogram" && (
                                            <>
                                                <p>• RGB pixel intensity counts.</p>
                                                <p>• Normalized by pixel count.</p>
                                                <p>• Fast and memory efficient.</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div> */}
                    {/* </div> */}
                </CardHeader>

                <CardContent className="flex-1 min-h-0 overflow-hidden p-2 md:p-4">
                    <ScrollArea className="h-full w-full">
                        <div className="space-y-4 md:space-y-6 pr-2">
                            {/* Image Feature Vectors */}
                            {selectedImages.map((image, index) => (
                                <div key={image.id} className="space-y-2 md:space-y-3">
                                    <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2 flex items-center gap-2">
                                        <ImageIcon className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                        Image #{index + 1} Features
                                    </h3>
                                    <div className="text-xs text-muted-foreground mb-2">
                                        {image.description} | Dimensions:{" "}
                                        {image.features[currentFeatureType]?.length || currentFeatureInfo.dimensions}
                                    </div>
                                    <ImageFeatureDisplay
                                        image={image}
                                        featureVector={image.features[currentFeatureType]}
                                    />
                                    <div className="mt-2 md:mt-4">
                                        <ColorHistogramChart featureVector={image.features[currentFeatureType]} />
                                    </div>
                                </div>
                            ))}

                            {selectedImages.length === 0 && (
                                <div className="text-center text-muted-foreground py-6 md:py-8">
                                    <BarChart3 className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm md:text-base">Select images to view feature vector details</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}