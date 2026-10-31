"""
dsa_engine/sorting/bubble_sort.py  -  BUBBLE SORT

Same shape as linear_search.py: META, complexity(), validate(), random_input(), run().

Bubble Sort repeatedly compares adjacent elements and swaps them when the left
element is greater than the right. After each pass the largest unsorted element
"bubbles up" to its final position. An early-exit flag stops the algorithm when
a full pass produces no swaps - the array is already sorted.

Step fields:
    data        the current array (may differ from the original after swaps)
    ids         ids[position] = which original number sits there (lets the bubbles slide)
    comparing   [i, j] pair being compared, or [] when not comparing
    swapping    [i, j] pair just swapped (data already shows the new order), or []
    sorted      list of indexes that are in their final sorted position
    pass_num    current pass number (1-based)
    comparisons running comparison count
    swaps       running swap count
    line        which pseudocode line is highlighted (0-based)
    message     plain-English explanation of this step
    vars        the live-values strip under the bars
    result      only on the final step: {type, text}
"""
import random

MAX_LENGTH = 20      # practical maximum: bars are still readable at this size
MAX_VALUE  = 999


def plural(count, word):
    """1 swap, 2 swaps  /  1 pass, 2 passes"""
    if count == 1:
        return f"{count} {word}"
    # words ending in 's', 'x', 'sh', 'ch' need '-es'
    if word.endswith(('s', 'x', 'sh', 'ch')):
        return f"{count} {word}es"
    return f"{count} {word}s"


