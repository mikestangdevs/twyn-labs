import base64
import io
import numpy as np
from matplotlib.figure import Figure
from scipy.interpolate import make_smoothing_spline

def _apply_spline_smoothing(x, y, num_points=200):
    """
    Apply spline smoothing to the input data.
    
    Args:
        x: Input x values
        y: Input y values
        num_points: Number of evenly spaced points to generate for the smooth curve.
                   Higher values create smoother-looking curves but increase computation
                   and file size. Default is 200, which typically provides a good balance
                   between visual quality and performance.
        
    Returns:
        Tuple of (x_smooth, y_smooth) containing the smoothed data with num_points points
    """
    x_smooth = np.linspace(x.min(), x.max(), num=num_points)
    
    if len(x) > 3:
        try:
            spl = make_smoothing_spline(x, y)
            y_smooth = spl(x_smooth)
            return x_smooth, y_smooth
        except:
            pass
    
    return x, y

def plot_time_series(df, variable_action_name, step_unit, agent_group_name=None, description=None, unit=None):
    # Create the plot with higher DPI for better quality
    fig = Figure(figsize=(10, 6), dpi=200)
    ax = fig.add_subplot(111)
    
    # Plot individual agents with spline smoothing
    for i, agent_id in enumerate(df['_id'].unique()):
        agent_data = df[df['_id'] == agent_id]
        x = agent_data['_step'].values
        y = agent_data[variable_action_name].values
        
        x_smooth, y_smooth = _apply_spline_smoothing(x, y)
        label = 'Individual Agents' if i == 0 else None
        ax.plot(x_smooth, y_smooth, color='gray', alpha=0.6, linewidth=0.8, label=label)
    
    # Calculate and plot the mean line with spline smoothing only if there are multiple agents
    unique_agents = df['_id'].unique()
    if len(unique_agents) > 1:
        mean_per_step = df.groupby('_step')[variable_action_name].mean()
        x_mean = mean_per_step.index.values
        y_mean = mean_per_step.values
        
        x_smooth_mean, y_smooth_mean = _apply_spline_smoothing(x_mean, y_mean)
        ax.plot(x_smooth_mean, y_smooth_mean, color='red', linewidth=1.5, label='Mean')
    
    # Labels
    ax.set_xlabel(step_unit, fontweight='semibold')
    ax.set_ylabel(unit, fontweight='semibold')
    
    # Title
    title = f"{agent_group_name} - {variable_action_name}"
    if unit:
        title += f" ({unit})"
    if description:
        title += f"\n{description}"
    ax.set_title(title, loc='left', fontsize=10)

    # Legend
    box = ax.get_position()
    ax.set_position([box.x0, box.y0 + box.height * 0.1,
                    box.width, box.height * 0.9])
    ax.legend(loc='upper center', bbox_to_anchor=(0.5, -0.10),
             fancybox=True, shadow=True, ncol=4)

    # Grid
    ax.grid(True, color='lightgray', linestyle='-', linewidth=0.8, alpha=0.3)
    
    # Base64 image
    buf = io.BytesIO()
    fig.savefig(buf, 
                format='png',
                bbox_inches='tight',
                dpi=200,  # High DPI for better quality
            )
    buf.seek(0)
    img_data = base64.b64encode(buf.getvalue()).decode('utf-8')
    return img_data
