"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { StaticDistributionPlotProps, DistributionBin } from "@/types/plots"

export function StaticDistributionPlot({ 
  groupName, 
  itemName, 
  data, 
  description, 
  unit,
  color = "#8884d8"
}: StaticDistributionPlotProps) {
  // Get the last timestep data to create a snapshot of current state
  const lastTimestep = data[data.length - 1];
  
  // Get all agents for this group from the last timestep
  const agents = lastTimestep.filter(agent => agent._agent_group === groupName);
  
  // Collect all values (assuming they're numeric)
  const numericValues = agents
    .map(agent => Number(agent[itemName]))
    .filter(value => !isNaN(value));
  
  // If we don't have enough data or it's not numeric, return empty state
  if (numericValues.length < 2) {
    return (
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>
            {itemName} <span className="text-gray-900 text-sm font-normal mr-2">{unit ? `(${unit})` : ''}</span> <span className="text-gray-500 text-sm font-normal">{groupName}</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Not enough numeric data to display distribution</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate min and max values
  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);
  
  // Determine number of bins using Sturges' formula (simple rule of thumb)
  const numberOfBins = Math.ceil(Math.log2(numericValues.length)) + 1;
  
  // Calculate bin width
  const binWidth = (maxValue - minValue) / numberOfBins;
  
  // Create bins
  const bins: DistributionBin[] = Array.from({ length: numberOfBins }, (_, i) => {
    const min = minValue + i * binWidth;
    const max = min + binWidth;
    return {
      min,
      max,
      count: 0
    };
  });
  
  // Count values in each bin
  numericValues.forEach(value => {
    // Find the bin this value belongs to
    // Special case for the maximum value - put it in the last bin
    const binIndex = value === maxValue 
      ? numberOfBins - 1 
      : Math.floor((value - minValue) / binWidth);
    
    if (binIndex >= 0 && binIndex < bins.length) {
      bins[binIndex].count++;
    }
  });
  
  // Format bin labels
  const chartData = bins.map((bin) => ({
    bin: `${bin.min.toFixed(1)}-${bin.max.toFixed(1)}`,
    count: bin.count,
    fill: color
  }));
  
  // Create chart config
  const chartConfig: ChartConfig = {
    count: {
      label: "Count",
      color: color
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {itemName} <span className="text-gray-900 text-sm font-normal mr-2">{unit ? `(${unit})` : ''}</span> <span className="text-gray-500 text-sm font-normal">{groupName}</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="-ml-22 -mr-4 sm:ml-0">
        <ChartContainer config={chartConfig}>
          <BarChart 
            accessibilityLayer 
            data={chartData}
            margin={{
              top: 20,
              right: 15,
              left: 20,
              bottom: 40
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis 
              dataKey="bin" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tickMargin={10}
              label={{ 
                value: unit || '', 
                position: 'insideBottom', 
                offset: -25 
              }}
            />
            <YAxis
              className="hidden sm:block"
              tickLine={false}
              axisLine={false}
              label={{ 
                value: 'Count', 
                position: 'insideLeft', 
                angle: -90 
              }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="count" 
              fill={color} 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 