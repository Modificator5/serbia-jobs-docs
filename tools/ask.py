#!/usr/bin/env python3
"""Единая точка делегирования задач внешним ИИ.

Роли (capability keys) важнее имён моделей:
  ROUTINE_LOCAL | CODE_FAST | LOGIC_CORE

Использование:
  tools/ask.py <роль|провайдер> "промпт" [флаги]
  echo "длинный промпт" | tools/ask.py <роль|провайдер> - [флаги]

Провайдеры и модели описаны в config/providers.json (секретов там нет).
Ключи берутся из .env. Имена моделей встречаются только в конфиге и журнале.

Флаги:
  --tags a,b           ручные теги журнала (авто: роль, провайдер)
  --origin worker|user кто инициировал (по умолчанию worker)
  --allow-external     разрешить внешний провайдер для локальной роли
  --no-cache           не читать и не писать кеш
  --expect json|text   проверка формата (по умолчанию: json для ROUTINE_LOCAL)
  --timeout СЕК        общий дедлайн на весь вызов (по умолчанию 300)
  --volatile YYYY-MM-DD ответ устаревает к дате (не ищется после неё)
"""
import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, date
from pathlib import Path

ROOT = Path(os.environ.get("ASK_ROOT", Path(__file__).resolve().parent.parent))
MEMORY_DIR = ROOT / ".ai_memory"
LOGS_DIR = ROOT / "logs"
ARCHIVE_DIR = LOGS_DIR / "archive"
CONFIG_PATH = Path(os.environ.get("ASK_CONFIG", ROOT / "config" / "providers.json"))

MEMORY_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

ENV_PATH = ROOT / ".env"
if ENV_PATH.exists():
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

MAX_PROMPT_CHARS = 6000
MAX_CACHE_FILE_BYTES = 5_000_000
MAX_JOURNAL_BYTES = 1_000_000


def die(msg: str, code: int = 2) -> None:
    print(f"ask: {msg}", file=sys.stderr)
    sys.exit(code)


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        die(f"нет конфига провайдеров: {CONFIG_PATH}")
    try:
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        die(f"битый JSON в {CONFIG_PATH}: {e}")
    cfg.setdefault("providers", {})
    cfg.setdefault("roles", {})
    cfg.setdefault("legacy", {})
    return cfg


def clip(text: str, n: int = MAX_PROMPT_CHARS) -> str:
    return text if len(text) <= n else text[:n] + f"\n… (обрезано, всего {len(text)} символов)"


# --- HTTP -------------------------------------------------------------------

def http_json(url: str, payload: dict, headers: dict, timeout: float,
              retries: int = 3) -> dict:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    last_err = None
    for attempt in range(retries):
        if timeout <= 0:
            die("дедлайн вызова истёк")
        try:
            with urllib.request.urlopen(req, timeout=max(1, timeout)) as resp:
                raw = resp.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:500]
            if e.code in (429, 503) and attempt < retries - 1:
                last_err = f"HTTP {e.code} (повтор {attempt + 1}/{retries})"
                time.sleep(min(3 * (attempt + 1), max(0, timeout)))
                continue
            die(f"HTTP {e.code} от {url.split('/')[2]}: {body}")
        except (urllib.error.URLError, TimeoutError) as e:
            reason = getattr(e, "reason", e)
            if attempt < retries - 1:
                last_err = f"сеть: {reason} (повтор {attempt + 1}/{retries})"
                time.sleep(min(3 * (attempt + 1), max(0, timeout)))
                continue
            die(f"сеть недоступна ({url.split('/')[2]}): {reason}")
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            last_err = f"некорректный JSON от провайдера: {e}; фрагмент: {raw[:200]}"
            if attempt < retries - 1:
                time.sleep(min(3 * (attempt + 1), max(0, timeout)))
                continue
            die(last_err)
    die(last_err or "исчерпаны повторы")


# --- Adapters ---------------------------------------------------------------

def call_openai(entry: dict, prompt: str, timeout: float) -> tuple[str, str | None]:
    provider = entry["provider"]
    base_url = entry["base_url"].rstrip("/")
    url = f"{base_url}/chat/completions"
    payload = {"model": entry["model"], "messages": [{"role": "user", "content": prompt}]}
    headers = {"Content-Type": "application/json"}
    key = os.environ.get(entry.get("api_key_env", ""), "") if entry.get("api_key_env") else ""
    if key:
        headers["Authorization"] = f"Bearer {key}"
    data = http_json(url, payload, headers, timeout)
    try:
        answer = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError):
        die(f"неожиданный ответ {provider}: {json.dumps(data)[:300]}")
    return answer, data.get("model")


