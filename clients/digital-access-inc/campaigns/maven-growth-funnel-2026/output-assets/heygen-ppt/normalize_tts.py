"""HeyGen speaker notes — Matt's spoken money style. Run: python normalize_tts.py"""
from pathlib import Path
import re

ROOT = Path(__file__).parent.parent

# Fix broken output from earlier K passes (order matters — longest first)
CLEANUP = [
    ("a about five K", "a forty-eight hundred dollar"),
    ("You lost about forty-eight hundred dollars on a", "You lost a forty-eight hundred dollar"),
    ("At a about three K", "At a thirty-two hundred dollar"),
    ("about four hundred seventy K per year", "four hundred and sixty-eight thousand a year"),
    ("about four hundred seventy K", "four hundred and sixty-eight thousand"),
    ("four hundred and seventy thousand dollars a year", "four hundred and seventy thousand a year"),
    ("four hundred and seventy thousand dollars", "four hundred and seventy thousand"),
    ("about four hundred fifty K to six hundred K", "four hundred and fifty thousand to six hundred thousand dollars"),
    ("about a hundred twenty K in annual revenue", "one hundred and nineteen thousand dollars in annual revenue"),
    ("about a hundred twenty K", "one hundred and nineteen thousand dollars"),
    ("about two hundred thirty K per year", "two hundred and thirty thousand dollars per year"),
    ("about two hundred thirty K", "two hundred and thirty thousand dollars"),
    ("about nineteen K per month", "nineteen thousand dollars per month"),
    ("about nineteen K", "nineteen thousand dollars"),
    ("about six K a month", "fifty-eight hundred dollars a month"),
    ("about six K", "fifty-eight hundred dollars"),
    ("about five K", "forty-eight hundred dollars"),
    ("about three K", "thirty-two hundred dollars"),
    ("about fourteen K", "fourteen thousand dollars"),
    ("about four hundred K in annual revenue", "four hundred thousand dollars in annual revenue"),
    ("about four hundred K in additional revenue", "four hundred thousand dollars in additional revenue"),
    ("to your four hundred K goal", "to your four hundred thousand dollar goal"),
    ("You say about four hundred K", "You say four hundred thousand dollars"),
    ("about four hundred K", "four hundred thousand dollars"),
    ("four hundred K", "four hundred thousand dollars"),
    ("about two and a half K", "twenty-five hundred dollars"),
    ("thirty-nine K walking", "thirty-nine thousand dollars walking"),
    ("thirty-nine bucks", "thirty-nine bucks"),  # keep
    ("thirty-nine dollars", "thirty-nine bucks"),
    ("eighteen K", "eighteen grand"),
    ("fifteen K average", "fifteen thousand dollar average"),
    ("fifteen K per job", "fifteen thousand dollars per job"),
    ("fifteen K", "fifteen thousand dollars"),
    ("nine K per week", "nine thousand dollars per week"),
    ("nine K", "nine thousand dollars"),
    ("forty-one K per month", "forty-one thousand dollars per month"),
    ("forty-one K", "forty-one thousand dollars"),
    ("twelve K in excess", "twelve thousand dollars in excess"),
    ("twelve K", "twelve thousand dollars"),
    ("under a thousand bucks", "under a thousand dollars"),
    ("about three forty", "three hundred forty dollars"),
    ("about two eighty", "two hundred eighty dollars"),
    ("sixty bucks", "sixty dollars"),
]

# Fresh $ in source files (if any remain)
FROM_DOLLAR = [
    ("$468,000", "four hundred and sixty-eight thousand"),
    ("$470,000", "four hundred and seventy thousand"),
    ("$450,000", "four hundred and fifty thousand dollars"),
    ("$600,000", "six hundred thousand dollars"),
    ("$400,000", "four hundred thousand"),
    ("$230,400", "two hundred and thirty thousand dollars"),
    ("$119,000", "one hundred and nineteen thousand dollars"),
    ("$19,200", "nineteen thousand dollars"),
    ("$18,500", "eighteen grand"),
    ("$15,000", "fifteen thousand dollars"),
    ("$14,200", "fourteen thousand two hundred dollars"),
    ("$12,000", "twelve thousand dollars"),
    ("$9,000", "nine thousand dollars"),
    ("$5,800", "fifty-eight hundred"),
    ("$4,800", "forty-eight hundred dollars"),
    ("$3,200", "thirty-two hundred dollars"),
    ("$2,500", "twenty-five hundred dollars"),
    ("$1.6 million", "one point six million dollars"),
    ("$1.2 million", "about one point two million"),
    ("$41,000", "forty-one thousand dollars"),
    ("$39,000", "thirty-nine thousand dollars"),
    ("$850", "eight hundred fifty dollars"),
    ("$340", "three hundred forty dollars"),
    ("$297", "two hundred ninety-seven dollars"),
    ("$280", "two hundred eighty dollars"),
    ("$60", "sixty dollars"),
    ("$39", "thirty-nine bucks"),
]

OTHER = [
    ("[NAME]", "Matt"),
    ("[your city]", "your city"),
    ("[your town]", "your town"),
    ("35–40%", "thirty-five to forty percent"),
    ("35-40%", "thirty-five to forty percent"),
    ("38%", "thirty-eight percent"),
    ("78%", "seventy-eight percent"),
    ("75%", "seventy-five percent"),
    ("60%", "sixty percent"),
    ("40%", "forty percent"),
    ("25%", "twenty-five percent"),
    ("20%", "twenty percent"),
    ("100%", "one hundred percent"),
    ("21×", "twenty-one times"),
    ("21x", "twenty-one times"),
    ("24/7", "twenty-four seven"),
    ("600+", "six hundred plus"),
    ("7-minute", "seven-minute"),
    ("12-month", "twelve-month"),
    ("5-minute", "five-minute"),
    ("5-7", "five to seven"),
    ("3–4", "three to four"),
    ("No BS", "No nonsense"),
    ("no BS", "no nonsense"),
    ("estimated CAC:", "estimated customer acquisition cost:"),
    ("your CAC ", "your customer acquisition cost "),
    ("across 200 customers", "across two hundred customers"),
    ("1five-minute", "fifteen-minute"),
    ("four hundred and sixty-eight thousand dollars a year", "four hundred and sixty-eight thousand a year"),
    ("four hundred thousand dollars in additional revenue", "four hundred thousand in additional revenue"),
    ("You say four hundred thousand dollars", "You say four hundred thousand"),
    ("four hundred thousand dollars in annual revenue", "four hundred thousand in annual revenue"),
    ("to your four hundred thousand dollar goal", "to your four hundred thousand goal"),
    ("about about one point two million", "about one point two million"),
    ("one point two million dollars a year", "about one point two million a year"),
    ("about one point two million dollars a year", "about one point two million a year"),
    ("one point six million dollars", "one point six million dollars"),
    ("about one point two million a year", "about one point two million dollars a year"),
    ("about one point six million", "about one point six million dollars"),
]


def normalize_text(text: str) -> str:
    for old, new in CLEANUP + FROM_DOLLAR + OTHER:
        text = text.replace(old, new)
    while "about about " in text:
        text = text.replace("about about ", "about ")
    while "  " in text:
        text = text.replace("  ", " ")
    return text


def process_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = normalize_text(original)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main():
    changed = []
    # Only touch voice-paste files — never Python builders
    for path in (ROOT / "heygen-voice-paste").glob("*.txt"):
        if process_file(path):
            changed.append(path.name)
    print(f"Updated {len(changed)}: {', '.join(changed) or 'none'}")


if __name__ == "__main__":
    main()
