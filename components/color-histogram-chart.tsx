import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Removed 'Cell' as it's not used in this specific setup

interface HistogramChartProps {
    featureVector: number[]; // The full histogram vector (e.g., RRR...GGG...BBB...)
    binsPerChannel?: number;  // Number of bins for each color channel (e.g., 256)
    channelNames?: string[];  // Names for the channels (e.g., ["Red", "Green", "Blue"])
    channelColors?: string[]; // Colors for the bars of each channel
}

const ColorHistogramChart: React.FC<HistogramChartProps> = ({
    featureVector,
    binsPerChannel = 256, // Default to 256 bins per channel
    channelNames = ["R", "G", "B"], // Default channel names
    channelColors = ["#FF6384", "#36A2EB", "#4BC07A"] // Default colors (Softer Red, Blue, Green)
}) => {
    // Validate the input featureVector
    if (!featureVector || featureVector.length !== binsPerChannel * 3) {
        return <p>Histogram data is insufficient or incorrectly formatted.</p>;
    }

    // Prepare data for the chart
    // Recharts expects an array of objects, where each object represents a point on the X-axis (a bin index here)
    // and properties of that object represent different series (R, G, B values for that bin).
    const data = [];
    for (let i = 0; i < binsPerChannel; i++) {
        // Create an entry for each bin index (0 to binsPerChannel-1)
        // 'name' will be used as the X-axis label (bin index)
        const entry: { name: string; R?: number; G?: number; B?: number } = { name: `${i}` };

        // Assign R, G, B values from the featureVector to the current bin entry
        // featureVector[i]                            is the R value for bin i
        // featureVector[i + binsPerChannel]           is the G value for bin i
        // featureVector[i + binsPerChannel * 2]       is the B value for bin i
        if (featureVector[i] !== undefined) entry.R = featureVector[i];
        if (featureVector[i + binsPerChannel] !== undefined) entry.G = featureVector[i + binsPerChannel];
        if (featureVector[i + binsPerChannel * 2] !== undefined) entry.B = featureVector[i + binsPerChannel * 2];

        data.push(entry);
    }

    return (
        // ResponsiveContainer ensures the chart adapts to its parent container's size
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data} // The processed data for charting
                margin={{ // Margins around the chart
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 20, // Increased bottom margin for X-axis label
                }}
                barGap={0} // Gap between bars of the same category (e.g., R, G, B for bin 128)
                barCategoryGap="10%" // Gap between different categories (e.g., bin 128 vs bin 129)
            >
                {/* Grid lines for better readability */}
                {/* <CartesianGrid strokeDasharray="3 3" /> */}

                {/* X-axis configuration */}
                <XAxis
                    dataKey="name" // 'name' property from our data objects (0-255)
                    label={{ value: 'Pixel Intensity (Bin Index)', position: 'insideBottom', dy: 18, fontSize: 12 }} // Label for X-axis, dy for offset
                    interval="preserveStartEnd" // Ensures 0 and max bin index are shown, good for sparse data
                // You might want to customize tick rendering for large number of bins, e.g., show every 32nd tick
                // tickFormatter={(tick, index) => index % 32 === 0 ? tick : ''}
                />

                {/* Y-axis configuration */}
                <YAxis
                    label={{ value: 'Normalized Frequency', angle: -90, position: 'insideLeft', offset: -10, dy: 50, fontSize: 12 }} // Label for Y-axis
                    tickFormatter={(tickValue: number) => tickValue.toFixed(4)} // Format Y-axis tick values
                    domain={[0, 'auto']} // Ensure Y-axis starts at 0, 'auto' for max
                />

                {/* Tooltip displayed on hover */}
                <Tooltip
                    formatter={(value: number, name: string, props) => [value.toFixed(5), name]} // Format tooltip values
                />

                {/* Legend to identify R, G, B bars */}
                <Legend
                    layout="horizontal"
                    verticalAlign="middle"
                    wrapperStyle={{
                        position: 'relative',
                        bottom: 24,
                        right: 80,
                        margin: 0,
                    }}
                />

                {/* Bar definitions for each color channel */}
                <Bar dataKey="R" name={channelNames[0]} fill={channelColors[0]} stackId="stack" /> {/* stackId can be used to stack bars if desired, remove if you want grouped */}
                <Bar dataKey="G" name={channelNames[1]} fill={channelColors[1]} stackId="stack" />
                <Bar dataKey="B" name={channelNames[2]} fill={channelColors[2]} stackId="stack" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default ColorHistogramChart;