def call_anthropic(entry: dict, prompt: str, timeout: float) -> tuple[str, str | None]:
    key = os.environ.get(entry.get("api_key_env", ""), "")
    if not key:
        die(f"нет ключа {entry.get('api_key_env')} в .env")
    payload = {
        "model": entry["model"],
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
    }
    data = http_json(entry["base_url"], payload, headers, timeout)
    try:
        answer = "".join(b.get("text", "") for b in data["content"]).strip()
    except (KeyError, TypeError):
        die(f"неожиданный ответ {entry['provider']}: {json.dumps(data)[:300]}")
    return answer, data.get("model")


ADAPTERS = {"openai": call_openai, "anthropic": call_anthropic}


# --- Targets ----------------------------------------------------------------

def resolve_targets(cfg: dict, target: str, allow_external: bool) -> list[dict]:
    providers = cfg["providers"]
    roles = cfg["roles"]

    if target in roles:
        role = target
        entries = []
        for ref in roles[target]:
            name = ref["provider"]
            if name not in providers:
                die(f"роль {target} ссылается на неизвестного провайдера {name}")
            entries.append({**providers[name], **ref, "provider": name})
        # Локальная роль по умолчанию не выходит наружу без явного флага.
        if entries and not entries[0].get("external", True) and not allow_external:
            entries = [e for e in entries if not e.get("external")]
        return entries

    # Обратная совместимость: имя провайдера как явный выбор (явно = разрешено).
    if target in providers:
        ref = {"provider": target, "model": providers[target]["default_model"]}
        return [{**providers[target], **ref, "provider": target}]
    die(f"неизвестная роль/провайдер '{target}' "
        f"(роли: {', '.join(roles)}; провайдеры: {', '.join(providers)})")


def expect_for(cfg: dict, target: str, override: str | None) -> str:
    if override:
        return override
    if target in cfg["roles"]:
        return "json" if target == "ROUTINE_LOCAL" else "text"
    return "text"


# --- Validation -------------------------------------------------------------

def valid_answer(answer: str, expect: str) -> bool:
    if not answer or not answer.strip():
        return False
    if expect != "json":
        return True
    text = answer.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        json.loads(text)
        return True
    except json.JSONDecodeError:
        return False


# --- Cache ------------------------------------------------------------------

def prompt_hash(provider: str, model: str, prompt: str) -> str:
    return hashlib.sha256(f"{provider}|{model}|{prompt}".encode()).hexdigest()


