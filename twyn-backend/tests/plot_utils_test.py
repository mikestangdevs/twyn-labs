import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import shutil
import base64
import json
from pprint import pprint
from src.core.analyst.visualization.plot_creator import create_plots
from src.core.shared.config_serializer import decode_config


def test_create_plots():
    with open("tests/config.json", "r") as f:
        config = json.load(f)
    with open("tests/data.json", "r") as f:
        data = json.load(f)

    plots = create_plots(decode_config(config), data)

    # Save plots to file
    if os.path.exists("plots"):
        shutil.rmtree("plots")
    os.makedirs("plots")

    for plot in plots:
        if plot["image"]:  # Check if image exists
            with open(f"plots/{plot['title']}.png", "wb") as f:
                # Decode base64 string back to bytes before writing
                image_bytes = base64.b64decode(plot["image"])
                f.write(image_bytes)


if __name__ == "__main__":
    test_create_plots()
