// components/ImageFeatureDisplay.tsx
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"; // shadcn/ui button
import { ChevronDown, ChevronRight } from "lucide-react"; // Icons

// (Your interface definitions remain the same)
interface ImageWithFeatures {
    id: number | string;
    name?: string;
    description?: string;
    features: Partial<Record<string /* FeatureType string */, number[]>>;
}

interface ImageFeatureDisplayProps {
    image: ImageWithFeatures;
    featureVector: number[] | undefined;
}

const ImageFeatureDisplay: React.FC<ImageFeatureDisplayProps> = ({
    image, // 'image' prop is passed but not directly used in this snippet,
    // ensure it's used if needed for other parts or remove if not.
    featureVector,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const previewLength = 20;

    if (!featureVector || !Array.isArray(featureVector)) {
        return (
            <div className="bg-muted p-3 rounded-lg mb-2">
                <span className="font-mono text-xs text-muted-foreground">
                    Feature vector not computed or unavailable
                </span>
            </div>
        );
    }

    const displayVector = isExpanded ? featureVector : featureVector.slice(0, previewLength);
    const needsExpansion = featureVector.length > previewLength;

    return (
        <div className="bg-muted p-3 rounded-lg mb-2">
            {/* Flex container to align vector text and button */}
            <div className="flex justify-between items-start gap-2"> {/* items-start to align top if text wraps */}
                {/* Vector text takes available space */}
                <div className="font-mono text-xs break-all flex-grow"> {/* flex-grow allows it to take space */}
                    [
                    {displayVector.map((v, index) => (
                        <React.Fragment key={index}>
                            {v.toFixed(4)}
                            {index < displayVector.length - 1 ? ", " : ""}
                        </React.Fragment>
                    ))}
                    {!isExpanded && needsExpansion && ", ..."}
                    ]
                </div>

                {/* Button is on the right and does not grow/shrink */}
                {needsExpansion && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleExpand}
                        className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0" // shrink-0 to prevent shrinking
                    // Removed mt-2 as it's now part of the flex layout vertically centered by items-start/items-center
                    >
                        {isExpanded ? (
                            <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Collapse
                            </>
                        ) : (
                            <>
                                <ChevronRight className="h-3 w-3 mr-1" />
                                {/* For very long numbers, button text might wrap. 
                                    You might shorten this or make button wider if needed.
                                    Alternatively, just show "Expand" / "Collapse" */}
                                Expand ({featureVector.length})
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ImageFeatureDisplay;