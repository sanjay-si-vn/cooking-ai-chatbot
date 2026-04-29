from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from dotenv import load_dotenv  # <-- Add this

load_dotenv()  # <-- Add this to load .env variables

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
print("Loaded GROQ_API_KEY:", GROQ_API_KEY)  # <-- Add this line for debugging

app = FastAPI()

# Allow frontend requests (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use specific domain in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate")
async def generate_recipe(request: Request):
    data = await request.json()
    user_prompt = data.get("prompt")

    if not GROQ_API_KEY:
        print("GROQ_API_KEY not found!")  # <-- Add debug print
        return {"response": "Error: GROQ_API_KEY is not set on the server."}

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama3-70b-8192",  # For example
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful cooking assistant. Provide step-by-step cooking tutorials."
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ]
    }

    try:
        # Instead of making an HTTP request, read from a local file on E: drive
        local_response_path = r"E:\groq_api_response.json"
        if os.path.exists(local_response_path):
            with open(local_response_path, "r", encoding="utf-8") as f:
                result = f.read()
            import json
            result = json.loads(result)
            content = (
                result.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "Error: No content returned from local file.")
            )
            return {"response": content}
        else:
            return {"response": "Error: Local response file not found on E: drive."}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}

app = app  # Explicitly expose 'app' for uvicorn