#!/usr/bin/env python3
"""
UMass Dining — foodpro-menu-ajax fetcher + HTML -> structured JSON parser

Usage examples:
  # default: fetch tomorrow for all halls in the built-in mapping
  python3 webscraping.py

  # fetch for a single tid and specific date
  python3 webscraping.py --tids 2 --date 2025-11-08

  # fetch for specific named halls (names from the mapping)
  python3 webscraping.py --names Hampshire,Worcester

  # verbose logging and custom output file
  python3 webscraping.py --verbose --out menus_parsed.json
"""

import argparse
import json
import time
from datetime import datetime, timedelta
from typing import Any, Dict
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup

# --- CONFIG ----------------------------------------------------------
API_BASE = "https://umassdining.com/foodpro-menu-ajax"
HEADERS = {
    "User-Agent": "umass-menu-scraper/1.0 (+https://umass.edu)"
}
DEFAULT_OUTFILE = "umass_menu_parsed.json"

# common mapping: name -> tid (adjust if you know different ids)
DEFAULT_HALLS = {
    "Berkshire": 1,
    "Franklin": 2,
    "Worcester": 3,
    "Hampshire": 4
}
# --------------------------------------------------------------------


def mmddyyyy_from_date(dt: datetime) -> str:
    """Return date formatted as MM/DD/YYYY for the API."""
    return dt.strftime("%m/%d/%Y")


def date_from_arg(date_str: str | None) -> str:
    """Convert an ISO-like date (YYYY-MM-DD or YYYY/MM/DD) to MM/DD/YYYY.
    If date_str is None, return tomorrow's date."""
    if date_str:
        # allow YYYY-MM-DD or YYYY/MM/DD
        try:
            if "-" in date_str:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
            elif "/" in date_str and date_str.count("/") == 2:
                # accept mm/dd/yyyy or yyyy/mm/dd - try common forms
                parts = date_str.split("/")
                if len(parts[0]) == 4:
                    dt = datetime.strptime(date_str, "%Y/%m/%d")
                else:
                    dt = datetime.strptime(date_str, "%m/%d/%Y")
            else:
                dt = datetime.fromisoformat(date_str)
        except Exception as e:
            raise ValueError(f"Unrecognized date format: {date_str}") from e
    else:
        dt = datetime.today() + timedelta(days=1)
    return mmddyyyy_from_date(dt)


def fetch_raw_menu_for_tid(tid: int, date_mmddyyyy: str, retries: int = 2, verbose: bool = False) -> Any:
    """Call the foodpro-menu-ajax endpoint for a given tid and date. Return parsed JSON (or raw text on failure)."""
    params = {"tid": tid, "date": date_mmddyyyy}
    url = f"{API_BASE}?{urlencode(params)}"
    attempt = 0
    while attempt <= retries:
        attempt += 1
        try:
            if verbose:
                print(f"[fetch] GET {url} (attempt {attempt})")
            resp = requests.get(url, headers=HEADERS, timeout=10)
            resp.raise_for_status()
            # The endpoint usually returns JSON; try to parse it.
            try:
                return resp.json()
            except ValueError:
                # If JSON decode fails maybe it's a string containing HTML or something unexpected
                if verbose:
                    print("[fetch] Response not JSON; returning raw text")
                return resp.text
        except Exception as e:
            if attempt > retries:
                if verbose:
                    print(f"[fetch] failed after {attempt} attempts: {e}")
                raise
            else:
                if verbose:
                    print(f"[fetch] request failed (attempt {attempt}): {e} — retrying in 1s")
                time.sleep(1)
    # Shouldn't get here
    return None


# ---------------- Parsing helpers ------------------------------------
def safe_int(value):
    if value is None:
        return None
    try:
        return int(float(value))
    except Exception:
        return None


def parse_category_html(category_html: str, verbose: bool = False) -> Dict[str, Any]:
    """
    Parse an HTML fragment for a single category and return:
      { "title": <category title or None>, "items": [ {dish dict}, ... ] }
    Expects markup with <h2 class='menu_category_name'> ... </h2> and <li class="lightbox-nutrition">...
    """
    soup = BeautifulSoup(category_html, "html.parser")

    title_tag = soup.find("h2", class_="menu_category_name") or soup.find("h2")
    title = title_tag.get_text(strip=True) if title_tag else None

    items = []
    for li in soup.select("li.lightbox-nutrition"):
        a = li.find("a")
        if a:
            attrs = {k: v for k, v in a.attrs.items() if k.startswith("data-")}
            dish = {
                "name": a.get_text(strip=True),
                # common data-* attributes:
                "dish_name_attr": attrs.get("data-dish-name") or attrs.get("data-dishname") or None,
                "allergens": (attrs.get("data-allergens") or "").strip(),
                "ingredients": (attrs.get("data-ingredient-list") or "").strip(),
                "clean_diet": (attrs.get("data-clean-diet-str") or "").strip(),
                "serving_size": (attrs.get("data-serving-size") or "").strip(),
                "calories": safe_int(attrs.get("data-calories")),
                "healthfulness": (attrs.get("data-healthfulness") or "").strip(),
                "carbon": (attrs.get("data-carbon-list") or "").strip(),
                "recipe_webcode": (attrs.get("data-recipe-webcode") or "").strip(),
                "raw_attrs": attrs,
            }
        else:
            # fallback: take plain text inside li
            dish = {"name": li.get_text(" ", strip=True)}

        # collect icons (img tags) for each item
        icons = []
        for img in li.find_all("img"):
            icons.append({"src": img.get("src"), "alt": img.get("alt", "")})
        if icons:
            dish["icons"] = icons

        items.append(dish)

    # fallback: if there were no li.lightbox-nutrition elements, collect top-level text items
    if not items:
        for li in soup.find_all("li"):
            text = li.get_text(" ", strip=True)
            if text:
                items.append({"name": text})

    if verbose:
        print(f"[parse] category title={title!r}, items_found={len(items)}")

    return {"title": title, "items": items}


