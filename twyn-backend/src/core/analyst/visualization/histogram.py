import io
import numpy as np
import base64
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas

def plot_histogram(df, variable_action_name, step_unit, agent_group_name=None, description=None, unit=None):
    # Create the plot
    fig = Figure(figsize=(10, 6), dpi=200)
    ax = fig.add_subplot(111)
    
    # Get unique categories and steps
    categories = df[variable_action_name].unique()
    steps = df['_step'].unique()
    
    # Create a dictionary to store category counts per step
    data = {category: [] for category in categories}
    
    # Calculate counts for each category at each step
    for step in steps:
        step_data = df[df['_step'] == step][variable_action_name].value_counts()
        for category in categories:
            data[category].append(step_data.get(category, 0))
    
    # Create stacked bar chart
    bottom = np.zeros(len(steps))
    for category in categories:
        ax.bar(steps, data[category], bottom=bottom, label=category)
        bottom += data[category]
    
    # Labels
    ax.set_xlabel(step_unit, fontweight='semibold')
    ax.set_ylabel('Count', fontweight='semibold')
    
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
