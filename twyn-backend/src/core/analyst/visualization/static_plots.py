import io
import numpy as np
import base64
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from scipy import stats

def plot_pie_chart(df, variable_action_name, step_unit, agent_group_name=None, description=None, unit=None):
    # Create the plot
    fig = Figure(figsize=(10, 6), dpi=200)
    ax = fig.add_subplot(111)
    
    # Count frequency of each category
    value_counts = df[variable_action_name].value_counts()
    
    # Plot pie chart
    ax.pie(value_counts.values, labels=value_counts.index, autopct='%1.1f%%')
    
    # Title
    title = f"{agent_group_name} - {variable_action_name}"
    if unit:
        title += f" ({unit})"
    if description:
        title += f"\n{description}"
    ax.set_title(title, loc='left', fontsize=10)
    
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

def plot_static_distribution(df, variable_action_name, step_unit, agent_group_name=None, description=None, unit=None):
    # Create the plot
    fig = Figure(figsize=(10, 6), dpi=200)
    ax = fig.add_subplot(111)
    
    # Since values are static, we can take any timestep
    first_timestep_data = df[df['_step'] == df['_step'].min()][variable_action_name]
    
    # Create main histogram
    ax.hist(first_timestep_data, bins=30, density=True, alpha=0.7, 
             color='gray', label='Actual distribution')
    
    # Add kernel density estimation
    kernel = stats.gaussian_kde(first_timestep_data)
    x_range = np.linspace(first_timestep_data.min(), first_timestep_data.max(), 100)
    ax.plot(x_range, kernel(x_range), 'b-', label='KDE', linewidth=1.5)
    
    # Add basic statistics annotation
    stats_text = (
        f'Mean: {first_timestep_data.mean():.2f}\n'
        f'Std: {first_timestep_data.std():.2f}\n'
        f'Min: {first_timestep_data.min():.2f}\n'
        f'Max: {first_timestep_data.max():.2f}'
    )
    ax.text(0.95, 0.95, stats_text,
             transform=ax.transAxes,
             verticalalignment='top',
             horizontalalignment='right',
             bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    # Title
    title = f"{agent_group_name} - {variable_action_name}"
    if unit:
        title += f" ({unit})"
    if description:
        title += f"\n{description}"
    ax.set_title(title, loc='left', fontsize=10)
    
    # Labels
    ax.set_xlabel('Value', fontweight='semibold')
    ax.set_ylabel('Density', fontweight='semibold')
    
    # Legend
    box = ax.get_position()
    ax.set_position([box.x0, box.y0 + box.height * 0.1,
                    box.width, box.height * 0.9])
    ax.legend(loc='upper center', bbox_to_anchor=(0.5, -0.10),
             fancybox=True, shadow=True, ncol=4)
    
    # Grid
    ax.grid(True, axis='y', color='lightgray', linestyle='-', linewidth=0.8, alpha=0.3)
    
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

    pass