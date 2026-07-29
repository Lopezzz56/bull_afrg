import sys, requests, json
sys.path.insert(0, '.')
from backend.app.core.config import settings

# Test OpenRouter models
models = [
    settings.OPENROUTER_MODEL,
    "qwen/qwen-2.5-72b-instruct:free",
    "google/gemma-2-9b-it:free",
    "openrouter/free"
]
models = [m for m in models if m]
models = list(dict.fromkeys(models))

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:8000",
    "X-Title": "FinReport AI",
}

for model in models:
    print(f"\nTesting OpenRouter with model: {model}")
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": 'Return ONLY this JSON: {"status": "ok", "model": "working"}'}
        ],
        "temperature": 0.1,
    }
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            resp = res.json()
            if "choices" in resp:
                content = resp["choices"][0]["message"]["content"]
                print("OpenRouter OK:", content[:200])
                break
            else:
                print("OpenRouter response without choices:", resp)
        else:
            print("OpenRouter ERROR:", res.text[:400])
    except Exception as e:
        print(f"Error testing {model}: {e}")
