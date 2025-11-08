"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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
  ChartTooltip,
} from "@/components/ui/chart"
import { CustomLegendContent, CustomTooltipContent } from "@/components/chart-custom"
import { TimeSeriesPlotProps, ChartDataPoint } from "@/types/plots"
import { AgentData } from "@/types/agent"

export function TimeSeriesPlot({ 
  groupName, 
  itemName, 
  data, 
  stepUnit, 
  description, 
  unit,
  maxAgentSamples = 200 // Default to 200 agent samples
}: TimeSeriesPlotProps) {
  
  // Get all agent IDs for this group
  const allAgentIds = [...new Set(data[0]
    .filter((agent: AgentData) => agent._agent_group === groupName)
    .map((agent: AgentData) => agent._id))] as number[];
  
  // Sample agent IDs if there are too many
  const sampleAgentIds = allAgentIds.length > maxAgentSamples
    ? allAgentIds
        .sort(() => 0.5 - Math.random()) // Shuffle array
        .slice(0, maxAgentSamples)       // Take first maxAgentSamples elements
    : allAgentIds;
  
  // Transform simulation data into chart format
  const chartData = data.map(timestep => {
    // Get all agents for this group at this timestep
    const agents = timestep.filter((agent: AgentData) => agent._agent_group === groupName);
    
    // Create an object with step and all agent values
    const dataPoint: ChartDataPoint = {
      step: agents[0]?._step // All agents in same timestep have same _step
    };
    
    // Calculate mean across ALL agents
    const values: number[] = [];
    agents.forEach((agent: AgentData) => {
      const value = Number(agent[itemName]);
      values.push(value);
      
      // Only add sampled agents to the data point
      if (sampleAgentIds.includes(agent._id)) {
        dataPoint[`agent_${agent._id}`] = value;
      }
    });
    
    // Calculate mean across ALL agents (not just sampled ones)
    if (values.length > 0) {
      dataPoint.mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    return dataPoint;
  });

  // Create chart config for mean only
  const chartConfig: ChartConfig = {
    mean: {
      label: "Mean",
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
      <CardContent className="-ml-24 -mr-2 sm:-ml-8">
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 40,
              right: 20,
              top: 20,
              bottom: 20,
            }}
          >
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
              tickFormatter={(value) => `${Number(value).toFixed(1)}`}
              domain={['dataMin', 'dataMax']}
              tickCount={6}
              label={{ value: `${unit ? unit : ''}`, position: 'insideLeft', angle: -90, offset: -2 }}
            />
            <ChartTooltip 
              cursor={false} 
              content={<CustomTooltipContent stepUnit={stepUnit} unit={unit} />} 
            />
            <ChartLegend content={<CustomLegendContent />} />
            {sampleAgentIds.map((agentId) => (
              <Line
                key={`agent_${agentId}`}
                dataKey={`agent_${agentId}`}
                type="monotone"
                stroke="#D1D5DB" // Single color for all lines (lighter gray)
                strokeWidth={2}
                dot={false}
              />
            ))}
            {/* Only show mean line when there's more than one agent */}
            {allAgentIds.length > 1 && (
              <Line
                dataKey="mean"
                type="monotone"
                stroke="#8B5CF6" // Purple for the mean line
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 