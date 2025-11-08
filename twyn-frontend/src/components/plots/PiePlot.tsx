"use client"

import { Cell, Pie, PieChart } from "recharts"

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
import { PiePlotProps, PieDataPoint } from "@/types/plots"

export function PiePlot({ 
  groupName, 
  itemName, 
  data, 
  description, 
  unit,
  colorPalette = [
    "#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", 
    "#a4de6c", "#d0ed57", "#ffc658", "#ff8042",
    "#ff6361", "#bc5090", "#58508d", "#003f5c"
  ]
}: PiePlotProps) {
  // Get the last timestep data to create a snapshot of current state
  const lastTimestep = data[data.length - 1];
  
  // Get all agents for this group from the last timestep
  const agents = lastTimestep.filter(agent => agent._agent_group === groupName);
  
  // Count occurrences of each value
  const valueCounts: Record<string, number> = {};
  agents.forEach(agent => {
    const value = String(agent[itemName]);
    valueCounts[value] = (valueCounts[value] || 0) + 1;
  });
  
  // Transform counts into pie chart data format
  const chartData: PieDataPoint[] = Object.entries(valueCounts).map(([name, value]) => ({
    name,
    value
  }));
  
  // Create chart config
  const chartConfig: ChartConfig = chartData.reduce((config: ChartConfig, dataPoint, index) => {
    // Use custom color if available, otherwise use default
    const color = colorPalette[index % colorPalette.length];
    
    config[dataPoint.name] = {
      label: dataPoint.name,
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
      <CardContent>
        <ChartContainer config={chartConfig}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={chartConfig[entry.name]?.color || colorPalette[index % colorPalette.length]} 
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 