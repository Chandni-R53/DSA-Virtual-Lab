"""
dsa_engine/arrays_strings/arrays.py  –  ARRAYS (the basic operations)

An array is a row of cells side by side in memory. This file shows what happens inside
the array for five operations: access, update, append, insert and delete.
Drawn by js/renderers/memory.js.

Step fields:
    data      the cells right now. None = an empty cell (a gap)
    ids       ids[position] = which number sits there (None for a gap). Lets numbers slide.
    active    positions being looked at (lime ring)
    moving    [from, to] a number that just moved to a new cell (amber)
    written   position that just received a value (solid lime), or -1
    ghost     {"pos": p, "v": value} a number that was just removed (shown faded), or None
    formula   text for the address banner, or None
    pointers  {position: "label"} small labels under the cells
    base, size   where the array starts in memory, and how many bytes each cell takes
    line, message, vars, result   as usual.   result type "found" = success.
"""
import random

from dsa_engine.common import clean_list, is_int, plural, MAX_VALUE

MAX_LENGTH = 20
BASE = 1000          # pretend memory address where the array starts
SIZE = 4             # bytes per number

NEEDS_INDEX = ["access", "update", "insert", "delete"]
NEEDS_VALUE = ["update", "insert", "append"]
OPS = ["access", "update", "insert", "append", "delete"]


def _addr(i):
    return BASE + i * SIZE


def _cx_case(name, big, count, unit, n, tone, note, approx=False):
    return {"name": name, "big": big, "checks": ("≈ " if approx else "") + plural(count, unit),
            "fraction": min(1, count / max(n, 1)), "tone": tone, "note": note}


def complexity(values):
    n = len(values["array"])
    op = values["operation"]
    if op in ("access", "update", "append"):
        note = {"access": "The computer jumps straight to the cell. It never looks at the others.",
                "update": "Jump straight to the cell and overwrite it.",
                "append": "The new number always goes right after the last one. Nothing has to move."}[op]
        cases = [_cx_case(nm, "O(1)", 1, "step", n, "low", note) for nm in ("Best", "Average", "Worst")]
        summary = "It costs the same for 5 numbers or 5 million. That constant cost is what {big} means."
        big = "O(1)"
    else:
        last = n if op == "insert" else n - 1          # most numbers that can ever have to move
        avg = (last + 1) // 2
        where = "at the end" if op == "insert" else "the last number"
        front = "at the very front" if op == "insert" else "the first number"
        cases = [
            _cx_case("Best", "O(1)", 0, "shift", n, "low", f"{op.capitalize()} {where}: nothing has to move."),
            _cx_case("Average", "O(n)", avg, "shift", n, "mid", "Somewhere in the middle: about half the numbers move.", approx=True),
            _cx_case("Worst", "O(n)", last, "shift", n, "high", f"{op.capitalize()} {front}: every other number has to move."),
        ]
        summary = "Every number after the index has to shuffle over, so the work grows with the array. That is {big}."
        big = "O(n)"
    return {
        "time": {"intro": "How many steps it needs. Shown for your array of {n} numbers.", "n": n,
                 "cases": cases, "summary": summary, "summary_big": big},
        "space": {"big": "O(1)",
                  "text": "It works inside the same array and only needs a counter {i}. (Growing a real array may need a bigger block of memory.)"},
    }


