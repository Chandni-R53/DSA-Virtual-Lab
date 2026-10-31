"""
dsa_engine/sorting/quick_sort.py  –  QUICK SORT

Pick a pivot (the last number of the part we are sorting), then sort the other numbers into
two sides: smaller-or-equal on its left, bigger on its right. The pivot is now in its final
place. Do the same for the left part and then the right part. Drawn by js/renderers/partition.js.

Step fields:
    data       the array right now (changes when two numbers are swapped)
    ids        ids[position] = which original number sits there (lets the bars slide)
    range      [lo, hi] the part being sorted right now (None = nothing)
    pivot      position of the pivot (-1 = none)
    i          last position of the "smaller or equal" side
    scanned    last position that has been checked (lo - 1 before the first check)
    comparing  [j, pivot] the number being compared with the pivot, or []
    swapping   the two positions swapped in this step, or []
    done       positions already in their final place
    pointers   {position: "i j pivot"}  small labels under the bars
    line, message, vars, result   as usual.   result type "found" = success.
"""
import random

from dsa_engine.common import clean_list, plural

MAX_LENGTH = 20


def _counts(n):
    """(best, average, worst) comparisons for n numbers when the pivot is the last number."""
    best, avg = [0, 0], [0.0, 0.0]
    for k in range(2, n + 1):
        a = (k - 1) // 2
        best.append(k - 1 + best[a] + best[k - 1 - a])
        avg.append(k - 1 + 2 * sum(avg[:k]) / k)
    if n < 2:
        return 0, 0.0, 0
    return best[n], avg[n], n * (n - 1) // 2


def complexity(values):
    n = len(values["array"])
    best, average, worst = _counts(n)
    average = round(average)
    top = max(worst, 1)
    return {
        "time": {
            "intro": "How many comparisons it needs. Shown for your array of {n} numbers.",
            "n": n,
            "cases": [
                {"name": "Best", "big": "O(n log n)", "checks": plural(best, "comparison"), "fraction": best / top,
                 "tone": "low", "note": "Every pivot lands in the middle, so the parts keep halving."},
                {"name": "Average", "big": "O(n log n)", "checks": "≈ " + plural(average, "comparison"),
                 "fraction": average / top, "tone": "mid", "note": "A random order gives reasonably balanced parts."},
                {"name": "Worst", "big": "O(n²)", "checks": plural(worst, "comparison"), "fraction": 1, "tone": "high",
                 "note": "Already sorted or all equal: the pivot is always at the edge, so one part is empty."},
            ],
            "summary": "A good pivot halves the work every time, which is why the usual case is {big}.",
            "summary_big": "O(n log n)",
        },
        "space": {
            "big": "O(log n)",
            "text": "It sorts in place. Only the chain of calls uses extra memory: about log n levels, up to n in the worst case.",
        },
    }


META = {
    "id": "quick-sort",
    "title": "Quick Sort",
    "category": "Searching & Sorting",
    "renderer": "partition",
    "description": "Pick a pivot, put smaller numbers on its left and bigger numbers on its right, then repeat on each side.",
    "legend": [
        {"cls": "", "label": "Not checked yet"},
        {"cls": "sml", "label": "Smaller or equal"},
        {"cls": "big", "label": "Bigger"},
        {"cls": "pvt", "label": "Pivot"},
        {"cls": "cur", "label": "Being compared"},
        {"cls": "swp", "label": "Just swapped"},
        {"cls": "srt", "label": "In final place"},
    ],
    "inputs": [
        {"id": "array", "label": "Enter your array", "type": "list", "max_length": MAX_LENGTH,
         "placeholder": "Type numbers separated by commas, e.g. 8, 3, 7, 1, 5, 9, 2",
         "hint": f"Up to {MAX_LENGTH} numbers. Duplicates and negatives are fine."},
    ],
    "defaults": {"array": [8, 3, 7, 1, 5, 9, 2, 6]},
    "pseudocode": [
        {"t": "quickSort(lo, hi):", "indent": 0},
        {"t": "if lo >= hi: return", "indent": 1},
        {"t": "pivot = arr[hi];  i = lo - 1", "indent": 1},
        {"t": "for j from lo to hi - 1", "indent": 1},
        {"t": "if arr[j] <= pivot: i++, swap", "indent": 2},
        {"t": "swap arr[i + 1] and arr[hi]", "indent": 1},
        {"t": "quickSort both sides of p", "indent": 1},
    ],
}
META["complexity"] = complexity(META["defaults"])


def validate(data):
    """Check the input from the website. Raise ValueError with a friendly message if it is bad."""
    return {"array": clean_list(data.get("array"), MAX_LENGTH)}


def random_input():
    n = random.randint(6, 10)
    return {"array": random.sample(range(-20, 100), n)}


