#!/usr/bin/env python3
"""Единая точка делегирования задач внешним ИИ.

Использование:
  tools/ask.py <провайдер> "промпт"
  echo "длинный промпт" | tools/ask.py <провайдер> -

Провайдеры: gemini | ollama | openrouter | claude
Ключи берутся из .env в корне репозитория (см. .env.example).
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

ENV_PATH = ROOT / ".env"
if ENV_PATH.exists():
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def die(msg: str, code: int = 2) -> None:
    print(f"ask: {msg}", file=sys.stderr)
    sys.exit(code)


def http_json(url: str, payload: dict, headers: dict, timeout: int = 120,
              retries: int = 3) -> dict:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    last_err = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:500]
            if e.code in (429, 503) and attempt < retries - 1:
                last_err = f"HTTP {e.code} (повтор {attempt + 1}/{retries})"
                time.sleep(3 * (attempt + 1))
                continue
            die(f"HTTP {e.code} от {url.split('/')[2]}: {body}")
        except urllib.error.URLError as e:
            die(f"сеть недоступна ({url.split('/')[2]}): {e.reason}")
    die(last_err or "исчерпаны повторы")


def ask_gemini(prompt: str) -> str:
    key = os.environ.get("GEMINI_API_KEY") or die("нет GEMINI_API_KEY в .env")
    model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{model}:generateContent")
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    headers = {"Content-Type": "application/json", "x-goog-api-key": key}
    for attempt in range(3):
        data = http_json(url, payload, headers)
        try:
            parts = data["candidates"][0]["content"]["parts"]
            return "".join(p.get("text", "") for p in parts).strip()
        except (KeyError, IndexError):
            if attempt == 2:
                die(f"неожиданный ответ Gemini: {json.dumps(data)[:300]}")
            time.sleep(3)
    die("исчерпаны повторы Gemini")


def ask_ollama(prompt: str) -> str:
    model = os.environ.get("OLLAMA_MODEL", "gemma4:cloud")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
    }
    headers = {"Content-Type": "application/json"}
    try:
        data = http_json("http://localhost:11434/api/chat", payload, headers)
    except SystemExit:
        print("ask: ollama serve не запущен? (запусти: ollama serve)",
              file=sys.stderr)
        raise
    return data.get("message", {}).get("content", "").strip()


def ask_openrouter(prompt: str) -> str:
    key = os.environ.get("OPENROUTER_API_KEY") or die(
        "нет OPENROUTER_API_KEY в .env (бесплатный ключ: openrouter.ai)")
    model = os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
    url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {key}",
    }
    data = http_json(url, payload, headers)
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError):
        die(f"неожиданный ответ OpenRouter: {json.dumps(data)[:300]}")


def ask_claude(prompt: str) -> str:
    key = os.environ.get("ANTHROPIC_API_KEY") or die(
        "нет ANTHROPIC_API_KEY в .env — Claude подключается позже "
        "(console.anthropic.com → ключ → строка в .env); пока используй "
        "gemini/ollama или ручной релей через prompts/START.md")
    model = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5")
    url = "https://api.anthropic.com/v1/messages"
    payload = {
        "model": model,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
    }
    data = http_json(url, payload, headers)
    try:
        return "".join(b.get("text", "") for b in data["content"]).strip()
    except (KeyError, TypeError):
        die(f"неожиданный ответ Claude: {json.dumps(data)[:300]}")


def journal(provider: str, prompt: str, answer: str) -> None:
    """Ведёт лог вызовов: logs/ask-journal.md (виден на GitHub raw для слежения)."""
    logs_dir = ROOT / "logs"
    logs_dir.mkdir(exist_ok=True)
    path = logs_dir / "ask-journal.md"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    model = {
        "gemini": os.environ.get("GEMINI_MODEL", "gemini-3.5-flash"),
        "ollama": os.environ.get("OLLAMA_MODEL", "gemma4:cloud"),
        "openrouter": os.environ.get("OPENROUTER_MODEL", "free"),
        "claude": os.environ.get("CLAUDE_MODEL", "claude"),
    }.get(provider, provider)
    def clip(s: str, n: int = 6000) -> str:
        return s if len(s) <= n else s[:n] + f"\n… (обрезано, всего {len(s)} символов)"
    entry = (
        f"\n## {now} — {provider} ({model})\n\n"
        f"**Задача:**\n{clip(prompt)}\n\n**Ответ:**\n{clip(answer)}\n"
    )
    with path.open("a", encoding="utf-8") as f:
        f.write(entry)


PROVIDERS = {
    "gemini": ask_gemini,
    "ollama": ask_ollama,
    "openrouter": ask_openrouter,
    "claude": ask_claude,
}


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(__doc__.strip())
        sys.exit(0 if len(sys.argv) > 1 else 1)
    provider = sys.argv[1]
    if provider not in PROVIDERS:
        die(f"неизвестный провайдер '{provider}' (доступны: {', '.join(PROVIDERS)})")
    rest = sys.argv[2:]
    if rest == ["-"] or (len(rest) == 1 and rest[0] == "-"):
        prompt = sys.stdin.read().strip()
    elif rest:
        prompt = " ".join(rest).strip()
    else:
        die("пустой промпт (передай текстом или через stdin с '-')")
    if not prompt:
        die("пустой промпт")
    answer = PROVIDERS[provider](prompt)
    print(answer)
    journal(provider, prompt, answer)


if __name__ == "__main__":
    main()
