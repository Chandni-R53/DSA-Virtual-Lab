"""
dsa_engine/sorting/selection_sort.py  -  SELECTION SORT

Each pass: find the smallest number in the unsorted part, then swap it into place.

Step fields (drawn by js/renderers/tiles.js: tiles, a scanner light and a sorted shelf):
    data      the array right now (changes when two numbers are swapped)
    ids       a fixed id per number, in the same order as data (lets the tiles move)
    current   index j being compared (-1 = none)
    min       index of the smallest number found so far in this pass (-1 = none)
    sorted    indexes that are in their final place
    swapping  the two indexes swapped in this step ([] = none)
    pointers  {index: "i min j"}  labels drawn under the bars
    line, message, vars, result   same as every algorithm.  result type "found" = success.
"""
import random

from dsa_engine.common import clean_list, plural

MAX_LENGTH = 20


def complexity(values):
    n = len(values["array"])
    c = n * (n - 1) // 2
    comparisons = plural(c, "comparison")
    return {
        "time": {
            "intro": "Comparisons needed. Shown for your array of {n} numbers.",
            "n": n,
            "cases": [
                {"name": "Best", "big": "O(n²)", "checks": comparisons, "fraction": 1, "tone": "high",
                 "note": "Already sorted: it still checks everything, but swaps nothing."},
                {"name": "Average", "big": "O(n²)", "checks": comparisons, "fraction": 1, "tone": "high",
                 "note": "Always the same number of comparisons."},
                {"name": "Worst", "big": "O(n²)", "checks": comparisons, "fraction": 1, "tone": "high",
                 "note": f"Same comparisons, and at most {plural(max(n - 1, 0), 'swap')}."},
            ],
            "summary": "Double the array and the work becomes 4 times bigger. That fast growth is what {big} means.",
            "summary_big": "O(n²)",
        },
        "space": {
            "big": "O(1)",
            "text": "It sorts in place. It only needs i, j, min and one temporary value for swapping.",
        },
    }


META = {
    "id": "selection-sort",
    "title": "Selection Sort",
    "category": "Searching & Sorting",
    "renderer": "tiles",
    "description": "Repeatedly find the smallest number in the unsorted part and swap it to the front.",
    "legend": [
        {"cls": "", "label": "Waiting"},
        {"cls": "cur", "label": "Being scanned"},
        {"cls": "fnd", "label": "Smallest so far (MIN)"},
        {"cls": "swp", "label": "Just moved"},
        {"cls": "srt", "label": "On the shelf (sorted)"},
    ],
    "inputs": [
        {"id": "array", "label": "Enter your array", "type": "list", "max_length": MAX_LENGTH,
         "placeholder": "Type numbers separated by commas, e.g. 5, 2, 9, 1, 7",
         "hint": f"Up to {MAX_LENGTH} numbers. Edit them any time, then press Run."},
    ],
    "defaults": {"array": [64, 25, 12, 22, 11, 90, 3]},
    "pseudocode": [
        {"t": "for i from 0 to n - 2", "indent": 0},
        {"t": "min = i", "indent": 1},
        {"t": "for j from i + 1 to n - 1", "indent": 1},
        {"t": "if arr[j] < arr[min]: min = j", "indent": 2},
        {"t": "swap arr[i] and arr[min]", "indent": 1},
    ],
}
META["complexity"] = complexity(META["defaults"])


def validate(data):
    """Check the input from the website. Raise ValueError with a friendly message if it is bad."""
    return {"array": clean_list(data.get("array"), MAX_LENGTH)}


def random_input():
    n = random.randint(5, 10)
    return {"array": random.sample(range(1, 100), n)}


def run(values):
    array = list(values["array"])            # we sort a copy
    n = len(array)
    ids = list(range(n))                     # a fixed identity per number, so the tiles can move

    steps = []
    done = []                  # indexes in their final place
    comparisons = swaps = 0
    i = j = low = None         # i, j and min keep their last values between steps

    def pointers(show_j=False):
        labels = {}
        for letter, index in (("i", i), ("min", low), ("j", j if show_j else None)):
            if index is not None:
                labels.setdefault(index, []).append(letter)
        return {k: " ".join(v) for k, v in labels.items()}

    def snap(line, message, current=-1, swapping=(), show_j=False, result=None, labels=True, show_min=True):
        steps.append({
            "data": list(array),
            "ids": list(ids),
            "current": current,
            "min": -1 if (low is None or not show_min) else low,
            "sorted": list(done),
            "swapping": list(swapping),
            "pointers": pointers(show_j) if labels else {},
            "found": -1,
            "missing": False,
            "line": line,
            "message": message,
            "vars": [
                {"k": "i =", "v": "-" if i is None else i, "hl": False},
                {"k": "min =", "v": "-" if low is None else low, "hl": False},
                {"k": "j =", "v": "-" if j is None else j, "hl": current >= 0},
                {"k": "comparisons =", "v": comparisons, "hl": False},
                {"k": "swaps =", "v": swaps, "hl": False},
            ],
            "result": result,
        })

    if n == 1:
        done.append(0)
        snap(-1, "There is only one number, so it is already sorted.",
             result={"type": "found", "text": "Already sorted. 0 comparisons and 0 swaps needed."})
        return steps

    snap(0, "We will sort from smallest to largest. Each pass finds the smallest number "
            "in the unsorted part and puts it in its final place.")

    for i in range(n - 1):
        low = i
        snap(1, f"Pass {i + 1}: assume arr[{i}] = {array[i]} is the smallest so far, so min = {i}.")

        for j in range(i + 1, n):
            comparisons += 1
            if array[j] < array[low]:
                text = f"Is arr[{j}] = {array[j]} smaller than arr[{low}] = {array[low]}? Yes, so min = {j}."
                low = j
            else:
                text = f"Is arr[{j}] = {array[j]} smaller than arr[{low}] = {array[low]}? No, keep min = {low}."
            snap(3, text, current=j, show_j=True)

        done.append(i)                       # after this step, index i is on the "shelf"
        if low != i:
            a, b = array[i], array[low]
            array[i], array[low] = b, a
            ids[i], ids[low] = ids[low], ids[i]
            swaps += 1
            snap(4, f"The smallest is {b} (index {low}). Swap it with arr[{i}] = {a}, so {b} goes to index {i}.",
                 swapping=(i, low), show_min=False)
        else:
            snap(4, f"arr[{i}] = {array[i]} is already the smallest here, so no swap is needed.", show_min=False)

    done.append(n - 1)                       # the last number is automatically in place
    low = None
    snap(-1, "Only one number is left, so it must be the largest. The whole array is sorted!",
         labels=False,
         result={"type": "found",
                 "text": f"Sorted! {plural(comparisons, 'comparison')} and {plural(swaps, 'swap')}."})
    return steps