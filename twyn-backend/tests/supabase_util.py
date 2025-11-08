from supabase import create_client
import json
import os


supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)


request_id = "70413741-a263-42af-9883-e46390e164f9"


def add_to_table(table_name, column_name, data):
    supabase.table(table_name).upsert({
        'request_id': request_id,
        column_name: data
    }, on_conflict='request_id').execute()


# load config.json
with open("tests/config.json", "r") as f:
    config = json.load(f)

# load data.json
with open("tests/data.json", "r") as f:
    data = json.load(f)

# load report.txt
with open("tests/report.txt", "r") as f:
    report = f.read()

# add to table
add_to_table("simulation_results", "sim_data", data)