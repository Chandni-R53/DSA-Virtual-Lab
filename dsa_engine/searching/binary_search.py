"""
dsa_engine/searching/binary_search.py  –  BINARY SEARCH

Same shape as linear_search.py: META, complexity(), validate(), random_input(), run().

Binary Search only works on a SORTED array (smallest to largest). Each time it looks at
the middle element and throws away the half that cannot contain the target.

Extra step fields used here (on top of the ones in linear_search.py):
    pointers   {index: "L" | "M" | "R" | "L M" | "L M R" ...}  labels drawn above the boxes
    checked    here means "ruled out" – the indexes we have thrown away
"""
import random

from dsa_engine.searching import linear_search
from dsa_engine.searching.linear_search import MAX_LENGTH, MAX_VALUE, plural


def complexity(values):
    """The time / space explanation, written for THIS array size."""
    n = len(values["array"])
    worst = n.bit_length()                 # floor(log2 n) + 1 : how many times we can halve
    average = max(1, worst - 1)
    return {
        "time": {
            "intro": "How many checks it needs. Shown for your array of {n} numbers.",
            "n": n,
            "cases": [
                {"name": "Best", "big": "O(1)", "checks": plural(1, "check"), "fraction": 1 / n, "tone": "low",
                 "note": "The target is exactly in the middle."},
                {"name": "Average", "big": "O(log n)", "checks": "≈ " + plural(average, "check"), "fraction": average / n, "tone": "mid",
                 "note": "A few halvings are usually enough."},
                {"name": "Worst", "big": "O(log n)", "checks": plural(worst, "check"), "fraction": worst / n, "tone": "high",
                 "note": "We halve until one element is left, or the target is missing."},
            ],
            "summary": "Double the array and you need only one more check. That slow growth is what {big} means.",
            "summary_big": "O(log n)",
        },
        "space": {
            "big": "O(1)",
            "text": "It only remembers low, high and mid, however long the array is.",
        },
    }


META = {
    "id": "binary-search",
    "title": "Binary Search",
    "category": "Searching & Sorting",
    "renderer": "cells",
    "description": "On a sorted array, check the middle element and throw away the half that cannot hold the target.",
    "focus": {"label": "Looking for", "input": "target"},
    "legend": [
        {"cls": "", "label": "In search range"},
        {"cls": "cur", "label": "Middle (being checked)"},
        {"cls": "chk", "label": "Ruled out"},
        {"cls": "fnd", "label": "Found"},
    ],
    "inputs": [
        {"id": "array", "label": "Enter your sorted array", "type": "list", "max_length": MAX_LENGTH,
         "placeholder": "Smallest to largest, e.g. 1, 3, 4, 7, 9",
         "hint": f"Up to {MAX_LENGTH} numbers, sorted from smallest to largest."},
        {"id": "target", "label": "Target", "type": "number",
         "placeholder": "e.g. 7", "hint": "Number to find"},
    ],
    "defaults": {"array": [1, 3, 4, 7, 9, 12, 15, 18], "target": 12},
    "pseudocode": [
        {"t": "low = 0, high = n - 1", "indent": 0},
        {"t": "while low <= high", "indent": 0},
        {"t": "mid = (low + high) // 2", "indent": 1},
        {"t": "if arr[mid] == target: return mid", "indent": 1},
        {"t": "if arr[mid] < target: low = mid + 1", "indent": 1},
        {"t": "else: high = mid - 1", "indent": 1},
        {"t": "return -1", "indent": 0},
    ],
}
META["complexity"] = complexity(META["defaults"])


def validate(data):
    """Same checks as Linear Search (numbers only, size, range) PLUS: the array must be sorted."""
    values = linear_search.validate(data)
    array = values["array"]
    if any(array[i] > array[i + 1] for i in range(len(array) - 1)):
        raise ValueError("Binary Search needs a sorted array (smallest to largest). "
                         "Try: " + ", ".join(str(x) for x in sorted(array)))
    return values


