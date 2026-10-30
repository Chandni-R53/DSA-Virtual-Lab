"""
dsa_engine/searching/linear_search.py  –  LINEAR SEARCH

Pure Python: no web code here. This file does three things:
  1) META:         describes the algorithm (the page builds itself from this)
  2) complexity(): the time / space explanation for the user's array size
  3) run():        runs Linear Search AND records a "step" (snapshot) at every moment.
                   The website plays those steps back like a video.

A step is a dict:
    data     the array
    current  index being checked (-1 = none)
    checked  indexes already ruled out
    found    index of the match (-1 = none)
    missing  True on the last step when the target is not in the array
    line     which pseudocode line is running (0, 1, 2 ...)
    message  plain-English explanation of this step
    vars     the small "live values" strip under the boxes
    result   only on the final step: {"type": "found" | "missing", "text": "..."}
"""
import random

MAX_LENGTH = 30      # how many numbers the user may enter
MAX_VALUE = 999


def plural(count, word):
    """1 check, 2 checks"""
    return f"{count} {word}" if count == 1 else f"{count} {word}s"


def complexity(values):
    """The time / space explanation, written for THIS array size."""
    n = len(values["array"])
    half = (n + 1) // 2
    return {
        "time": {
            "intro": "How many checks it needs. Shown for your array of {n} numbers.",
            "n": n,
            "cases": [
                {"name": "Best", "big": "O(1)", "checks": plural(1, "check"), "fraction": 1 / n, "tone": "low",
                 "note": "The target is the very first element."},
                {"name": "Average", "big": "O(n)", "checks": ("≈ " + plural(half, "check")), "fraction": half / n, "tone": "mid",
                 "note": "The target is somewhere in the middle."},
                {"name": "Worst", "big": "O(n)", "checks": plural(n, "check"), "fraction": 1, "tone": "high",
                 "note": "The target is last, or not in the array at all."},
            ],
            "summary": "Double the array and the work doubles too. That straight-line growth is what {big} means.",
            "summary_big": "O(n)",
        },
        "space": {
            "big": "O(1)",
            "text": "It only remembers the index {i} and a counter, however long the array is.",
        },
    }


META = {
    "id": "linear-search",
    "title": "Linear Search",
    "category": "Searching & Sorting",
    "renderer": "cells",     # which frontend drawing style to use (js/renderers/cells.js)
    "description": "Check every element from left to right until you find the target or run out of elements.",
    "focus": {"label": "Looking for", "input": "target"},      # the chip above the boxes
    "legend": [
        {"cls": "", "label": "Unchecked"},
        {"cls": "cur", "label": "Being checked"},
        {"cls": "chk", "label": "Already checked"},
        {"cls": "fnd", "label": "Found"},
    ],
    "inputs": [
        {"id": "array", "label": "Enter your array", "type": "list", "max_length": MAX_LENGTH,
         "placeholder": "Type numbers separated by commas, e.g. 4, 2, 7, 1, 9",
         "hint": f"Up to {MAX_LENGTH} numbers. Edit them any time, then press Run."},
        {"id": "target", "label": "Target", "type": "number",
         "placeholder": "e.g. 9", "hint": "Number to find"},
    ],
    "defaults": {"array": [4, 2, 7, 1, 9, 5, 3, 8], "target": 9},
    # A step's "line" is the position in this list (0 = first line).
    "pseudocode": [
        {"t": "for i from 0 to n - 1", "indent": 0},
        {"t": "if arr[i] == target", "indent": 1},
        {"t": "return i", "indent": 2},
        {"t": "return -1", "indent": 0},
    ],
}
# First paint of the left panel (before the user runs anything)
META["complexity"] = complexity(META["defaults"])


def _is_int(x):
    """True for whole numbers (True/False are excluded on purpose)."""
    return isinstance(x, int) and not isinstance(x, bool)


def validate(data):
    """Check the input from the website. Raise ValueError with a friendly message if it is bad."""
    array = data.get("array")
    target = data.get("target")

    if not isinstance(array, list) or len(array) == 0:
        raise ValueError("Please enter at least one number in the array.")
    if len(array) > MAX_LENGTH:
        raise ValueError(f"Please use at most {MAX_LENGTH} numbers.")
    if not all(_is_int(x) for x in array):
        raise ValueError("The array can only contain whole numbers.")
    if any(abs(x) > MAX_VALUE for x in array):
        raise ValueError(f"Please keep each number between -{MAX_VALUE} and {MAX_VALUE}.")
    if not _is_int(target):
        raise ValueError("The target must be a whole number.")
    if abs(target) > MAX_VALUE:
        raise ValueError(f"The target must be between -{MAX_VALUE} and {MAX_VALUE}.")
    return {"array": array, "target": target}


def random_input():
    """A random array, and a target that is present about 70% of the time."""
    n = random.randint(6, 12)
    array = random.sample(range(1, 100), n)          # unique numbers
    if random.random() < 0.7:
        target = random.choice(array)
    else:
        target = random.choice([x for x in range(1, 100) if x not in array])
    return {"array": array, "target": target}


def run(values):
    """Run Linear Search and record the steps."""
    array = values["array"]
    target = values["target"]

    steps = []
    checked = []          # indexes we have already ruled out
    comparisons = 0
    last_i = None         # last index we looked at, so i and arr[i] stay visible between checks

    def live_vars(highlight):
        """The strip under the boxes. i and arr[i] keep their last values until a new index is checked."""
        return [
            {"k": "i =", "v": "–" if last_i is None else last_i, "hl": highlight},
            {"k": "arr[i] =", "v": "–" if last_i is None else array[last_i], "hl": highlight},
            {"k": "target =", "v": target, "hl": False},
            {"k": "comparisons =", "v": comparisons, "hl": False},
        ]

    def snap(highlight=False, **changes):
        """Save one step. Anything not given falls back to these defaults."""
        step = {
            "data": list(array),
            "current": -1,
            "checked": list(checked),
            "found": -1,
            "missing": False,
            "line": 0,
            "message": "",
            "vars": live_vars(highlight),
            "result": None,
        }
        step.update(changes)
        steps.append(step)

    snap(message=f"We are looking for {target}. Start at index 0 and go one by one.")

    for i, value in enumerate(array):
        comparisons += 1
        last_i = i

        # Step: compare this element with the target
        snap(highlight=True, current=i, line=1,
             message=f"Is arr[{i}] = {value} equal to {target}?")

        if value == target:
            # Step: found it, stop
            snap(highlight=True, current=i, found=i, line=2,
                 message=f"Yes! {value} = {target}. We return {i} and stop.",
                 result={"type": "found",
                         "text": f"Found {target} at index {i} after {plural(comparisons, 'comparison')}."})
            return steps

        # Step: not a match, rule this index out and move on
        checked.append(i)
        snap(line=0, message=f"No, {value} ≠ {target}. Move on to the next index.")

    # Reached the end without finding it
    snap(line=3, missing=True,
         message=f"We checked all {plural(len(array), 'element')} and never saw {target}. Return -1.",
         result={"type": "missing",
                 "text": f"{target} is not in the array. All {plural(len(array), 'element')} checked ({plural(comparisons, 'comparison')})."})
    return steps