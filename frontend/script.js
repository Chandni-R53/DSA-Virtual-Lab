async function runBinarySearch() {
  const response = await fetch("http://127.0.0.1:8000/run/binary-search");
  const steps = await response.json();

  const container = document.getElementById("array-container");

  for (const step of steps) {
    container.innerHTML = "";

    step.array.forEach((value, index) => {
      const box = document.createElement("div");
      box.classList.add("bar");
      box.textContent = value;

      if (index === step.mid) {
        box.classList.add("comparing");
      }
      if (index === step.low || index === step.high) {
        box.style.border = "2px solid black";
      }

      container.appendChild(box);
    });

    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec pause between steps
  }
}

document.getElementById("runBtn").addEventListener("click", runBinarySearch);