def random_input():
    """A random SORTED array, and a target that is present about 70% of the time."""
    n = random.randint(6, 12)
    array = sorted(random.sample(range(1, 100), n))
    if random.random() < 0.7:
        target = random.choice(array)
    else:
        target = random.choice([x for x in range(0, 100) if x not in array])
    return {"array": array, "target": target}


def _span(a, b):
    """'index 3' or 'indexes 0 to 3'"""
    return f"index {a}" if a == b else f"indexes {a} to {b}"


def run(values):
    """Run Binary Search and record the steps."""
    array = values["array"]
    target = values["target"]
    n = len(array)

    steps = []
    ruled_out = []
    comparisons = 0
    low, high = 0, n - 1
    mid = None            # last middle index, so mid and arr[mid] stay visible between steps

    def pointers():
        """Where to draw L, M and R. low/high can fall outside the array at the very end: then skip them."""
        labels = {}
        for letter, index in (("L", low), ("M", mid), ("R", high)):
            if letter == "M" and not show_mid:
                continue
            if index is not None and 0 <= index < n:
                labels.setdefault(index, []).append(letter)
        return {i: " ".join(v) for i, v in labels.items()}

    show_mid = False

    def live_vars(highlight):
        return [
            {"k": "low =", "v": low, "hl": False},
            {"k": "high =", "v": high, "hl": False},
            {"k": "mid =", "v": "–" if mid is None else mid, "hl": highlight},
            {"k": "arr[mid] =", "v": "–" if mid is None else array[mid], "hl": highlight},
            {"k": "target =", "v": target, "hl": False},
            {"k": "comparisons =", "v": comparisons, "hl": False},
        ]

    def snap(highlight=False, **changes):
        step = {
            "data": list(array),
            "current": -1,
            "checked": list(ruled_out),
            "found": -1,
            "missing": False,
            "line": 0,
            "message": "",
            "pointers": pointers(),
            "vars": live_vars(highlight),
            "result": None,
        }
        step.update(changes)
        steps.append(step)

    snap(line=0, message=f"We are looking for {target}. The array is sorted, so we can cut it in half "
                         f"again and again. The search range is the whole array: low = 0, high = {n - 1}.")

    while low <= high:
        mid = (low + high) // 2
        show_mid = True
        snap(highlight=True, current=mid, line=2,
             message=f"Look at the middle of the range: mid = ({low} + {high}) // 2 = {mid}.")

        comparisons += 1
        value = array[mid]
        snap(highlight=True, current=mid, line=3,
             message=f"Is arr[{mid}] = {value} equal to {target}?")

        if value == target:
            snap(highlight=True, current=mid, found=mid, line=3,
                 message=f"Yes! {value} = {target}. We return {mid} and stop.",
                 result={"type": "found",
                         "text": f"Found {target} at index {mid} after {plural(comparisons, 'comparison')}."})
            return steps

        if value < target:
            ruled_out.extend(range(low, mid + 1))
            text = (f"No, {value} is smaller than {target}, so {target} must be on the right. "
                    f"Rule out {_span(low, mid)} and set low = {mid} + 1 = {mid + 1}.")
            low = mid + 1
            line = 4
        else:
            ruled_out.extend(range(mid, high + 1))
            text = (f"No, {value} is bigger than {target}, so {target} must be on the left. "
                    f"Rule out {_span(mid, high)} and set high = {mid} - 1 = {mid - 1}.")
            high = mid - 1
            line = 5
        show_mid = False
        snap(line=line, message=text)

    snap(line=6, missing=True,
         message=f"low ({low}) is now bigger than high ({high}), so no elements are left. "
                 f"{target} is not in the array. Return -1.",
         result={"type": "missing",
                 "text": f"{target} is not in the array. The range shrank to nothing after {plural(comparisons, 'comparison')}."})
    return steps