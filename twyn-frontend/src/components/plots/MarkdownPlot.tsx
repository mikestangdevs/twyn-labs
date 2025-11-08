import { TimeSeriesPlot } from "./TimeSeriesPlot";
import { HistogramPlot } from "./HistogramPlot";
import { PiePlot } from "./PiePlot";
import { StaticDistributionPlot } from "./StaticDistributionPlot";
import { analyzePlotTypes } from "@/lib/plotting";
import { histogramPalette } from "@/utils/colorPalettes";
import { SimulationConfigData } from "@/types/simulationApiTypes";
import { AgentData } from "@/types/agent";
import { MarkdownPlotProps } from "@/types/plots";

export function MarkdownPlot({ 
  src, 
  config, 
  simData, 
  maxAgentSamples = 200,
  maxTimeSteps = 100
}: MarkdownPlotProps) {
  // Parse the src string to get item name and group name
  // Format is "itemName&groupName"
  const [itemName, groupName] = src.split('&');
  
  if (!groupName || !itemName) {
    return <div className="text-red-500">Invalid plot reference: {src}</div>;
  }

  // Analyze plot types from config
  const plotInfos = analyzePlotTypes(config, simData as AgentData[][]);
  
  // Find the matching plot info
  const plotInfo = plotInfos.find(
    info => info.groupName === groupName && info.itemName === itemName
  );

  if (!plotInfo) {
    return <div className="text-red-500">No plot configuration found for: {src}</div>;
  }
  
  // Get description and unit from config if available
  const itemConfig = config?.agent_groups?.[groupName]?.[plotInfo.itemType === 'action' ? 'actions' : 'variables']?.[itemName];
  const description = itemConfig?.description;
  const unit = itemConfig?.unit;

  // Render the appropriate plot based on the plot type
  switch (plotInfo.plotType) {
    case 'time series':
      return (
        <TimeSeriesPlot
          groupName={groupName}
          itemName={itemName}
          data={simData}
          stepUnit={config.step_unit || ''}
          description={description}
          unit={unit}
          maxAgentSamples={maxAgentSamples}
        />
      );
    case 'stacked histogram':
      return (
        <HistogramPlot
          groupName={groupName}
          itemName={itemName}
          data={simData}
          stepUnit={config.step_unit || ''}
          description={description}
          unit={unit}
          colorPalette={histogramPalette}
          maxTimeSteps={maxTimeSteps}
        />
      );
    case 'static distribution':
      return (
        <StaticDistributionPlot
          groupName={groupName}
          itemName={itemName}
          data={simData}
          description={description}
          unit={unit}
          color={histogramPalette[0]}
        />
      );
    case 'pie chart':
      return (
        <PiePlot
          groupName={groupName}
          itemName={itemName}
          data={simData}
          description={description}
          unit={unit}
          colorPalette={histogramPalette}
        />
      );
    default:
      return <div className="text-red-500">Unsupported plot type for: {src}</div>;
  }
} 