"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { histogramPalette } from "@/utils/colorPalettes"

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { HistogramPlotProps } from "@/types/plots"
import { AgentData } from "@/types/agent"

export function HistogramPlot({ 
  groupName, 
  itemName, 
  data, 
  stepUnit, 
  description, 
  unit, 
  colorPalette = histogramPalette,
  maxTimeSteps = 100 // Default to 100 timesteps
}: HistogramPlotProps) {  
  // Sample timesteps if there are too many
  const sampleData = data.length > maxTimeSteps
    ? sampleTimeSteps(data, maxTimeSteps)
    : data;
  
  // Transform simulation data into chart format
  const chartData = sampleData.map(timestep => {
    // Get all agents for this group at this timestep
    const agents = timestep.filter((agent: AgentData) => agent._agent_group === groupName);
    
    // Count occurrences of each value
    const counts = agents.reduce((acc: { [key: string]: number }, agent: AgentData) => {
      const value = agent[itemName];
      acc[String(value)] = (acc[String(value)] || 0) + 1;
      return acc;
    }, {});

    return {
      step: agents[0]?._step,
      ...counts
    };
  });

  // Get unique values to create config
  const uniqueValues = [...new Set(sampleData.flatMap(timestep => 
    timestep
      .filter((agent: AgentData) => agent._agent_group === groupName)
      .map((agent: AgentData) => String(agent[itemName]))
  ))];

  // Create chart config
  const chartConfig: ChartConfig = uniqueValues.reduce((config: ChartConfig, value, index) => {
    // Use custom color if available, otherwise generate one
    const color = colorPalette[index] || 
      `hsl(${(uniqueValues.indexOf(value) * 360) / uniqueValues.length}, 70%, 50%)`;
    
    config[value] = {
      label: value.toString(),
      color: color,
    };
    return config;
  }, {} as ChartConfig);

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
      <CardContent className="-ml-15 sm:ml-0">
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="step"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              minTickGap={32}
              tickFormatter={(value) => `${stepUnit} ${Number(value).toFixed(0)}`}
            />
            <YAxis
              className="hidden sm:block"
              tickLine={false}
              axisLine={false}
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => `${Number(value).toFixed(0)}`}
              tickCount={6}
              label={{ value: `${unit ? unit : ''}`, position: 'insideLeft', angle: -90 }}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            {uniqueValues.map((value, index) => (
              <Bar
                key={value}
                dataKey={value}
                stackId="a"
                fill={chartConfig[value].color}
                radius={[
                  index === uniqueValues.length - 1 ? 4 : 0,
                  index === uniqueValues.length - 1 ? 4 : 0,
                  index === 0 ? 4 : 0,
                  index === 0 ? 4 : 0,
                ]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Helper function to sample timesteps preserving important ones
function sampleTimeSteps(data: AgentData[][], maxSamples: number): AgentData[][] {
  if (data.length <= maxSamples) {
    return data;
  }
  
  // Always include first and last timestep
  const sampledIndices = new Set<number>([0, data.length - 1]);
  
  // Calculate interval for regular sampling
  const interval = Math.floor(data.length / (maxSamples - 2));
  
  // Add indices at regular intervals
  for (let i = interval; i < data.length - 1; i += interval) {
    if (sampledIndices.size >= maxSamples) break;
    sampledIndices.add(i);
  }
  
  // Convert back to array and sort
  const indices = Array.from(sampledIndices).sort((a, b) => a - b);
  
  // Return sampled timesteps
  return indices.map(index => data[index]);
} 