"""
dsa_engine/sorting/insertion_sort.py  -  INSERTION SORT

Take the next number (the "key") and slide it to the left until it sits in the right
place among the numbers before it. The left part is always sorted, and it grows by one
each round. Drawn by js/renderers/cards.js (a hand of playing cards).

Step fields (same as the other sorting algorithms):
    data       the array right now
    ids        a fixed id per number, in the same order as data (lets the cards move)
    key        index where the key number is sitting right now (-1 = none)
    comparing  [left, right] pair being compared, or []
    swapping   [left, right] pair just swapped, or []
    sorted     indexes of the sorted part (the key is left out while it is moving)
    line, message, vars, result   as usual.   result type "found" = success.
"""
import random

from dsa_engine.common import clean_list, plural

MAX_LENGTH = 20


def complexity(values):
    n = len(values["array"])
    best = n - 1                                   # already sorted: one comparison per round
    worst = n * (n - 1) // 2                       # reversed: the key slides all the way every round
    average = max(best, worst // 2)
    return {
        "time": {
            "intro": "How many comparisons it needs. Shown for your array of {n} numbers.",
            "n": n,
            "cases": [
                {"name": "Best", "big": "O(n)", "checks": plural(best, "comparison"), "fraction": best / max(worst, 1),
                 "tone": "low", "note": "Already sorted: each number is compared once and stays where it is."},
                {"name": "Average", "big": "O(n²)", "checks": "≈ " + plural(average, "comparison"),
                 "fraction": average / max(worst, 1), "tone": "mid",
                 "note": "A typical number slides about halfway back."},
                {"name": "Worst", "big": "O(n²)", "checks": plural(worst, "comparison"), "fraction": 1, "tone": "high",
                 "note": "Reverse order: every number slides all the way to the front."},
            ],
            "summary": "Double the array and the work becomes 4 times bigger. That fast growth is what {big} means.",
            "summary_big": "O(n²)",
        },
        "space": {
            "big": "O(1)",
            "text": "It sorts in place. It only needs i, j and the key, however long the array is.",
        },
    }


META = {
    "id": "insertion-sort",
    "title": "Insertion Sort",
    "category": "Searching & Sorting",
    "renderer": "cards",
    "description": "Take the next number and slide it left until it sits in the right place among the numbers before it.",
    "legend": [
        {"cls": "crd", "label": "Card"},
        {"cls": "fnd", "label": "Card in hand (key)"},
        {"cls": "cur", "label": "Being compared"},
        {"cls": "swp", "label": "Just slid"},
        {"cls": "srt", "label": "Already in order"},
    ],
    "inputs": [
        {"id": "array", "label": "Enter your array", "type": "list", "max_length": MAX_LENGTH,
         "placeholder": "Type numbers separated by commas, e.g. 7, 3, 5, 1, 9",
         "hint": f"Up to {MAX_LENGTH} numbers. Duplicates and negatives are fine."},
    ],
    "defaults": {"array": [7, 3, 5, 1, 9, 2]},
    "pseudocode": [
        {"t": "for i from 1 to n - 1", "indent": 0},
        {"t": "j = i      (the key is arr[j])", "indent": 1},
        {"t": "while j > 0 and arr[j - 1] > arr[j]", "indent": 1},
        {"t": "swap arr[j - 1] and arr[j]", "indent": 2},
        {"t": "j = j - 1", "indent": 2},
    ],
}
META["complexity"] = complexity(META["defaults"])


def validate(data):
    """Check the input from the website. Raise ValueError with a friendly message if it is bad."""
    return {"array": clean_list(data.get("array"), MAX_LENGTH)}


def random_input():
    n = random.randint(5, 10)
    return {"array": random.sample(range(-20, 100), n)}


def run(values):
    array = list(values["array"])            # we sort a copy
    n = len(array)
    ids = list(range(n))                     # a fixed identity per number, so the cards can move

    steps = []
    comparisons = swaps = 0
    i = j = None

    def snap(line, message, key=-1, comparing=(), swapping=(), sorted_part=(), result=None):
        steps.append({
            "data": list(array),
            "ids": list(ids),
            "key": key,
            "comparing": list(comparing),
            "swapping": list(swapping),
            "sorted": [k for k in sorted_part if k != key],
            "pointers": {} if key < 0 else {key: "key"},
            "line": line,
            "message": message,
            "vars": [
                {"k": "i =", "v": "–" if i is None else i, "hl": False},
                {"k": "j =", "v": "–" if j is None else j, "hl": key >= 0},
                {"k": "key =", "v": "–" if i is None or j is None else array[j], "hl": key >= 0},
                {"k": "comparisons =", "v": comparisons, "hl": False},
                {"k": "swaps =", "v": swaps, "hl": False},
            ],
            "result": result,
        })

    if n == 1:
        snap(-1, "There is only one number, so it is already sorted.", sorted_part=[0],
             result={"type": "found", "text": "Already sorted. 0 comparisons and 0 swaps needed."})
        return steps

    snap(0, "The first number is a sorted part of size 1. We insert the next numbers into it, one at a time.",
         sorted_part=[0])

    for i in range(1, n):
        j = i
        before = list(range(i))              # the sorted part on the left of the key
        snap(1, f"Round {i}: take the key {array[j]} (index {j}) and slide it left "
                f"until it sits in the right place.", key=j, sorted_part=before)

        while j > 0:
            comparisons += 1
            left, right = array[j - 1], array[j]
            if left > right:
                snap(2, f"Is arr[{j - 1}] = {left} bigger than the key {right}? Yes, so the key must go further left.",
                     key=j, comparing=[j - 1, j], sorted_part=list(range(i + 1)))
                array[j - 1], array[j] = right, left
                ids[j - 1], ids[j] = ids[j], ids[j - 1]
                swaps += 1
                j -= 1
                snap(3, f"Swap them. The key {right} moves one step left, so j = {j}.",
                     key=j, swapping=[j, j + 1], sorted_part=list(range(i + 1)))
            else:
                snap(2, f"Is arr[{j - 1}] = {left} bigger than the key {right}? No, so the key stays here.",
                     key=j, comparing=[j - 1, j], sorted_part=list(range(i + 1)))
                break
        else:
            snap(2, f"The key {array[0]} reached the front (j = 0), so nothing is left to compare.",
                 key=0, sorted_part=list(range(i + 1)))

        # the key is now in its place; the sorted part is one bigger
        snap(1, f"The key {array[j]} is placed at index {j}. The sorted part is now indexes 0 to {i}.",
             key=-1, sorted_part=list(range(i + 1)))        # key=-1: the card is put down

    j = None
    snap(0, "Every number has been inserted, so the whole array is sorted!", sorted_part=list(range(n)),
         result={"type": "found",
                 "text": f"Sorted! {plural(comparisons, 'comparison')} and {plural(swaps, 'swap')}."})
    return steps