def run(values):
    array = list(values["array"])            # we sort a copy
    n = len(array)
    ids = list(range(n))                     # a fixed identity per number, so the bars can slide

    steps = []
    done = set()                 # positions in their final place
    comparisons = swaps = 0
    last_j = None                # the vars strip keeps the last j

    def snap(line, message, rng=None, pivot=-1, i=None, scanned=None, comparing=(), swapping=(), result=None):
        nonlocal last_j
        if comparing:
            last_j = comparing[0]
        pointers = {}
        if rng is not None:
            if i is not None and i >= rng[0]:
                pointers.setdefault(i, []).append("i")
            if comparing:
                pointers.setdefault(comparing[0], []).append("j")
            if pivot >= 0:
                pointers.setdefault(pivot, []).append("pivot")
        steps.append({
            "data": list(array),
            "ids": list(ids),
            "range": list(rng) if rng is not None else None,
            "pivot": pivot,
            "i": -1 if i is None else i,
            "scanned": -1 if scanned is None else scanned,
            "comparing": list(comparing),
            "swapping": list(swapping),
            "done": sorted(done),
            "pointers": {k: " ".join(v) for k, v in pointers.items()},
            "line": line,
            "message": message,
            "vars": [
                {"k": "range =", "v": "–" if rng is None else f"[{rng[0]}, {rng[1]}]", "hl": False},
                {"k": "pivot =", "v": "–" if pivot < 0 else array[pivot], "hl": pivot >= 0},
                {"k": "i =", "v": "–" if i is None else i, "hl": False},
                {"k": "j =", "v": "–" if last_j is None or rng is None else last_j, "hl": len(comparing) > 0},
                {"k": "comparisons =", "v": comparisons, "hl": False},
                {"k": "swaps =", "v": swaps, "hl": False},
            ],
            "result": result,
        })

    if n == 1:
        done.add(0)
        snap(-1, "There is only one number, so it is already sorted.",
             result={"type": "found", "text": "Already sorted. 0 comparisons and 0 swaps needed."})
        return steps

    snap(0, "Quick Sort picks a pivot, puts smaller numbers on its left and bigger numbers on its right, "
            "and then repeats on each side.")

    def sort(lo, hi):
        nonlocal comparisons, swaps
        if lo >= hi:
            return
        rng = (lo, hi)
        pivot_value = array[hi]
        i = lo - 1
        snap(2, f"Sort indexes {lo}–{hi}. Take the last number, {pivot_value}, as the pivot. "
                f"Numbers ≤ {pivot_value} will go to its left, bigger ones to its right.",
             rng=rng, pivot=hi, i=i, scanned=lo - 1)

        for j in range(lo, hi):
            comparisons += 1
            value = array[j]
            if value <= pivot_value:
                i += 1
                if i != j:
                    array[i], array[j] = array[j], array[i]
                    ids[i], ids[j] = ids[j], ids[i]
                    swaps += 1
                    snap(4, f"Is {value} ≤ pivot {pivot_value}? Yes, so it belongs on the small side. "
                            f"Swap it with arr[{i}].",
                         rng=rng, pivot=hi, i=i, scanned=j, comparing=[j, hi], swapping=[i, j])
                else:
                    snap(4, f"Is {value} ≤ pivot {pivot_value}? Yes, and it is already next to the small side.",
                         rng=rng, pivot=hi, i=i, scanned=j, comparing=[j, hi])
            else:
                snap(4, f"Is {value} ≤ pivot {pivot_value}? No, so it stays on the big side.",
                     rng=rng, pivot=hi, i=i, scanned=j, comparing=[j, hi])

        p = i + 1                                   # the pivot's final place
        if p != hi:
            array[p], array[hi] = array[hi], array[p]
            ids[p], ids[hi] = ids[hi], ids[p]
            swaps += 1
            text = (f"Everything is sorted into small and big sides. Swap the pivot {pivot_value} "
                    f"into index {p}, between them. It is now in its final place.")
            snap(5, text, rng=rng, pivot=p, i=p - 1, scanned=hi, swapping=[p, hi])
        else:
            snap(5, f"Every number was ≤ the pivot, so the pivot {pivot_value} is already in its final place at index {p}.",
                 rng=rng, pivot=p, i=p - 1, scanned=hi)
        done.add(p)
        for a, b in ((lo, p - 1), (p + 1, hi)):     # a part with one number needs no more work
            if a == b:
                done.add(a)

        sort(lo, p - 1)                              # the whole left part first ...
        sort(p + 1, hi)                              # ... then the right part

    sort(0, n - 1)

    snap(-1, "Every number is in its final place, so the array is sorted!",
         result={"type": "found",
                 "text": f"Sorted! {plural(comparisons, 'comparison')} and {plural(swaps, 'swap')}."})
    return steps