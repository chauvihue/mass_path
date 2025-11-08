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
    "Berkshire": 2,
    "Franklin": 3,
    "Worcester": 4,
    "Hampshire": 1
}

# Helper to verify the hall mapping against the API HTML
def verify_hall_mapping(verbose: bool = False):
    """Check each tid in DEFAULT_HALLS and log the detected hall name from the API HTML."""
    for hall, tid in DEFAULT_HALLS.items():
        try:
            resp = requests.get(f"{API_BASE}?tid={tid}", headers=HEADERS, timeout=10)
            if "Worcester" in resp.text:
                actual = "Worcester"
            elif "Franklin" in resp.text:
                actual = "Franklin"
            elif "Berkshire" in resp.text:
                actual = "Berkshire"
            elif "Hampshire" in resp.text:
                actual = "Hampshire"
            else:
                actual = "Unknown"
            if verbose:
                print(f"[verify] tid={tid} → detected={actual} (expected={hall})")
        except Exception as e:
            if verbose:
                print(f"[verify] failed for tid={tid}: {e}")

# Hall code mappings for filtering categories
HALL_CODES = {
    "Berkshire": ["BER"],
    "Franklin": ["FRK"],
    "Worcester": ["WOR"],
    "Hampshire": ["HMP"]
}

# Categories that belong to specific dining halls (for categories without hall codes)
# These are categories that should NOT appear in other dining halls
CATEGORY_HALL_MAPPING = {
    "Worcester": ["Tandoor", "Mediterranean", "Seasons", "Latino 1"],
    # Add more mappings as needed
    # "Berkshire": ["Some Category"],
    # "Franklin": ["Another Category"],
    # "Hampshire": ["Yet Another Category"],
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


# ---------------- Filtering helpers -----------------------------------
def should_include_category(category_name: str, hall_name: str) -> bool:
    """
    Determine if a category should be included for a given dining hall.
    Categories with hall codes (WOR, BER, FRK, HMP) are filtered based on the hall.
    Categories are also filtered based on manual mapping for categories without codes.
    """
    if not category_name:
        return True
    
    category_upper = category_name.upper()
    category_normalized = category_name.strip()
    
    # Get hall codes for this dining hall
    hall_codes = HALL_CODES.get(hall_name, [])
    
    # Check if category contains any hall codes
    for hall_code in ["WOR", "BER", "FRK", "HMP"]:
        if hall_code in category_upper:
            # If this category contains a hall code, only include if it matches our hall
            return hall_code in [code.upper() for code in hall_codes]
    
    # Check manual category mappings (for categories without hall codes)
    for mapped_hall, mapped_categories in CATEGORY_HALL_MAPPING.items():
        for mapped_category in mapped_categories:
            # Check if category name starts with or contains the mapped category name
            if mapped_category.upper() in category_upper or category_normalized.startswith(mapped_category):
                # Only include if this category belongs to the current dining hall
                if mapped_hall == hall_name:
                    return True
                else:
                    # This category belongs to a different hall, exclude it
                    return False
    
    # Categories without explicit hall codes or mappings are included by default
    # But exclude categories that explicitly mention other halls
    # (This handles cases where categories might have multiple hall codes like "Latino FRK HMP")
    for other_hall, other_codes in HALL_CODES.items():
        if other_hall != hall_name:
            for other_code in other_codes:
                if other_code in category_upper:
                    # If category explicitly mentions another hall, exclude it
                    return False
    
    # For categories without codes or mappings, check if they're known to belong to other halls
    # This prevents categories like "Tandoor", "Mediterranean", "Seasons" from appearing
    # in halls where they don't belong (they should only be in Worcester based on user feedback)
    for other_hall, mapped_categories in CATEGORY_HALL_MAPPING.items():
        if other_hall != hall_name:
            for mapped_category in mapped_categories:
                if mapped_category.upper() in category_upper or category_normalized.startswith(mapped_category):
                    # This category is known to belong to another hall, exclude it
                    return False
    
    return True


def filter_menu_by_hall(menu_data: Any, hall_name: str, verbose: bool = False) -> Any:
    """
    Filter menu data to only include categories that belong to the specified dining hall.
    """
    if not isinstance(menu_data, dict):
        return menu_data
    
    filtered_menu = {}
    
    # Iterate through meal periods
    for meal_period, meal_data in menu_data.items():
        if not isinstance(meal_data, dict):
            filtered_menu[meal_period] = meal_data
            continue
        
        filtered_meal = {}
        
        # Iterate through categories
        for category_name, category_data in meal_data.items():
            if should_include_category(category_name, hall_name):
                filtered_meal[category_name] = category_data
                if verbose:
                    print(f"[filter] Including category '{category_name}' for {hall_name}")
            else:
                if verbose:
                    print(f"[filter] Excluding category '{category_name}' from {hall_name} (belongs to different hall)")
        
        if filtered_meal:
            filtered_menu[meal_period] = filtered_meal
    
    return filtered_menu


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
            
            # Filter menu to only include categories that belong to this dining hall
            if isinstance(parsed, dict) and "menu" in parsed:
                parsed["menu"] = filter_menu_by_hall(parsed["menu"], name, verbose=verbose)
            elif isinstance(parsed, dict):
                # If parsed is the menu directly (not wrapped)
                parsed = filter_menu_by_hall(parsed, name, verbose=verbose)
            
            out[name] = {"tid": tid, "date": date_mmddyyyy, "menu": parsed}
            if verbose:
                print(f"[ok] parsed and filtered menu for {name}")
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