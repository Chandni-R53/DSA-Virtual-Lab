def binary_search(arr, target):
    """Yields a snapshot dict after every comparison."""
    arr = sorted(arr)  # binary search needs a sorted array
    low, high = 0, len(arr) - 1
    steps = []

    while low <= high:
        mid = (low + high) // 2
        steps.append({
            "array": arr,
            "low": low,
            "high": high,
            "mid": mid,
            "found": arr[mid] == target
        })
        if arr[mid] == target:
            break
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    return steps


if __name__ == "__main__":
    result = binary_search([5, 2, 9, 1, 7, 3], target=7)
    for s in result:
        print(s)