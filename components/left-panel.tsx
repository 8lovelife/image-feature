"use client"

import Image from "next/image"
import { Upload, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AspectRatio } from "@radix-ui/react-aspect-ratio"

// Example image data
const exampleImages = [
    { id: 1, src: "/images/samples/cat.png", alt: "Cat", description: "A cute orange cat" },
    { id: 2, src: "/images/samples/dog.png", alt: "Dog", description: "Golden retriever running on grass" },
    { id: 3, src: "/images/samples/landscape.png", alt: "Landscape", description: "Beautiful mountains and lake" },
    { id: 4, src: "/images/samples/city.png", alt: "City", description: "Modern city skyline" },
    { id: 5, src: "/images/samples/flowers.png", alt: "Flowers", description: "Blooming cherry blossoms" },
    { id: 6, src: "/images/samples/food.png", alt: "Food", description: "Delicious Italian pasta" },
    // { id: 7, src: "/images/samples/car.png", alt: "Car", description: "Vintage red sports car" },
    // { id: 8, src: "/images/samples/instrument.png", alt: "Instrument", description: "Acoustic guitar leaning on a chair" },

]

interface ExampleImage {
    id: number;
    src: string;
    alt: string;
    description: string; // This will be passed to onImageSelect and used for feature extraction
}


interface LeftPanelProps {
    onImageSelect: (image: ExampleImage) => void;
}

export default function LeftPanel({ onImageSelect }: LeftPanelProps) {
    // Handler for file input if you implement custom upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                // Basic client-side validation (optional)
                if (!file.type.startsWith('image/')) {
                    console.warn(`File ${file.name} is not an image.`);
                    return;
                }
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    console.warn(`File ${file.name} is too large.`);
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    // For a real upload, you'd likely upload to a server
                    // For this demo, we'll create an ExampleImage-like object
                    // The 'vector' would be generated after selection.
                    const uploadedImage: ExampleImage = {
                        id: Date.now() + Math.random(), // Temporary unique ID
                        src: dataUrl, // Use data URL for immediate preview
                        alt: file.name,
                        description: file.name, // For color_histogram, the Data URL is the 'description'
                    };
                    onImageSelect(uploadedImage); // Pass the dataURL for processing
                    console.log(`Uploaded ${file.name}`);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    return (
        // Use flexbox for the overall panel to manage height
        <div className="h-full p-2 md:p-4 flex flex-col"> {/* Added flex flex-col */}
            <Card className="h-full flex flex-col overflow-hidden"> {/* Added flex flex-col and overflow-hidden */}
                <CardHeader className="flex-shrink-0"> {/* Prevent header from shrinking */}
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <ImageIcon className="h-5 w-5" />
                        Example Images
                    </CardTitle>
                </CardHeader>
                {/* CardContent will take remaining space and allow ScrollArea to be 100% of that */}
                <CardContent className="flex-grow overflow-y-auto p-2 md:p-4"> {/* flex-grow and overflow-y-auto (ScrollArea handles its own scroll) */}
                    <ScrollArea className="h-full w-full"> {/* h-full and w-full to fill CardContent */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-2 md:gap-2">
                            {exampleImages.map((image) => (
                                <div
                                    key={image.id}
                                    className="cursor-pointer group rounded-lg border-2 border-transparent hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
                                    onClick={() => onImageSelect(image)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onImageSelect(image); }}
                                    tabIndex={0} // Make it focusable
                                >
                                    {/* AspectRatio ensures image container maintains shape before image loads */}
                                    <AspectRatio ratio={1 / 1} className="bg-muted rounded-md overflow-hidden">
                                        <Image
                                            src={image.src} // Removed query params, assuming images are pre-sized or Next/Image handles it
                                            alt={image.alt}
                                            fill // Use fill to make image cover the AspectRatio container
                                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" // Adjust sizes for better optimization
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                                            <span className="text-white text-xs font-semibold truncate">{image.alt}</span>
                                            <span className="text-gray-300 text-[10px] leading-tight line-clamp-2">{image.description}</span>
                                        </div>
                                    </AspectRatio>
                                </div>
                            ))}
                        </div>

                        {/* Upload Area */}
                        <div className="mt-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg p-4 md:p-6 text-center cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" // Hidden input takes over click
                                onChange={handleFileUpload}
                                id="imageUpload"
                            />
                            <label htmlFor="imageUpload" className="flex flex-col items-center justify-center cursor-pointer"> {/* Label for accessibility */}
                                <Upload className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                                    Click to upload or drag & drop
                                </p>
                                <p className="text-[10px] md:text-xs text-muted-foreground/70">Max 5MB per image</p>
                                {/* The visible button is now just for show or if JS fails for input click */}
                                {/* <Button variant="outline" size="sm" className="mt-2 pointer-events-none">
                                    Choose Files
                                </Button> */}
                            </label>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}