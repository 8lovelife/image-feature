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
        <div className="h-full flex flex-col">
            {/* 响应式的特征提取设置区域 */}
            <div className="flex-shrink-0 p-2 sm:p-3 lg:p-4 border-b">
                <Card>
                    <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">Feature Extraction</span>
                            <span className="hidden sm:inline">Methods</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2 sm:space-y-3">
                        {/* 主要控制区域 */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Select value={currentFeatureType} onValueChange={onFeatureTypeChange}>
                                <SelectTrigger className="w-full sm:flex-1">
                                    <SelectValue placeholder="Select method" />
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
                                            Traditional CV
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

                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8 px-2 sm:px-3 flex-shrink-0 w-full sm:w-auto"
                                asChild
                            >
                                <a href={currentFeature?.repository} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    <span>Repository</span>
                                </a>
                            </Button>
                        </div>

                        {/* 详细信息区域 - 可折叠显示 */}
                        {currentFeature && (
                            <div className="space-y-1 text-xs text-muted-foreground">
                                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                                    {currentFeature.description}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                    <div className="flex items-center gap-1">
                                        <strong className="text-foreground">Dimensions:</strong>
                                        <Badge variant="secondary" className="text-xs">
                                            {currentFeature.dimensions}
                                        </Badge>
                                    </div>
                                    <div className="hidden lg:flex items-center gap-1 min-w-0">
                                        <strong className="text-foreground flex-shrink-0">Paper:</strong>
                                        <span className="truncate text-xs">{currentFeature.paper}</span>
                                    </div>
                                </div>
                                {/* 在小屏幕上显示简化的论文信息 */}
                                <div className="lg:hidden">
                                    <div className="flex items-start gap-1">
                                        <strong className="text-foreground flex-shrink-0">Paper:</strong>
                                        <span className="text-xs leading-tight">{currentFeature.paper}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="p-2 sm:p-3 lg:p-4 space-y-3 sm:space-y-4">
                        {/* Selected Images */}
                        <Card>
                            <CardHeader className="pb-2 sm:pb-3">
                                <CardTitle className="text-sm sm:text-base">
                                    Selected Images ({selectedImages.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {selectedImages.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-4 sm:py-6">
                                        <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs sm:text-sm">Select images from the left panel</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                                        {selectedImages.map((image, index) => (
                                            <div key={image.id} className="relative group">
                                                <Image
                                                    src={image.src || "/placeholder.svg"}
                                                    alt={image.alt}
                                                    width={120}
                                                    height={120}
                                                    className="w-full h-16 sm:h-20 lg:h-24 object-cover rounded-lg"
                                                />
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            </CardContent>
                        </Card>

                        {/* Similarity Results */}
                        <Card>
                            <CardHeader className="pb-2 sm:pb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <CardTitle className="text-sm sm:text-base">
                                        <span className="hidden sm:inline">Image-To-Image</span>
                                        <span className="sm:hidden">Image</span> Similarities
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                        {currentFeature?.label}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {selectedImages.length > 1 && imageImageSimilarities.length > 0 ? (
                                    <div className="space-y-2 sm:space-y-3">
                                        {selectedImages.map((imageA, i) => (
                                            <div key={`row-${i}`} className="space-y-2">
                                                {selectedImages.map((imageB, j) => {
                                                    if (i >= j) return null
                                                    if (!imageImageSimilarities[i] || imageImageSimilarities[i][j] === undefined) return null
                                                    return (
                                                        <div key={`${i}-${j}`} className="flex items-center gap-2 text-sm">
                                                            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                                <Image
                                                                    src={imageA.src || "/placeholder.svg"}
                                                                    alt={imageA.alt}
                                                                    width={24}
                                                                    height={24}
                                                                    className="rounded flex-shrink-0 sm:w-7 sm:h-7"
                                                                />
                                                                <span className="text-xs flex-shrink-0">#{i + 1}</span>
                                                                <span className="text-xs flex-shrink-0">↔</span>
                                                                <span className="text-xs flex-shrink-0">#{j + 1}</span>
                                                                <Image
                                                                    src={imageB.src || "/placeholder.svg"}
                                                                    alt={imageB.alt}
                                                                    width={24}
                                                                    height={24}
                                                                    className="rounded flex-shrink-0 sm:w-7 sm:h-7"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2 min-w-[80px] sm:min-w-[100px] lg:min-w-[120px] flex-shrink-0">
                                                                <Progress value={imageImageSimilarities[i][j] * 100} className="h-2 flex-1" />
                                                                <span className="font-mono text-xs min-w-[35px] sm:min-w-[40px] lg:min-w-[45px] text-right">
                                                                    {(imageImageSimilarities[i][j] * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-4 sm:py-6">
                                        <p className="text-xs sm:text-sm">Select 2+ images to see similarities</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}