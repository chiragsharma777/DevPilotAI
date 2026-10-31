from supabase_client import supabase

try:
    response = supabase.table("profiles").select("id").limit(1).execute()
    print("Database query successful!")
    print("Profiles returned:", len(response.data))
except Exception as error:
    print("Database query failed:", error)