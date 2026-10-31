#!/usr/bin/env python3
"""Единая точка делегирования задач внешним ИИ с локальным кешированием.

Использование:
  tools/ask.py <провайдер> "промпт"
  echo "длинный промпт" | tools/ask.py <провайдер> -

Провайдеры: gemini | ollama | openrouter | claude | groq
Ключи берутся из .env в корне репозитория.
"""
import json
import os
import sys
import time
import hashlib
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEMORY_DIR = ROOT / ".ai_memory"
MEMORY_DIR.mkdir(exist_ok=True)

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
                raw = resp.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:500]
            if e.code in (429, 503) and attempt < retries - 1:
                last_err = f"HTTP {e.code} (повтор {attempt + 1}/{retries})"
                time.sleep(3 * (attempt + 1))
                continue
            die(f"HTTP {e.code} от {url.split('/')[2]}: {body}")
        except (urllib.error.URLError, TimeoutError) as e:
            reason = getattr(e, "reason", e)
            if attempt < retries - 1:
                last_err = f"сеть: {reason} (повтор {attempt + 1}/{retries})"
                time.sleep(3 * (attempt + 1))
                continue
            die(f"сеть недоступна ({url.split('/')[2]}): {reason}")
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            # Битый JSON = сбой провайдера: повтор, иначе — die (fallback-цикл).
            last_err = f"некорректный JSON от провайдера: {e}; фрагмент: {raw[:200]}"
            if attempt < retries - 1:
                time.sleep(3 * (attempt + 1))
                continue
            die(last_err)
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


def ask_groq(prompt: str) -> str:
    key = os.environ.get("GROQ_API_KEY") or die(
        "нет GROQ_API_KEY в .env (бесплатный ключ: console.groq.com)")
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    url = "https://api.groq.com/openai/v1/chat/completions"
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
        die(f"неожиданный ответ Groq: {json.dumps(data)[:300]}")


def ask_claude(prompt: str) -> str:
    key = os.environ.get("ANTHROPIC_API_KEY") or die(
        "нет ANTHROPIC_API_KEY в .env")
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


MODEL_OF = {
    "gemini": lambda: os.environ.get("GEMINI_MODEL", "gemini-3.5-flash"),
    "ollama": lambda: os.environ.get("OLLAMA_MODEL", "gemma4:cloud"),
    "openrouter": lambda: os.environ.get("OPENROUTER_MODEL", "free"),
    "claude": lambda: os.environ.get("CLAUDE_MODEL", "claude"),
    "groq": lambda: os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
}


def prompt_hash(provider: str, prompt: str) -> str:
    """Ключ кеша: провайдер + модель + промпт. Без провайдера ответ одного ИИ
    уезжал бы в кеш другого (баг 2026-10-31); без модели — путаница при смене модели."""
    return hashlib.sha256(f"{provider}|{MODEL_OF[provider]()}|{prompt}".encode()).hexdigest()


def journal(provider: str, prompt: str, answer: str, label: str = "PENDING") -> None:
    logs_dir = ROOT / "logs"
    logs_dir.mkdir(exist_ok=True)
    path = logs_dir / "ask-journal.md"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    model = MODEL_OF.get(provider, lambda: provider)()
    def clip(s: str, n: int = 6000) -> str:
        return s if len(s) <= n else s[:n] + f"\n… (обрезано, всего {len(s)} символов)"
    entry = (
        f"\n## {now} — {provider} ({model}) | Label: {label}\n\n"
        f"**Задача:**\n{clip(prompt)}\n\n**Ответ:**\n{clip(answer)}\n"
    )
    with path.open("a", encoding="utf-8") as f:
        f.write(entry)


def get_cached_answer(provider: str, prompt: str) -> str | None:
    cache_file = MEMORY_DIR / f"{provider}.jsonl"
    if not cache_file.exists():
        return None
    target = prompt_hash(provider, prompt)
    with cache_file.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get("hash") == target:
                    return entry.get("answer")
            except json.JSONDecodeError:
                continue
    return None


def save_to_cache(provider: str, prompt: str, answer: str) -> None:
    if not answer:
        return
    cache_file = MEMORY_DIR / f"{provider}.jsonl"
    entry = json.dumps(
        {"hash": prompt_hash(provider, prompt), "prompt": prompt, "answer": answer},
        ensure_ascii=False,
    )
    with cache_file.open("a", encoding="utf-8") as f:
        f.write(entry + "\n")


PROVIDERS = {
    "gemini": ask_gemini,
    "ollama": ask_ollama,
    "openrouter": ask_openrouter,
    "claude": ask_claude,
    "groq": ask_groq,
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

    # check cache first
    cached = get_cached_answer(provider, prompt)
    if cached:
        print(cached)
        return

    fallback_order = [provider] + [
        p for p in ("gemini", "openrouter", "groq", "ollama") if p != provider
    ]
    last_error = None
    for p in fallback_order:
        try:
            answer = PROVIDERS[p](prompt)
        except SystemExit as e:
            last_error = e
            continue
        except Exception as e:  # битые ответы/внутренние ошибки не должны рвать fallback
            last_error = SystemExit(f"{p}: {e}")
            continue
        if not answer:
            last_error = SystemExit(f"{p}: пустой ответ")
            continue
        print(answer)
        # Кеш и журнал — под ФАКТИЧЕСКИ отвечшим провайдером (p), иначе ответ
        # одного ИИ лежит в кеше другого и возвращается молча.
        save_to_cache(p, prompt, answer)
        label = "ACCEPTED" if p == provider else f"ACCEPTED (fallback {provider}->{p})"
        journal(p, prompt, answer, label)
        return
    raise last_error or SystemExit(2)


if __name__ == "__main__":
    main()
