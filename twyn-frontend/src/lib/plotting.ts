import { SimulationConfigData } from "@/types/simulationApiTypes";
import { AgentData } from "@/types/agent";


// Types
interface PlotInfo {
  groupName: string;
  itemName: string;
  itemType: 'variable' | 'action';
  plotType: 'time series' | 'stacked histogram' | 'static distribution' | 'pie chart';
}


// Helper functions
function isLikelyCategorical(
  values: unknown[],
  threshold = 0.01,
  maxCategories = 10
): boolean {
  // Count unique values
  const uniqueValues = new Set(values);
  const nUnique = uniqueValues.size;
  const nTotal = values.length;
  
  return (nUnique / nTotal < threshold) && (nUnique <= maxCategories);
}


function inferDerivedVariableType(
  values: unknown[]
): 'continuous' | 'categorical' | 'text' | 'unknown' {
  if (values.length === 0) {
    return 'unknown';
  }
  
  // Get the first non-null value
  const firstValue = values.find(v => v !== null && v !== undefined);
  
  if (firstValue === undefined) {
    return 'unknown';
  }
  
  // Check type and determine appropriate category
  if (typeof firstValue === 'number') {
    return isLikelyCategorical(values) ? 'categorical' : 'continuous';
  } else if (typeof firstValue === 'boolean') {
    return 'categorical';
  } else if (typeof firstValue === 'string') {
    return isLikelyCategorical(values) ? 'categorical' : 'text';
  } else {
    return 'unknown';
  }
}


const DYNAMIC_PLOT_MAPPING: Record<string, 'time series' | 'stacked histogram' | null> = {
  'continuous': 'time series',
  'categorical': 'stacked histogram',
  'text': null
};


const STATIC_PLOT_MAPPING: Record<string, 'static distribution' | 'pie chart' | null> = {
  'continuous': 'static distribution',
  'categorical': 'pie chart',
  'text': null
};


export function analyzePlotTypes(
  config: SimulationConfigData,
  data: AgentData[][]
): PlotInfo[] {
  const plotInfos: PlotInfo[] = [];
  
  // Check if we have valid data and config
  if (!config.agent_groups || data.length === 0) {
    return plotInfos;
  }
  
  // Process each agent group
  for (const [groupName, groupConfig] of Object.entries(config.agent_groups)) {
    // Process variables
    if (groupConfig.variables) {
      for (const [varName, varConfig] of Object.entries(groupConfig.variables)) {
        const plotInfo = determineItemPlotType(data, groupName, varName, 'variable', 
          !!varConfig.update_rule);
        if (plotInfo) plotInfos.push(plotInfo);
      }
    }
    
    // Process actions
    if (groupConfig.actions) {
      for (const [actionName] of Object.entries(groupConfig.actions)) {
        const plotInfo = determineItemPlotType(data, groupName, actionName, 'action', true);
        if (plotInfo) plotInfos.push(plotInfo);
      }
    }
  }
  
  return plotInfos;
}


function determineItemPlotType(
  data: AgentData[][],
  groupName: string,
  itemName: string,
  itemType: 'variable' | 'action',
  hasDynamicBehavior: boolean
): PlotInfo | null {
  // Collect all values for this item across all timesteps
  const values: unknown[] = [];
  
  // Extract values from all agents of this group and for all timesteps
  for (const timestep of data) {
    for (const agent of timestep) {
      if (agent._agent_group === groupName && itemName in agent) {
        values.push(agent[itemName]);
      }
    }
  }
  
  // If we don't have any values, we can't determine the plot type
  if (values.length === 0) {
    return null;
  }
  
  // Infer the variable type from collected values
  const varType = inferDerivedVariableType(values);
  
  // Choose plot mapping based on whether this item has dynamic behavior
  const plotMapping = hasDynamicBehavior ? DYNAMIC_PLOT_MAPPING : STATIC_PLOT_MAPPING;
  
  // Get the plot type based on the variable type
  const plotType = plotMapping[varType];
  
  // If we don't have a mapping for this variable type, return null
  if (!plotType) {
    return null;
  }
  
  // Return the plot info
  return {
    groupName,
    itemName,
    itemType,
    plotType
  };
}
