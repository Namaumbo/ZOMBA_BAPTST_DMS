from datetime import datetime


def generate_member_number(last_id: int) -> str:
    """Generate a member number like ZBC-2026-0001."""
    year = datetime.now().year
    return f"ZBC-{year}-{str(last_id + 1).zfill(4)}"