META = {
    "id": "arrays",
    "title": "Arrays",
    "category": "Arrays & Strings",
    "renderer": "memory",
    "description": "An array keeps numbers in neighbouring memory cells. Watch what really happens when you read, change, add or remove one.",
    "legend": [
        {"cls": "", "label": "A number in its cell"},
        {"cls": "cur", "label": "Being looked at"},
        {"cls": "swp", "label": "Moving"},
        {"cls": "fnd", "label": "Just written"},
        {"cls": "emp", "label": "Empty cell"},
    ],
    "inputs": [
        {"id": "operation", "label": "Operation", "type": "choice",
         "options": [{"v": "access", "label": "Access"}, {"v": "update", "label": "Update"},
                     {"v": "insert", "label": "Insert"}, {"v": "append", "label": "Append"},
                     {"v": "delete", "label": "Delete"}]},
        {"id": "array", "label": "Enter your array", "type": "list", "max_length": MAX_LENGTH,
         "placeholder": "Type numbers separated by commas, e.g. 10, 20, 30, 40, 50",
         "hint": f"Up to {MAX_LENGTH} numbers."},
        {"id": "index", "label": "Index", "type": "number", "optional": True,
         "needed_for": {"operation": NEEDS_INDEX}, "placeholder": "e.g. 2"},
        {"id": "value", "label": "Value", "type": "number", "optional": True,
         "needed_for": {"operation": NEEDS_VALUE}, "placeholder": "e.g. 25"},
    ],
    "defaults": {"operation": "insert", "array": [10, 20, 30, 40, 50], "index": 2, "value": 25},
    "pseudocode": [
        {"t": "access(i): return arr[i]", "indent": 0},
        {"t": "update(i, v): arr[i] = v", "indent": 0},
        {"t": "append(v): arr[n] = v", "indent": 0},
        {"t": "insert(i, v):", "indent": 0},
        {"t": "for j = n-1 down to i:", "indent": 1},
        {"t": "arr[j+1] = arr[j]", "indent": 2},
        {"t": "arr[i] = v", "indent": 1},
        {"t": "delete(i):", "indent": 0},
        {"t": "for j = i+1 to n-1:", "indent": 1},
        {"t": "arr[j-1] = arr[j]", "indent": 2},
        {"t": "n = n - 1", "indent": 1},
    ],
}
META["complexity"] = complexity(META["defaults"])


def validate(data):
    """Check the input from the website. Raise ValueError with a friendly message if it is bad."""
    if not isinstance(data, dict):
        raise ValueError("The input could not be read.")
    op = data.get("operation")
    if op not in OPS:
        raise ValueError("Please choose an operation: access, update, insert, append or delete.")
    array = clean_list(data.get("array"), MAX_LENGTH)
    n = len(array)

    index = None
    if op in NEEDS_INDEX:
        index = data.get("index")
        if index is None:
            raise ValueError(f"Please enter an index for {op}.")
        if not is_int(index):
            raise ValueError("The index must be a whole number.")
        high = n if op == "insert" else n - 1
        if not 0 <= index <= high:
            valid = f"between 0 and {high}" if high > 0 else "0"
            raise ValueError(f"The index must be {valid} for an array of {plural(n, 'number')}"
                             + (" (an insert can also go at index " + str(n) + ", the end)." if op == "insert" else "."))
    value = None
    if op in NEEDS_VALUE:
        value = data.get("value")
        if value is None:
            raise ValueError(f"Please enter a value to {op}.")
        if not is_int(value):
            raise ValueError("The value must be a whole number.")
        if abs(value) > MAX_VALUE:
            raise ValueError(f"Please keep the value between -{MAX_VALUE} and {MAX_VALUE}.")
    if op in ("insert", "append") and n >= MAX_LENGTH:
        raise ValueError(f"The array is full ({MAX_LENGTH} numbers). Delete one first, or use fewer numbers.")
    return {"operation": op, "array": array, "index": index, "value": value}


def random_input():
    n = random.randint(5, 9)
    op = random.choice(OPS)
    high = n if op == "insert" else n - 1
    return {"operation": op, "array": random.sample(range(-20, 100), n),
            "index": random.randint(0, high), "value": random.randint(-20, 99)}


