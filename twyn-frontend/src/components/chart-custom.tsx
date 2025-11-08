interface ChartDataItem {
  dataKey: string;
  color?: string;
  value: number;
  payload: {
    step: number;
    [key: string]: unknown;
  };
}

interface CustomLegendProps {
  payload?: Array<ChartDataItem>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<ChartDataItem>;
  stepUnit: string;
  unit?: string | null;
}

export function CustomLegendContent({ payload }: CustomLegendProps) {
  if (!payload?.length) return null;
  
  const meanItem = payload.find(item => item.dataKey === 'mean');
  
  return (
    <div className="flex items-center justify-center gap-4 pt-3">
      <div className="flex items-center gap-1.5">
        <div
          className="h-2 w-2 shrink-0 rounded-[2px]"
          style={{
            backgroundColor: "#D1D5DB",
          }}
        />
        Individual agents
      </div>
      {meanItem && (
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{
              backgroundColor: meanItem.color,
            }}
          />
          Mean
        </div>
      )}
    </div>
  );
}

export function CustomTooltipContent({ active, payload, stepUnit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const agentPayloads = payload.filter(item => item.dataKey.startsWith('agent_'));
  const meanPayload = payload.find(item => item.dataKey === 'mean');
  const step = payload[0].payload.step;
  const agentIds = [...new Set(agentPayloads.map(item => item.dataKey.split('_')[1]))];

  return (
    <div className="border-border/50 bg-background grid min-w-[10rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{`${stepUnit} ${step}`}</div>
      <div className="grid gap-1.5">
        {agentIds.length < 15 ? (
          // Show individual agents if less than 15
          agentPayloads.map((item) => {
            const agentId = item.dataKey.split('_')[1];
            return (
              <div key={item.dataKey} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: "#D1D5DB" }}
                />
                <div className="flex flex-1 justify-between items-center">
                  <span className="text-muted-foreground">{`Agent ${agentId}`}</span>
                  <span className="text-foreground font-mono font-medium tabular-nums">
                    {item.value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          // Show aggregated agents if 15 or more
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: "#D1D5DB" }}
            />
            <div className="flex flex-1 justify-between items-center">
              <span className="text-muted-foreground">Individual agents</span>
            </div>
          </div>
        )}
        {meanPayload && (
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: meanPayload.color }}
            />
            <div className="flex flex-1 justify-between items-center">
              <span className="text-muted-foreground">Mean</span>
              <span className="text-foreground font-mono font-medium tabular-nums">
                {meanPayload.value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 