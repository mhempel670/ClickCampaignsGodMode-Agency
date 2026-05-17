"""
LeadScrape → Mailshake CSV Cleaner
-----------------------------------
Supports two LeadScrape export formats:
  Format A (contacts): First Name, Last Name, Role, Email, ...
  Format B (companies): Business, Street, City, ..., Contact First Name, Contact Last Name, Contact Role, Contact Email

Filters for decision-maker roles, deduplicates to max 3 contacts per company,
and outputs a clean CSV ready to import into Mailshake.

Usage:
    python tools/leadscrape-to-mailshake.py                        # processes all CSVs in tools/lead-import/input/
    python tools/leadscrape-to-mailshake.py input.csv              # single file
    python tools/leadscrape-to-mailshake.py input.csv --output out.csv
"""

import csv
import sys
import os
import argparse
from collections import defaultdict

# ---------------------------------------------------------------------------
# Role priority config
# ---------------------------------------------------------------------------

PRIORITY_1 = [
    "owner", "co-owner", "co owner", "president", "ceo",
    "chief executive officer", "founder", "co-founder", "principal",
    "managing partner", "partner",
]

PRIORITY_2 = [
    "general manager", "gm", "operations manager", "vp of operations",
    "vice president of operations", "vp operations", "director of operations",
    "director operations",
]

PRIORITY_3 = [
    "marketing manager", "marketing director", "director of marketing",
    "vp of marketing", "vice president of marketing", "vp marketing",
    "chief marketing officer", "cmo",
]

ROLE_PRIORITY = {}
for t in PRIORITY_1: ROLE_PRIORITY[t] = 1
for t in PRIORITY_2: ROLE_PRIORITY[t] = 2
for t in PRIORITY_3: ROLE_PRIORITY[t] = 3

MAX_PER_COMPANY = 3

OUTPUT_FIELDS = ["first_name", "last_name", "email", "role", "business_name", "city", "state", "phone", "linkedin", "domain"]


def get_role_priority(role: str) -> int:
    normalized = role.strip().lower()
    if normalized in ROLE_PRIORITY:
        return ROLE_PRIORITY[normalized]
    for key, priority in ROLE_PRIORITY.items():
        if key in normalized:
            return priority
    return 99


def get_company_key(domain: str, company: str) -> str:
    d = domain.strip().lower().replace("www.", "")
    if d:
        return d
    return company.strip().lower() or "unknown"


def detect_format(headers: list) -> str:
    """Return 'contacts' or 'companies' based on column headers."""
    h = [x.strip().lower() for x in headers]
    if "first name" in h and "role" in h and "email" in h:
        return "contacts"
    if "business" in h and "contact first name" in h:
        return "companies"
    return "unknown"


def normalize_contacts_row(row: dict) -> dict:
    """Map Format A (contacts) columns to standard output."""
    return {
        "first_name":    row.get("First Name", "").strip(),
        "last_name":     row.get("Last Name", "").strip(),
        "email":         row.get("Email", "").strip(),
        "role":          row.get("Role", "").strip(),
        "business_name": row.get("Company", "").strip(),
        "city":          row.get("City", "").strip(),
        "state":         row.get("State", "").strip(),
        "phone":         row.get("Phone", "").strip(),
        "linkedin":      row.get("LinkedIn", "").strip(),
        "domain":        row.get("Domain", "").strip(),
    }


def normalize_companies_row(row: dict) -> dict:
    """Map Format B (companies) columns to standard output."""
    first = row.get("Contact First Name", "").strip()
    last  = row.get("Contact Last Name", "").strip()
    email = row.get("Contact Email", "").strip()
    role  = row.get("Contact Role", "").strip()
    if not email:
        # Fall back to company-level email if no contact email
        email = row.get("Email", "").strip()
    domain = ""
    website = row.get("Website", "").strip().lower()
    if website:
        domain = website.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
    company = row.get("Business", "").strip()
    return {
        "first_name":    first,
        "last_name":     last,
        "email":         email,
        "role":          role,
        "business_name": company,
        "city":          row.get("City", "").strip(),
        "state":         row.get("State", "").strip(),
        "phone":         row.get("Phone", "").strip(),
        "linkedin":      row.get("Linkedin", "").strip(),
        "domain":        domain,
    }