def complexity(values):
    """Time / space explanation for the user's specific array size."""
    n = len(values["array"])
    best_ops   = n - 1                     # one fully sorted pass: n-1 comparisons, 0 swaps
    worst_ops  = n * (n - 1) // 2         # n*(n-1)/2 comparisons on reverse-sorted input
    avg_ops    = max(best_ops, worst_ops // 2)   # never below the best case (matters for tiny arrays)
    return {
        "time": {
            "intro": "How many comparisons it needs. Shown for your array of {n} numbers.",
            "n": n,
            "cases": [
                {
                    "name":     "Best",
                    "big":      "O(n)",
                    "checks":   plural(best_ops, "comparison"),
                    "fraction": best_ops / max(worst_ops, 1),
                    "tone":     "low",
                    "note":     "Array is already sorted – one pass, no swaps, done.",
                },
                {
                    "name":     "Average",
                    "big":      "O(n²)",
                    "checks":   "≈ " + plural(avg_ops, "comparison"),
                    "fraction": avg_ops / max(worst_ops, 1),
                    "tone":     "mid",
                    "note":     "Random input typically needs about half the worst-case comparisons.",
                },
                {
                    "name":     "Worst",
                    "big":      "O(n²)",
                    "checks":   plural(worst_ops, "comparison"),
                    "fraction": 1,
                    "tone":     "high",
                    "note":     "Array is in reverse order – every element must be swapped every pass.",
                },
            ],
            "summary":     "Double the array and the work quadruples. That squared growth is what {big} means.",
            "summary_big": "O(n²)",
        },
        "space": {
            "big":  "O(1)",
            "text": "Only a handful of variables (i, j, swapped) are used, no matter how long the array is.",
        },
    }


META = {
    "id":          "bubble-sort",
    "title":       "Bubble Sort",
    "category":    "Searching & Sorting",
    "renderer":    "bubbles",       # tells main.js to load js/renderers/bubbles.js
    "description": "Repeatedly compare adjacent elements and swap them when out of order. "
                   "After each pass the largest unsorted element reaches its final position. "
                   "Stop early when a full pass makes no swaps.",
    "focus":       None,            # no single target value to highlight in a chip
    "legend": [
        {"cls": "",        "label": "Waiting"},
        {"cls": "cur",     "label": "Being compared"},
        {"cls": "swp",     "label": "Floating right"},
        {"cls": "srt",     "label": "At the surface (sorted)"},
    ],
    "inputs": [
        {
            "id":          "array",
            "label":       "Enter your array",
            "type":        "list",
            "max_length":  MAX_LENGTH,
            "placeholder": "Type numbers separated by commas, e.g. 5, 3, 8, 1, 9",
            "hint":        f"Up to {MAX_LENGTH} numbers. Duplicates and negatives are fine.",
        },
    ],
    "defaults": {"array": [5, 3, 8, 1, 9, 2, 7, 4, 6]},
    # line numbers match the pseudocode list below (0-indexed)
    "pseudocode": [
        {"t": "for pass from 1 to n - 1",                    "indent": 0},   # 0
        {"t": "swapped = false",                              "indent": 1},   # 1
        {"t": "for j from 0 to n - pass - 1",                "indent": 1},   # 2
        {"t": "if arr[j] > arr[j + 1]",                      "indent": 2},   # 3
        {"t": "swap arr[j] and arr[j + 1]",                  "indent": 3},   # 4
        {"t": "swapped = true",                               "indent": 3},   # 5
        {"t": "if not swapped: break",                       "indent": 1},   # 6
    ],
}
META["complexity"] = complexity(META["defaults"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_int(x):
    """True for whole numbers; booleans are excluded on purpose."""
    return isinstance(x, int) and not isinstance(x, bool)


# ---------------------------------------------------------------------------
# validate()
# ---------------------------------------------------------------------------

def validate(data):
    """Check input from the website. Raise ValueError with a friendly message if it is bad."""
    array = data.get("array")

    if not isinstance(array, list) or len(array) == 0:
        raise ValueError("Please enter at least one number in the array.")
    if len(array) > MAX_LENGTH:
        raise ValueError(f"Please use at most {MAX_LENGTH} numbers.")
    if not all(_is_int(x) for x in array):
        raise ValueError("The array can only contain whole numbers.")
    if any(abs(x) > MAX_VALUE for x in array):
        raise ValueError(f"Please keep each number between -{MAX_VALUE} and {MAX_VALUE}.")

    return {"array": array}


# ---------------------------------------------------------------------------
# random_input()
# ---------------------------------------------------------------------------

def random_input():
    """A random unsorted array - sometimes with duplicates, sometimes with negatives."""
    n = random.randint(5, 10)
    # Mostly positive, occasionally include a few negatives
    pool = list(range(-20, 100))
    array = random.sample(pool, n)
    random.shuffle(array)
    return {"array": array}


# ---------------------------------------------------------------------------
# run()
# ---------------------------------------------------------------------------

def run(values):
    """Run Bubble Sort and record an execution state at every meaningful moment."""
    array  = list(values["array"])   # work on a copy so the original is never mutated
    n      = len(array)
    steps  = []
    ids    = list(range(n))          # a fixed identity for every number, so the picture can slide the same bubble
    sorted_indices = []              # indexes whose element is in its final position
    comparisons    = 0
    swaps          = 0

    def live_vars(pass_num, j=None):
        return [
            {"k": "pass =",        "v": pass_num,      "hl": False},
            {"k": "j =",           "v": "-" if j is None else j, "hl": j is not None},
            {"k": "comparisons =", "v": comparisons,   "hl": False},
            {"k": "swaps =",       "v": swaps,         "hl": False},
            {"k": "sorted =",      "v": len(sorted_indices), "hl": False},
        ]

    def snap(pass_num, comparing=None, swapping=None, j=None, line=0, message="", result=None):
        steps.append({
            "data":       list(array),
            "ids":        list(ids),
            "comparing":  comparing or [],
            "swapping":   swapping  or [],
            "sorted":     list(sorted_indices),
            "pass_num":   pass_num,
            "comparisons": comparisons,
            "swaps":      swaps,
            "line":       line,
            "message":    message,
            "vars":       live_vars(pass_num, j),
            "result":     result,
        })

    # ── Initial state ────────────────────────────────────────────────────────
    snap(
        pass_num=0,
        line=0,
        message=f"Array has {n} element{'s' if n != 1 else ''}. "
                "Bubble Sort will compare adjacent pairs and push the largest unsorted value to the right.",
    )

    # ── Early-exit for a single-element array ───────────────────────────────
    if n == 1:
        sorted_indices = [0]
        snap(
            pass_num=1,
            line=6,
            message="Only one element - it is already sorted!",
            result={"type": "found", "text": "Array sorted in 0 comparisons and 0 swaps."},
        )
        return steps

    # ── Main loop ───────────────────────────────────────────────────────────
    for pass_num in range(1, n):
        snap(
            pass_num=pass_num,
            line=0,
            message=f"Pass {pass_num}: scan positions 0 to {n - pass_num - 1}, "
                    f"pushing the largest unsorted value to index {n - pass_num}.",
        )

        swapped = False

        snap(
            pass_num=pass_num,
            line=1,
            message=f"Pass {pass_num}: reset swapped flag to false.",
        )

        limit = n - pass_num   # exclusive upper bound for j
        for j in range(limit):
            comparisons += 1

            # ── Compare arr[j] and arr[j+1] ─────────────────────────────────
            snap(
                pass_num=pass_num,
                comparing=[j, j + 1],
                j=j,
                line=3,
                message=f"Comparing arr[{j}] = {array[j]} and arr[{j + 1}] = {array[j + 1]}.",
            )

            if array[j] > array[j + 1]:
                # ── Swap (done first, so the picture shows the bubble moving) ──
                big, small = array[j], array[j + 1]
                array[j], array[j + 1] = small, big
                ids[j], ids[j + 1] = ids[j + 1], ids[j]
                swaps += 1
                swapped = True
                snap(
                    pass_num=pass_num,
                    swapping=[j, j + 1],
                    j=j,
                    line=4,
                    message=f"{big} > {small}, so swap them. {big} floats one step to the right.",
                )

                snap(
                    pass_num=pass_num,
                    j=j,
                    line=5,
                    message=f"Swapped. Array is now: [{', '.join(str(x) for x in array)}]. swapped = true.",
                )
            else:
                snap(
                    pass_num=pass_num,
                    comparing=[j, j + 1],
                    j=j,
                    line=3,
                    message=f"{array[j]} ≤ {array[j + 1]}, already in order. No swap needed.",
                )

        # ── After each pass, the element at (n - pass_num) is in its final place ──
        sorted_indices.append(n - pass_num)

        if not swapped:
            # Early exit – all remaining elements are already sorted
            sorted_indices = list(range(n))
            snap(
                pass_num=pass_num,
                line=6,
                message=f"No swaps occurred in pass {pass_num}. "
                        "The array is already sorted - we can stop early!",
                result={
                    "type": "found",
                    "text": (
                        f"Array sorted in {plural(pass_num, 'pass')}! "
                        f"{plural(comparisons, 'comparison')}, {plural(swaps, 'swap')}."
                    ),
                },
            )
            return steps

        snap(
            pass_num=pass_num,
            line=6,
            message=f"Pass {pass_num} complete. "
                    f"arr[{n - pass_num}] = {array[n - pass_num]} is now in its final position.",
        )

    # ── All passes done – every element is sorted ───────────────────────────
    sorted_indices = list(range(n))
    snap(
        pass_num=n - 1,
        line=0,
        message="All passes complete. Array sorted successfully!",
        result={
            "type": "found",
            "text": (
                f"Array sorted in {plural(n - 1, 'pass')}! "
                f"{plural(comparisons, 'comparison')}, {plural(swaps, 'swap')}."
            ),
        },
    )
    return steps