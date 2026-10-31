"""
dsa_engine/common.py  –  small helpers shared by algorithms (not an algorithm itself,
so the registry skips it). New algorithms can import from here instead of copy-pasting.
"""
MAX_VALUE = 999


def plural(count, word):
    """1 check, 2 checks"""
    return f"{count} {word}" if count == 1 else f"{count} {word}s"


def is_int(x):
    """True for whole numbers (True/False are excluded on purpose)."""
    return isinstance(x, int) and not isinstance(x, bool)


def clean_list(array, max_length):
    """Check a list of whole numbers from the website. Raise ValueError with a friendly message if bad."""
    if not isinstance(array, list) or len(array) == 0:
        raise ValueError("Please enter at least one number in the array.")
    if len(array) > max_length:
        raise ValueError(f"Please use at most {max_length} numbers.")
    if not all(is_int(x) for x in array):
        raise ValueError("The array can only contain whole numbers.")
    if any(abs(x) > MAX_VALUE for x in array):
        raise ValueError(f"Please keep each number between -{MAX_VALUE} and {MAX_VALUE}.")
    return array