import { FeatureType } from "@/components/middle-panel"

// Feature extraction functions
export async function generateFeatureVector(featureType: FeatureType, imageUrl: string) {
    const dimensions = {
        resnet: 2048,
        vgg: 4096,
        mobilenet: 1024,
        sift: 128,
        hog: 3780,
        lbp: 256,
        color_histogram: 768,
        orb: 256,
    }

    const vector = []
    const dim = dimensions[featureType]

    if (featureType === "color_histogram") {
        return await generateColorHistogramFromImage(imageUrl)
    }

    // Generate different patterns for different feature types
    for (let i = 0; i < dim; i++) {
        let value
        switch (featureType) {
            case "resnet":
            case "vgg":
            case "mobilenet":
                // Deep learning features: normalized values around 0
                value = (Math.random() - 0.5) * 2
                break
            case "sift":
            case "orb":
                // Keypoint descriptors: typically 0-255 range, normalized
                value = Math.random()
                break
            case "hog":
                // HOG: gradient magnitudes, typically positive
                value = Math.random() * 2
                break
            case "lbp":
                // LBP: histogram bins, normalized
                value = Math.random()
                break
            default:
                value = Math.random()
        }
        vector.push(value)
    }

    return vector
}


// Helper function to generate a color histogram from an image URL/Data URI
async function generateColorHistogramFromImage(
    imageUrl: string,
    binsPerChannel: number = 256
): Promise<number[]> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Important for loading images from other domains if needed

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                console.error("Could not get 2D context from canvas");
                // Return a zero vector of the expected size if canvas fails
                resolve(new Array(binsPerChannel * 3).fill(0));
                return;
            }

            ctx.drawImage(img, 0, 0);

            let imageData;
            try {
                imageData = ctx.getImageData(0, 0, img.width, img.height);
            } catch (e) {
                console.error("Error getting image data (possibly CORS issue if not using crossOrigin Anonymous and image is remote):", e);
                // Return a zero vector of the expected size on error
                resolve(new Array(binsPerChannel * 3).fill(0));
                return;
            }

            const data = imageData.data;
            const numPixels = img.width * img.height;

            if (numPixels === 0) {
                resolve(new Array(binsPerChannel * 3).fill(0)); // Empty image
                return;
            }

            const rHist = new Array(binsPerChannel).fill(0);
            const gHist = new Array(binsPerChannel).fill(0);
            const bHist = new Array(binsPerChannel).fill(0);

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // const a = data[i + 3]; // Alpha channel, usually ignored for basic color histogram

                // Assuming binsPerChannel is 256, direct mapping
                if (binsPerChannel === 256) {
                    rHist[r]++;
                    gHist[g]++;
                    bHist[b]++;
                } else {
                    // If binsPerChannel is different, you'd need to map values to bins
                    // e.g., rHist[Math.floor(r * binsPerChannel / 256)]++;
                    // For simplicity, we'll stick to 256 for now as it matches the dimension
                    rHist[Math.floor(r * binsPerChannel / 256)]++;
                    gHist[Math.floor(g * binsPerChannel / 256)]++;
                    bHist[Math.floor(b * binsPerChannel / 256)]++;
                }
            }

            // Normalize each histogram individually by the number of pixels
            for (let i = 0; i < binsPerChannel; i++) {
                rHist[i] /= numPixels;
                gHist[i] /= numPixels;
                bHist[i] /= numPixels;
            }

            // Concatenate the normalized histograms
            const combinedHist = [...rHist, ...gHist, ...bHist];
            resolve(combinedHist);
        };

        img.onerror = (err) => {
            console.error("Error loading image for histogram:", imageUrl, err);
            // Return a zero vector of the expected size on image load error
            resolve(new Array(binsPerChannel * 3).fill(0));
        };

        img.src = imageUrl; // `description` is the imageUrl
    });
}
