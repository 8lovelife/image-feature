"use client"

import { useState, useEffect } from "react"
import { BarChart3 } from "lucide-react"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import LeftPanel from "@/components/left-panel"
import MiddlePanel, { type FeatureType } from "@/components/middle-panel"
import RightPanel from "@/components/right-panel"
import { generateFeatureVector } from "@/lib/feature-vector"


// Calculate cosine similarity
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
    return dotProduct / (magnitudeA * magnitudeB)
}

interface SelectedImage {
    id: number
    src: string
    alt: string
    description: string
    features: { [key: string]: number[] }
}

export default function CLIPTeachingWebsite() {
    const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
    const [currentFeatureType, setCurrentFeatureType] = useState<FeatureType>("resnet")
    const [imageImageSimilarities, setImageImageSimilarities] = useState<number[][]>([])

    const handleImageSelect = async (image: any) => {
        // Generate features for all open source feature types
        const featureTypes: FeatureType[] = [
            "resnet",
            "vgg",
            "mobilenet",
            "sift",
            "hog",
            "lbp",
            "color_histogram",
            "orb"
        ];
        // Process all feature types in parallel
        const featurePromises = featureTypes.map(async (featureType) => {
            const featureVector = await generateFeatureVector(featureType, image.src)
            return { featureType, featureVector }
        })

        const featureResults = await Promise.all(featurePromises)
        const features: { [key: string]: number[] } = {}
        featureResults.forEach(({ featureType, featureVector }) => {
            features[featureType] = featureVector
        })
        const newImage = { ...image, features }

        console.log("new image is " + JSON.stringify(newImage))

        setSelectedImages((prev) => {
            const exists = prev.find((img) => img.id === image.id)
            if (exists) return prev
            return [...prev, newImage]
        })
    }

    const handleRemoveImage = (id: number) => {
        setSelectedImages((prev) => prev.filter((img) => img.id !== id))
    }

    const handleFeatureTypeChange = (featureType: FeatureType) => {
        setCurrentFeatureType(featureType)
    }

    // Calculate image-to-image similarities when images or feature type changes
    useEffect(() => {
        if (selectedImages.length > 1) {
            const similarities: number[][] = []
            for (let i = 0; i < selectedImages.length; i++) {
                similarities[i] = []
                for (let j = 0; j < selectedImages.length; j++) {
                    if (i === j) {
                        similarities[i][j] = 1.0 // Self similarity
                    } else {
                        const featuresA = selectedImages[i].features[currentFeatureType]
                        const featuresB = selectedImages[j].features[currentFeatureType]
                        if (featuresA && featuresB) {
                            similarities[i][j] = cosineSimilarity(featuresA, featuresB)
                        } else {
                            similarities[i][j] = 0
                        }
                    }
                }
            }
            setImageImageSimilarities(similarities)
        } else {
            setImageImageSimilarities([])
        }
    }, [selectedImages, currentFeatureType])

    return (
        <div className="h-screen w-full p-2 flex">
            {/* Header */}
            {/* <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <div className="flex items-center space-x-2">
                        <BarChart3 className="h-6 w-6" />
                        <h1 className="text-lg font-semibold">Image Feature Extraction Platform</h1>
                    </div>
                </div>
            </header> */}

            {/* Main Content */}
            {/* <div className="flex-1"> */}
            <ResizablePanelGroup direction="horizontal" className="flex h-full w-full rounded-lg border">
                {/* Left Panel */}
                <ResizablePanel defaultSize={10} minSize={10} maxSize={15}>
                    <LeftPanel onImageSelect={handleImageSelect} />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Middle Panel */}
                <ResizablePanel defaultSize={15} minSize={27} maxSize={30}>
                    <MiddlePanel
                        selectedImages={selectedImages}
                        currentFeatureType={currentFeatureType}
                        imageImageSimilarities={imageImageSimilarities}
                        onRemoveImage={handleRemoveImage}
                        onFeatureTypeChange={handleFeatureTypeChange}
                    />
                </ResizablePanel>

                <ResizableHandle withHandle />


                {/* Right Panel */}
                <ResizablePanel defaultSize={30} minSize={35}>
                    <RightPanel selectedImages={selectedImages} currentFeatureType={currentFeatureType} />
                </ResizablePanel>
            </ResizablePanelGroup>
            {/* </div> */}
        </div>
    )
}
