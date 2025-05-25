"use client"

import Image from "next/image"
import { ImageIcon, Settings, Cpu, Brain, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface SelectedImage {
    id: number
    src: string
    alt: string
    description: string
    features: { [key: string]: number[] }
}

export type FeatureType = "resnet" | "vgg" | "mobilenet" | "sift" | "hog" | "lbp" | "color_histogram" | "orb"

interface MiddlePanelProps {
    selectedImages: SelectedImage[]
    currentFeatureType: FeatureType
    imageImageSimilarities: number[][]
    onRemoveImage: (id: number) => void
    onFeatureTypeChange: (featureType: FeatureType) => void
}

const featureOptions = [
    // Open Source Machine Learning Features
    {
        value: "resnet",
        label: "ResNet-50",
        category: "Machine Learning",
        icon: Brain,
        license: "Apache 2.0",
        description: "Deep Residual Network with skip connections",
        repository: "https://github.com/pytorch/vision",
        paper: "Deep Residual Learning for Image Recognition (2015)",
        dimensions: 2048,
    },
    {
        value: "vgg",
        label: "VGG-16",
        category: "Machine Learning",
        icon: Brain,
        license: "MIT",
        description: "Visual Geometry Group Convolutional Neural Network",
        repository: "https://github.com/pytorch/vision",
        paper: "Very Deep Convolutional Networks for Large-Scale Image Recognition (2014)",
        dimensions: 4096,
    },
    {
        value: "mobilenet",
        label: "MobileNet",
        category: "Machine Learning",
        icon: Brain,
        license: "Apache 2.0",
        description: "Efficient CNN for mobile and embedded vision applications",
        repository: "https://github.com/tensorflow/models",
        paper: "MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications (2017)",
        dimensions: 1024,
    },

    // Open Source Traditional Features
    {
        value: "sift",
        label: "SIFT",
        category: "Traditional",
        icon: Cpu,
        license: "BSD",
        description: "Scale-Invariant Feature Transform for keypoint detection",
        repository: "https://github.com/opencv/opencv",
        paper: "Distinctive Image Features from Scale-Invariant Keypoints (2004)",
        dimensions: 128,
    },
    {
        value: "hog",
        label: "HOG",
        category: "Traditional",
        icon: Cpu,
        license: "BSD",
        description: "Histogram of Oriented Gradients for object detection",
        repository: "https://github.com/scikit-image/scikit-image",
        paper: "Histograms of Oriented Gradients for Human Detection (2005)",
        dimensions: 3780,
    },
    {
        value: "lbp",
        label: "LBP",
        category: "Traditional",
        icon: Cpu,
        license: "BSD",
        description: "Local Binary Patterns for texture classification",
        repository: "https://github.com/scikit-image/scikit-image",
        paper: "Multiresolution Gray-Scale and Rotation Invariant Texture Classification with Local Binary Patterns (2002)",
        dimensions: 256,
    },
    {
        value: "color_histogram",
        label: "Color Histogram",
        category: "Traditional",
        icon: Cpu,
        license: "Public Domain",
        description: "RGB color distribution histogram",
        repository: "https://github.com/opencv/opencv",
        paper: "Color indexing (1991)",
        dimensions: 768,
    },
    {
        value: "orb",
        label: "ORB",
        category: "Traditional",
        icon: Cpu,
        license: "BSD",
        description: "Oriented FAST and Rotated BRIEF feature detector",
        repository: "https://github.com/opencv/opencv",
        paper: "ORB: An efficient alternative to SIFT or SURF (2011)",
        dimensions: 256,
    },
];

export default function MiddlePanel({
    selectedImages,
    currentFeatureType,
    imageImageSimilarities,
    onRemoveImage,
    onFeatureTypeChange,
}: MiddlePanelProps) {
    const currentFeature = featureOptions.find((f) => f.value === currentFeatureType)

    return (
        <div className="h-full p-2 md:p-4 flex flex-col">
            <div className="flex flex-col space-y-3 md:space-y-4 h-full">
                {/* Feature Extraction Settings */}
                <Card className="flex-shrink-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Image Feature Extraction Methods
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <Select value={currentFeatureType} onValueChange={onFeatureTypeChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select feature extraction method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2">
                                            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                                <Brain className="h-3 w-3" />
                                                Deep Learning
                                            </div>
                                            {featureOptions
                                                .filter((option) => option.category === "Machine Learning")
                                                .map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div className="flex items-center gap-2">
                                                            <option.icon className="h-4 w-4" />
                                                            <span>{option.label}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {option.license}
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                        </div>
                                        <div className="p-2">
                                            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                                <Cpu className="h-3 w-3" />
                                                Traditional Computer Vision
                                            </div>
                                            {featureOptions
                                                .filter((option) => option.category === "Traditional")
                                                .map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div className="flex items-center gap-2">
                                                            <option.icon className="h-4 w-4" />
                                                            <span>{option.label}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {option.license}
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                        </div>
                                    </SelectContent>
                                </Select>

                                <Button variant="outline" size="sm" className="text-xs h-7 lg:h-8 px-2 lg:px-3" asChild>
                                    <a href={currentFeature?.repository} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                        <ExternalLink className="h-3 w-3 lg:h-3.5 lg:w-3.5 mr-1 lg:mr-1.5" />
                                        Repo
                                    </a>
                                </Button>
                            </div>

                            {currentFeature && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="space-y-1 text-xs text-muted-foreground mb-3 lg:mb-4">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {currentFeature.description}
                                        </p>
                                        <p><strong>Vector Dimensions:</strong> {currentFeature.dimensions}</p>
                                        <p><strong>Reference Paper:</strong> {currentFeature.paper}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Selected Images */}
                <Card className="flex-shrink-0">
                    <CardHeader>
                        <CardTitle>Selected Images ({selectedImages.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-58">
                            {selectedImages.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Please select images from the left panel</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {selectedImages.map((image, index) => (
                                        <div key={image.id} className="relative group">
                                            <Image
                                                src={image.src || "/placeholder.svg"}
                                                alt={image.alt}
                                                width={120}
                                                height={120}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => onRemoveImage(image.id)}
                                            >
                                                ×
                                            </Button>
                                            <div className="absolute bottom-1 left-1">
                                                <Badge variant="outline" className="text-xs bg-background/80">
                                                    #{index + 1}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Similarity Results */}
                <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle>Image-To-Image Similarities</CardTitle>
                            <Badge variant="outline" className="text-xs">
                                {currentFeature?.label}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <ScrollArea className="h-full w-full">
                            <div className="space-y-4">
                                {/* Image-to-Image Similarities */}
                                {selectedImages.length > 1 && imageImageSimilarities.length > 0 ? (
                                    <div>
                                        {/* <h4 className="font-medium mb-3 flex items-center gap-2">
                                            Image-to-Image Similarities
                                            <Badge variant="outline" className="text-xs">
                                                {currentFeature?.label}
                                            </Badge>
                                        </h4> */}
                                        <div className="space-y-2">
                                            {selectedImages.map((imageA, i) => (
                                                <div key={`row-${i}`} className="space-y-1">
                                                    {selectedImages.map((imageB, j) => {
                                                        if (i >= j) return null
                                                        if (!imageImageSimilarities[i] || imageImageSimilarities[i][j] === undefined) return null
                                                        return (
                                                            <div key={`${i}-${j}`} className="flex items-center gap-3 text-sm">
                                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                    <Image
                                                                        src={imageA.src || "/placeholder.svg"}
                                                                        alt={imageA.alt}
                                                                        width={34}
                                                                        height={34}
                                                                        className="rounded"
                                                                    />
                                                                    <span className="text-xs">#{i + 1}</span>
                                                                    <span className="text-xs">↔</span>
                                                                    <span className="text-xs">#{j + 1}</span>
                                                                    <Image
                                                                        src={imageB.src || "/placeholder.svg"}
                                                                        alt={imageB.alt}
                                                                        width={34}
                                                                        height={34}
                                                                        className="rounded"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2 min-w-[120px]">
                                                                    <Progress value={imageImageSimilarities[i][j] * 100} className="h-2 flex-1" />
                                                                    <span className="font-mono text-xs min-w-[45px]">
                                                                        {(imageImageSimilarities[i][j] * 100).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-4">
                                        <p>Select 2 or more images to see similarity calculations</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
