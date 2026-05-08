from __future__ import annotations

import os
import sqlite3
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import feedparser
from dateutil import parser as dateparser
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles


APP_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(APP_DIR, "learnsite.db")


DEFAULT_FEEDS = [
    # IT / AI
    ("it", "Hugging Face Blog", "https://huggingface.co/blog/feed.xml"),
    ("it", "OpenAI News", "https://openai.com/news/rss.xml"),
    # Data / SQL
    ("it", "Postgres Weekly", "https://postgresweekly.com/rss/"),
    # Finance (偏英文；你可以后续替换为中文 RSS)
    ("finance", "CFA Institute (Insights)", "https://www.cfainstitute.org/en/research/rss"),
    ("finance", "Investopedia", "https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_articles"),
]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS feeds (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              category TEXT NOT NULL,
              title TEXT NOT NULL,
              url TEXT NOT NULL UNIQUE,
              enabled INTEGER NOT NULL DEFAULT 1
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS articles (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              feed_url TEXT NOT NULL,
              category TEXT NOT NULL,
              source_title TEXT NOT NULL,
              title TEXT NOT NULL,
              url TEXT NOT NULL UNIQUE,
              summary TEXT,
              published_at TEXT,
              fetched_at TEXT NOT NULL
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS meta (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            """
        )

        for category, title, url in DEFAULT_FEEDS:
            conn.execute(
                "INSERT OR IGNORE INTO feeds(category,title,url,enabled) VALUES(?,?,?,1)",
                (category, title, url),
            )


def set_meta(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute(
        "INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        (key, value),
    )


def get_meta(conn: sqlite3.Connection, key: str) -> Optional[str]:
    row = conn.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
    return row["value"] if row else None


def parse_dt(entry: Any) -> Optional[str]:
    for k in ("published", "updated", "created"):
        v = getattr(entry, k, None)
        if not v:
            continue
        try:
            dt = dateparser.parse(v)
            if not dt:
                continue
            if not dt.tzinfo:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat()
        except Exception:
            continue
    return None


def upsert_article(
    conn: sqlite3.Connection,
    *,
    feed_url: str,
    category: str,
    source_title: str,
    title: str,
    url: str,
    summary: Optional[str],
    published_at: Optional[str],
) -> int:
    before = conn.total_changes
    conn.execute(
        """
        INSERT OR IGNORE INTO articles(
          feed_url, category, source_title, title, url, summary, published_at, fetched_at
        ) VALUES (?,?,?,?,?,?,?,?)
        """,
        (feed_url, category, source_title, title, url, summary, published_at, utc_now_iso()),
    )
    after = conn.total_changes
    return 1 if after > before else 0


def fetch_once(limit_per_feed: int = 20) -> Dict[str, Any]:
    started = time.time()
    init_db()
    inserted = 0

    with connect_db() as conn:
        feeds = conn.execute("SELECT category,title,url FROM feeds WHERE enabled=1").fetchall()
        for f in feeds:
            category = f["category"]
            source_title = f["title"]
            feed_url = f["url"]

            parsed = feedparser.parse(feed_url)
            entries = getattr(parsed, "entries", [])[:limit_per_feed]
            for e in entries:
                title = (getattr(e, "title", "") or "").strip()
                url = (getattr(e, "link", "") or "").strip()
                if not title or not url:
                    continue
                summary = getattr(e, "summary", None) or getattr(e, "description", None) or None
                published_at = parse_dt(e)
                inserted += upsert_article(
                    conn,
                    feed_url=feed_url,
                    category=category,
                    source_title=source_title,
                    title=title,
                    url=url,
                    summary=summary,
                    published_at=published_at,
                )

        set_meta(conn, "last_fetch_at", utc_now_iso())

    return {
        "ok": True,
        "inserted": inserted,
        "elapsed_ms": int((time.time() - started) * 1000),
    }


def ensure_fresh(max_age_seconds: int = 60 * 60 * 6) -> Dict[str, Any]:
    init_db()
    with connect_db() as conn:
        last = get_meta(conn, "last_fetch_at")
    if not last:
        return fetch_once()
    try:
        dt = dateparser.parse(last)
        if not dt:
            return fetch_once()
        age = datetime.now(timezone.utc) - dt.astimezone(timezone.utc)
        if age.total_seconds() > max_age_seconds:
            return fetch_once()
        return {"ok": True, "skipped": True, "last_fetch_at": last}
    except Exception:
        return fetch_once()


def list_articles(category: Optional[str], limit: int) -> List[Dict[str, Any]]:
    init_db()
    with connect_db() as conn:
        if category and category != "all":
            rows = conn.execute(
                """
                SELECT category, source_title, title, url, summary, published_at
                FROM articles
                WHERE category=?
                ORDER BY COALESCE(published_at, fetched_at) DESC
                LIMIT ?
                """,
                (category, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT category, source_title, title, url, summary, published_at
                FROM articles
                ORDER BY COALESCE(published_at, fetched_at) DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

    return [
        {
            "category": r["category"],
            "source": r["source_title"],
            "title": r["title"],
            "url": r["url"],
            "summary": (r["summary"] or "")[:300],
            "published_at": r["published_at"],
        }
        for r in rows
    ]


app = FastAPI(title="LearnSite")


@app.on_event("startup")
def _startup() -> None:
    ensure_fresh()


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "time": utc_now_iso()}


@app.post("/api/fetch")
def fetch() -> Dict[str, Any]:
    return fetch_once()


@app.get("/api/articles")
def articles(category: str = "all", limit: int = 30) -> JSONResponse:
    ensure_fresh()
    limit = max(1, min(int(limit), 100))
    data = list_articles(category, limit)
    return JSONResponse({"ok": True, "items": data})


@app.get("/api/pinned")
def pinned(count: int = 3) -> JSONResponse:
    ensure_fresh()
    count = max(1, min(int(count), 10))
    items = list_articles(None, 80)
    # “每日置顶自动更新”：用日期做稳定轮换（同一天不变）
    seed = datetime.now().strftime("%Y-%m-%d")
    h = 2166136261
    for ch in seed:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    x = h or 1
    arr = items[:]
    for i in range(len(arr) - 1, 0, -1):
        x = (1664525 * x + 1013904223) & 0xFFFFFFFF
        j = x % (i + 1)
        arr[i], arr[j] = arr[j], arr[i]
    return JSONResponse({"ok": True, "date": seed, "items": arr[:count]})


app.mount("/", StaticFiles(directory=APP_DIR, html=True), name="static")


@app.get("/")
def root() -> FileResponse:
    return FileResponse(os.path.join(APP_DIR, "index.html"))

