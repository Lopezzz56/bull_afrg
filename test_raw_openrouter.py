import sys, requests, json
sys.path.insert(0, '.')
from backend.app.core.config import settings
from backend.app.services.extractor import PROMPT_PASS_1
from backend.app.services.parser import parse_pdf_words

parsed = parse_pdf_words("ICICI Q2FY26.pdf")
text_content = parsed["text"]

print("Calling OpenRouter to inspect raw output...")
url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
}
payload = {
    "model": settings.OPENROUTER_MODEL or "openai/gpt-oss-20b:free",
    "messages": [
        {"role": "system", "content": PROMPT_PASS_1},
        {"role": "user", "content": f"Extract all financial data from this report text:\n\n{text_content[:40000]}"}
    ],
    "temperature": 0.1,
}
res = requests.post(url, headers=headers, json=payload, timeout=120)
if res.status_code == 200:
    resp_json = res.json()
    msg = resp_json["choices"][0]["message"]
    text_response = msg.get("content") or msg.get("reasoning") or ""
    
    with open("raw_output.txt", "w", encoding="utf-8") as f:
        f.write(text_response)
    print("Raw output written successfully to raw_output.txt")
else:
    print(f"Failed with status: {res.status_code}, content: {res.text}")