def run(values):
    op, index, value = values["operation"], values["index"], values["value"]
    data = list(values["array"])             # the live cells (None = a gap)
    n = len(data)
    ids = list(range(n))
    next_id = n
    steps = []
    shifts = 0

    def snap(line, message, active=(), moving=(), written=-1, ghost=None, formula=None, pointers=None, result=None):
        steps.append({
            "data": list(data), "ids": list(ids), "active": list(active), "moving": list(moving),
            "written": written, "ghost": ghost, "formula": formula, "pointers": dict(pointers or {}),
            "base": BASE, "size": SIZE, "line": line, "message": message,
            "vars": [
                {"k": "operation =", "v": op, "hl": False},
                {"k": "length =", "v": len(data), "hl": False},
                {"k": "index =", "v": "–" if index is None else index, "hl": index is not None},
                {"k": "value =", "v": "–" if value is None else value, "hl": False},
                {"k": "shifts =", "v": shifts, "hl": shifts > 0},
            ],
            "result": result,
        })

    def formula(i):
        return f"arr[{i}] is at address {BASE} + {i} × {SIZE} = {_addr(i)}"

    intro = (f"The array has {plural(n, 'number')} in neighbouring cells. It starts at address {BASE} "
             f"and each cell takes {SIZE} bytes.")

    if op == "access":
        snap(0, intro)
        snap(0, f"To read arr[{index}] the computer does not search. It calculates the address and jumps there: "
                f"{BASE} + {index} × {SIZE} = {_addr(index)}.", active=[index], formula=formula(index),
             pointers={index: "index " + str(index)})
        snap(0, f"The cell at address {_addr(index)} holds {data[index]}.", active=[index], formula=formula(index),
             pointers={index: "index " + str(index)},
             result={"type": "found", "text": f"arr[{index}] = {data[index]}. One step, however long the array is."})

    elif op == "update":
        old = data[index]
        snap(1, intro)
        snap(1, f"Jump straight to arr[{index}]: {BASE} + {index} × {SIZE} = {_addr(index)}. It currently holds {old}.",
             active=[index], formula=formula(index), pointers={index: "index " + str(index)})
        data[index] = value
        snap(1, f"Overwrite {old} with {value}. Nothing else in the array changes.", written=index,
             formula=formula(index), pointers={index: "index " + str(index)},
             result={"type": "found", "text": f"arr[{index}] changed from {old} to {value}. One step."})

    elif op == "append":
        snap(2, intro)
        data.append(None)
        ids.append(None)
        snap(2, f"The next free cell is index {n}, right after the last number (address {_addr(n)}).",
             active=[n], formula=formula(n), pointers={n: "index " + str(n)})
        data[n], ids[n] = value, next_id
        snap(2, f"Write {value} into that cell. Nothing had to move.", written=n, formula=formula(n),
             pointers={n: "index " + str(n)},
             result={"type": "found", "text": f"Appended {value}. One step, nothing shifted."})

    elif op == "insert":
        snap(3, intro + f" To insert {value} at index {index}, the numbers from index {index} onward must move one cell right.")
        data.append(None)
        ids.append(None)
        end_note = " It is the end, so nothing has to move." if index == n else ""
        snap(3, f"First make room: add one empty cell at the end (index {n}).{end_note}", active=[n],
             formula=formula(n), pointers={n: "new cell"})
        for j in range(n - 1, index - 1, -1):
            moved = data[j]
            data[j + 1], ids[j + 1] = data[j], ids[j]
            data[j], ids[j] = None, None
            shifts += 1
            snap(5, f"Move {moved} from index {j} one cell right, into index {j + 1}. The gap moves left.",
                 moving=[j, j + 1], pointers={j: "gap"})
        data[index], ids[index] = value, next_id
        shifts_text = "Nothing needed to move" if shifts == 0 else plural(shifts, "number") + " moved"
        snap(6, f"The gap is at index {index}. Put {value} there.", written=index, pointers={index: "index " + str(index)},
             result={"type": "found", "text": f"Inserted {value} at index {index}. {shifts_text}."})

    else:  # delete
        old = data[index]
        snap(7, intro + f" To delete arr[{index}], the numbers after it must move one cell left to close the gap.")
        data[index], ids[index] = None, None
        snap(7, f"Remove {old} from index {index}. That leaves a gap.", ghost={"pos": index, "v": old},
             pointers={index: "gap"})
        for j in range(index + 1, n):
            moved = data[j]
            data[j - 1], ids[j - 1] = data[j], ids[j]
            data[j], ids[j] = None, None
            shifts += 1
            snap(9, f"Move {moved} from index {j} one cell left, into index {j - 1}. The gap moves right.",
                 moving=[j, j - 1], pointers={j: "gap"})
        data.pop()
        ids.pop()
        now = "The array is now empty." if not data else f"The array now has {plural(len(data), 'number')}."
        shifts_text = "Nothing needed to move" if shifts == 0 else plural(shifts, "number") + " moved"
        snap(10, f"The last cell is empty, so it is no longer part of the array. {now}",
             result={"type": "found", "text": f"Deleted {old} from index {index}. {shifts_text}."})
    return steps