def recursively_parse_html_in_obj(obj: Any, verbose: bool = False) -> Any:
    """
    Walk the object (dict/list/str/...) and wherever a string looks like HTML (contains '<li' or '<h2')
    parse it into structured JSON via parse_category_html.
    """
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            out[k] = recursively_parse_html_in_obj(v, verbose=verbose)
        return out
    elif isinstance(obj, list):
        return [recursively_parse_html_in_obj(v, verbose=verbose) for v in obj]
    elif isinstance(obj, str):
        if "<li" in obj or "<h2" in obj or "<ul" in obj:
            parsed = parse_category_html(obj, verbose=verbose)
            # return list of items (preferred) keyed by title
            if parsed["title"]:
                return {parsed["title"]: parsed["items"]}
            else:
                return parsed["items"]
        else:
            return obj
    else:
        return obj


# ---------------- High-level flow -----------------------------------
def scrape_multiple_tids(tids: Dict[str, int], date_mmddyyyy: str, verbose: bool = False) -> Dict[str, Any]:
    """Fetch and parse menus for multiple named tids. Returns a dictionary keyed by hall name."""
    out = {}
    for name, tid in tids.items():
        try:
            if verbose:
                print(f"\n=== Fetching {name} (tid={tid}) for {date_mmddyyyy} ===")
            raw = fetch_raw_menu_for_tid(tid, date_mmddyyyy, verbose=verbose)
            # raw may be dict, list, or a str containing HTML. Parse recursively any HTML fragments.
            parsed = None
            if isinstance(raw, (dict, list)):
                parsed = recursively_parse_html_in_obj(raw, verbose=verbose)
            elif isinstance(raw, str):
                # try to parse string as HTML fragment
                parsed = recursively_parse_html_in_obj(raw, verbose=verbose)
            else:
                parsed = raw
            out[name] = {"tid": tid, "date": date_mmddyyyy, "menu": parsed}
            if verbose:
                print(f"[ok] parsed menu for {name}")
        except Exception as e:
            out[name] = {"tid": tid, "date": date_mmddyyyy, "error": str(e)}
            if verbose:
                print(f"[error] {name}: {e}")
    return out


# ---------------- CLI and main --------------------------------------
def main():
    p = argparse.ArgumentParser(description="Fetch UMass Dining foodpro-menu-ajax data and parse embedded HTML into JSON.")
    p.add_argument("--date", "-d", help="Date to fetch (YYYY-MM-DD or MM/DD/YYYY). Defaults to tomorrow.", default=None)
    p.add_argument("--names", help="Comma-separated hall names from mapping (e.g. Hampshire,Berkshire). Default: all.", default=None)
    p.add_argument("--tids", help="Comma-separated tid integers (e.g. 2,4). Overrides names mapping.", default=None)
    p.add_argument("--out", "-o", help=f"Output filename (default: {DEFAULT_OUTFILE})", default=DEFAULT_OUTFILE)
    p.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    args = p.parse_args()

    try:
        date_mmddyyyy = date_from_arg(args.date)
    except ValueError as e:
        print("Error parsing date:", e)
        return

    if args.tids:
        # parse provided tids
        try:
            tid_list = [int(x.strip()) for x in args.tids.split(",") if x.strip()]
            tids_map = {f"tid_{tid}": tid for tid in tid_list}
        except Exception as e:
            print("Error parsing tids:", e)
            return
    elif args.names:
        names = [n.strip() for n in args.names.split(",") if n.strip()]
        tids_map = {}
        for n in names:
            if n in DEFAULT_HALLS:
                tids_map[n] = DEFAULT_HALLS[n]
            else:
                print(f"Warning: name '{n}' not in default mapping; skipping.")
    else:
        tids_map = DEFAULT_HALLS.copy()

    if args.verbose:
        print(f"[config] date={date_mmddyyyy}, targets={list(tids_map.keys())}, outfile={args.out}")

    result = scrape_multiple_tids(tids_map, date_mmddyyyy, verbose=args.verbose)

    # Save JSON
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\nSaved parsed menus to {args.out}")


if __name__ == "__main__":
    main()