def process_file(input_path: str, output_path: str):
    for enc in ("utf-8-sig", "latin-1", "cp1252"):
        try:
            with open(input_path, newline="", encoding=enc) as f:
                reader = csv.DictReader(f)
                headers = reader.fieldnames or []
                fmt = detect_format(headers)
                rows = list(reader)
            break
        except (UnicodeDecodeError, Exception):
            continue
    else:
        print(f"  ERROR: Could not decode {input_path} — skipping.\n")
        return 0

    print(f"\n  File:   {os.path.basename(input_path)}")
    print(f"  Format: {fmt}")
    print(f"  Input:  {len(rows)} rows")

    if fmt == "unknown":
        print(f"  WARNING: Unrecognized format — skipping.\n")
        return 0

    # Normalize all rows
    normalized = []
    for row in rows:
        if fmt == "contacts":
            n = normalize_contacts_row(row)
        else:
            n = normalize_companies_row(row)
        normalized.append(n)

    # Filter: must have email with @
    dropped_email = 0
    dropped_role = 0
    scored = []

    for n in normalized:
        email = n["email"]
        if not email or "@" not in email:
            dropped_email += 1
            continue
        priority = get_role_priority(n["role"])
        if priority == 99:
            dropped_role += 1
            continue
        scored.append((priority, n))

    print(f"  Dropped (no/invalid email): {dropped_email}")
    print(f"  Dropped (non-target role):  {dropped_role}")
    print(f"  Remaining after filtering:  {len(scored)}")

    # Deduplicate by company (max MAX_PER_COMPANY per domain/company)
    groups = defaultdict(list)
    for priority, n in scored:
        key = get_company_key(n["domain"], n["business_name"])
        groups[key].append((priority, n))

    final = []
    for key, contacts in groups.items():
        contacts.sort(key=lambda x: x[0])
        for _, n in contacts[:MAX_PER_COMPANY]:
            final.append(n)

    print(f"  Companies found:            {len(groups)}")
    print(f"  Final leads (max {MAX_PER_COMPANY}/company):    {len(final)}")

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(final)

    print(f"  Output: {output_path}\n")
    return len(final)


def main():
    parser = argparse.ArgumentParser(description="LeadScrape → Mailshake CSV Cleaner")
    parser.add_argument("input", nargs="?", help="Input CSV file (omit to process all files in tools/lead-import/input/)")
    parser.add_argument("--output", help="Output file path (single-file mode only)", default=None)
    args = parser.parse_args()

    if args.input:
        # Single file mode
        if not os.path.exists(args.input):
            print(f"\n  Error: File not found — {args.input}\n")
            sys.exit(1)
        output = args.output or os.path.splitext(args.input)[0] + "_mailshake_ready.csv"
        process_file(args.input, output)
    else:
        # Batch mode — process all CSVs in tools/lead-import/input/
        script_dir = os.path.dirname(os.path.abspath(__file__))
        input_dir  = os.path.join(script_dir, "lead-import", "input")
        output_dir = os.path.join(script_dir, "lead-import", "output")
        os.makedirs(output_dir, exist_ok=True)

        csv_files = [f for f in os.listdir(input_dir) if f.lower().endswith(".csv")]
        if not csv_files:
            print(f"\n  No CSV files found in {input_dir}\n")
            sys.exit(0)

        print(f"\n  Found {len(csv_files)} CSV file(s) to process.")
        total = 0
        for fname in csv_files:
            inp = os.path.join(input_dir, fname)
            out = os.path.join(output_dir, os.path.splitext(fname)[0] + "_mailshake_ready.csv")
            total += process_file(inp, out)

        print(f"  ✓ Done. {total} total leads across {len(csv_files)} files.")
        print(f"  Output folder: {output_dir}\n")


if __name__ == "__main__":
    main()
