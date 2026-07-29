import sys, requests
sys.path.insert(0, '.')
from backend.app.core.config import settings

# Quick Gemini text-only test
print('Testing Gemini text-only (small payload)...')
url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
payload = {
    "contents": [{"role": "user", "parts": [{"text": "Say HELLO in JSON: {\"msg\": \"HELLO\"}"}]}],
    "generationConfig": {"responseMimeType": "application/json"}
}
res = requests.post(url, json=payload, timeout=15)
print(f"Status: {res.status_code}")
if res.status_code == 200:
    print("Gemini OK:", res.json()["candidates"][0]["content"]["parts"][0]["text"][:100])
else:
    print("Gemini ERROR:", res.text[:300])
