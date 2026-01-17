"""
Time utilities.
"""
from datetime import datetime


def now_iso() -> str:
    """Get current time in ISO format."""
    return datetime.now().isoformat(timespec="seconds")


def elapsed_seconds(start_iso: str) -> float:
    """Calculate elapsed seconds from ISO timestamp."""
    start = datetime.fromisoformat(start_iso)
    return (datetime.now() - start).total_seconds()