def rotate_cache(cache_file: Path) -> None:
    try:
        if cache_file.stat().st_size < MAX_CACHE_FILE_BYTES:
            return
    except FileNotFoundError:
        return
    lines = cache_file.read_text(encoding="utf-8").splitlines()
    keep = lines[len(lines) // 2:]
    archive = MEMORY_DIR / "archive"
    archive.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d")
    (archive / f"{cache_file.stem}-{stamp}.jsonl").write_text(
        "\n".join(lines[: len(lines) // 2]) + "\n", encoding="utf-8"
    )
    cache_file.write_text("\n".join(keep) + ("\n" if keep else ""), encoding="utf-8")


def volatile_expired(entry: dict) -> bool:
    exp = entry.get("volatile")
    if not exp:
        return False
    try:
        return date.fromisoformat(str(exp)) < date.today()
    except ValueError:
        return False


def get_cached(provider: str, model: str, prompt: str) -> str | None:
    cache_file = MEMORY_DIR / f"{provider}.jsonl"
    if not cache_file.exists():
        return None
    target = prompt_hash(provider, model, prompt)
    for line in cache_file.read_text(encoding="utf-8").splitlines():
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if volatile_expired(entry):
            continue
        if entry.get("hash") == target:
            return entry.get("answer")
    return None


def save_cache(provider: str, model: str, prompt: str, answer: str,
               volatile: str | None) -> None:
    if not answer or not answer.strip():
        return
    cache_file = MEMORY_DIR / f"{provider}.jsonl"
    rotate_cache(cache_file)
    entry = {
        "hash": prompt_hash(provider, model, prompt),
        "provider": provider,
        "model": model,
        "volatile": volatile,
        "prompt": prompt,
        "answer": answer,
    }
    with cache_file.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


# --- Journal ----------------------------------------------------------------

def rotate_journal(path: Path) -> None:
    try:
        if path.stat().st_size < MAX_JOURNAL_BYTES:
            return
    except FileNotFoundError:
        return
    ARCHIVE_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m")
    dest = ARCHIVE_DIR / f"ask-journal-{stamp}.jsonl"
    n = 1
    while dest.exists():
        dest = ARCHIVE_DIR / f"ask-journal-{stamp}-{n}.jsonl"
        n += 1
    path.replace(dest)


def journal(*, role: str, provider: str, model_requested: str,
            model_reported: str | None, origin: str, tags: list[str],
            volatile: str | None, prompt: str, answer: str,
            outcome: str, retries: int) -> None:
    path = LOGS_DIR / "ask-journal.jsonl"
    rotate_journal(path)
    entry = {
        "ts": datetime.now().isoformat(timespec="seconds"),
        "role": role,
        "provider": provider,
        "model_requested": model_requested,
        "model_reported": model_reported,
        "origin": origin,
        "tags": tags,
        "volatile": volatile,
        "prompt_hash": prompt_hash(provider, model_requested, prompt),
        "prompt": clip(prompt),
        "answer": clip(answer),
        "outcome": outcome,
        "retries": retries,
    }
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


# --- Main -------------------------------------------------------------------

def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(add_help=True, description=__doc__)
    parser.add_argument("target")
    parser.add_argument("prompt", nargs="*")
    parser.add_argument("--tags", default="")
    parser.add_argument("--origin", choices=["worker", "user"], default="worker")
    parser.add_argument("--allow-external", action="store_true")
    parser.add_argument("--no-cache", action="store_true")
    parser.add_argument("--expect", choices=["json", "text"], default=None)
    parser.add_argument("--timeout", type=float, default=300.0)
    parser.add_argument("--volatile", default=None)
    return parser.parse_args(argv)


def read_prompt(tokens: list[str]) -> str:
    if tokens == ["-"] or (len(tokens) == 1 and tokens[0] == "-"):
        prompt = sys.stdin.read().strip()
    elif tokens:
        prompt = " ".join(tokens).strip()
    else:
        die("пустой промпт (передай текстом или через stdin с '-')")
    if not prompt:
        die("пустой промпт")
    return prompt


def main(argv: list[str] | None = None) -> None:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    cfg = load_config()
    prompt = read_prompt(args.prompt)
    targets = resolve_targets(cfg, args.target, args.allow_external)
    if not targets:
        die(f"для '{args.target}' нет доступных провайдеров "
            f"(внешние требуют --allow-external)")
    expect = expect_for(cfg, args.target, args.expect)
    manual_tags = [t.strip() for t in args.tags.split(",") if t.strip()]
    base_tags = [args.target, *manual_tags]

    if not args.no_cache:
        for entry in targets:
            cached = get_cached(entry["provider"], entry["model"], prompt)
            if cached is not None:
                journal(role=args.target, provider=entry["provider"],
                        model_requested=entry["model"], model_reported=None,
                        origin=args.origin, tags=[*base_tags, "cache"],
                        volatile=args.volatile, prompt=prompt, answer=cached,
                        outcome="accepted", retries=0)
                print(cached)
                return

    deadline = time.monotonic() + args.timeout
    last_error = None

    for idx, entry in enumerate(targets):
        provider = entry["provider"]
        model = entry["model"]
        adapter = ADAPTERS.get(entry.get("format", "openai"))
        if not adapter:
            last_error = SystemExit(f"{provider}: неизвестный формат {entry.get('format')}")
            continue

        for attempt in range(2):  # один повтор на нарушение формата
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                last_error = SystemExit("дедлайн вызова истёк")
                break
            try:
                answer, reported = adapter(entry, prompt, remaining)
            except SystemExit as e:
                last_error = e
                break
            except Exception as e:  # внутренние ошибки не должны рвать цепочку
                last_error = SystemExit(f"{provider}: {e}")
                break

            outcome = "accepted"
            if valid_answer(answer, expect):
                print(answer)
                if not args.no_cache:
                    save_cache(provider, model, prompt, answer, args.volatile)
                journal(role=args.target, provider=provider, model_requested=model,
                        model_reported=reported, origin=args.origin,
                        tags=base_tags, volatile=args.volatile, prompt=prompt,
                        answer=answer, outcome=outcome, retries=attempt)
                return

            # Формат нарушен: сначала один повтор у того же провайдера.
            last_error = SystemExit(f"{provider}: нарушен формат {expect}")
            journal(role=args.target, provider=provider, model_requested=model,
                    model_reported=reported, origin=args.origin,
                    tags=[*base_tags, "format-fail"], volatile=args.volatile,
                    prompt=prompt, answer=answer, outcome="fallback", retries=attempt)

        if time.monotonic() >= deadline:
            break

    if isinstance(last_error, SystemExit) and isinstance(last_error.code, str):
        die(last_error.code)
    die(str(last_error) if last_error else "все провайдеры недоступны")


if __name__ == "__main__":
    main()
