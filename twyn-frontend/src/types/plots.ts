import { AgentData } from './agent';
import { SimulationConfig, SimulationConfigData } from './simulationApiTypes';

// Base props interface that all plots share
export interface BasePlotProps {
  groupName: string;
  itemName: string;
  data: AgentData[][];
  description?: string;
  unit?: string | null;
}

// Time Series specific types
export interface TimeSeriesPlotProps extends BasePlotProps {
  stepUnit: string;
  maxAgentSamples?: number;
}

export interface ChartDataPoint {
  step: number;
  mean?: number;
  [key: string]: unknown;
}

// Histogram specific types
export interface HistogramPlotProps extends BasePlotProps {
  stepUnit: string;
  colorPalette?: string[];
  maxTimeSteps?: number;
}

// Pie Chart specific types
export interface PiePlotProps extends BasePlotProps {
  colorPalette?: string[];
}

export interface PieDataPoint {
  name: string;
  value: number;
}

// Static Distribution specific types
export interface StaticDistributionPlotProps extends BasePlotProps {
  color?: string;
}

export interface DistributionBin {
  min: number;
  max: number;
  count: number;
}

// Markdown Plot specific types
export interface MarkdownPlotProps {
  src: string;
  config: SimulationConfigData;
  simData: AgentData[][];
  maxAgentSamples?: number;
  maxTimeSteps?: number;
} 