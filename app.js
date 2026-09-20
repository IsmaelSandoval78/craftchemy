// Base de datos local de encantamientos (emulando PrismarineJS)
const ENCHANTMENTS_DATA = {
  sword: [
    { id: "sharpness", name: "Filo V", cost: 5 },
    { id: "unbreaking", name: "Irrompibilidad III", cost: 3 },
    { id: "looting", name: "Botín III", cost: 6 },
    { id: "mending", name: "Reparación", cost: 2 },
    { id: "fire_aspect", name: "Aspecto Ígneo II", cost: 4 }
  ],
  pickaxe: [
    { id: "efficiency", name: "Eficiencia V", cost: 5 },
    { id: "unbreaking", name: "Irrompibilidad III", cost: 3 },
    { id: "fortune", name: "Fortuna III", cost: 6 },
    { id: "mending", name: "Reparación", cost: 2 }
  ],
  armor: [
    { id: "protection", name: "Protección IV", cost: 4 },
    { id: "unbreaking", name: "Irrompibilidad III", cost: 3 },
    { id: "mending", name: "Reparación", cost: 2 }
  ]
};

let currentItem = "sword";
let selectedEnchants = [];

// Inicialización de la UI
function init() {
  renderEnchantList();
  setupEventListeners();
}

function renderEnchantList() {
  const container = document.getElementById("enchantList");
  container.innerHTML = "";
  
  ENCHANTMENTS_DATA[currentItem].forEach(enc => {
    const isSelected = selectedEnchants.some(e => e.id === enc.id);
    const div = document.createElement("div");
    div.className = `enchant-item ${isSelected ? "selected" : ""}`;
    div.innerHTML = `<span>${enc.name}</span><span>${enc.cost} niv</span>`;
    div.onclick = () => toggleEnchant(enc);
    container.appendChild(div);
  });
}

function toggleEnchant(enc) {
  const index = selectedEnchants.findIndex(e => e.id === enc.id);
  if (index > -1) {
    selectedEnchants.splice(index, 1);
  } else {
    selectedEnchants.push(enc);
  }
  renderEnchantList();
}

function setupEventListeners() {
  // Selector de categoría de objeto
  document.querySelectorAll(".item-btn").forEach(btn => {
    btn.onclick = (e) => {
      document.querySelectorAll(".item-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentItem = e.target.dataset.item;
      selectedEnchants = [];
      renderEnchantList();
      clearTree();
    };
  });

  document.getElementById("optimizeBtn").onclick = calculateAndRenderTree;
  document.getElementById("resetBtn").onclick = clearTree;
}

// Algoritmo binario óptimo de combinación
function calculateAndRenderTree() {
  if (selectedEnchants.length === 0) return;

  clearTree();
  const nodesLayer = document.getElementById("nodesLayer");
  const svg = document.getElementById("svgOverlay");

  // Ordenar de mayor a menor costo base
  const sorted = [...selectedEnchants].sort((a, b) => b.cost - a.cost);

  // Posiciones dinámicas (Árbol binario simple para demostración visual)
  const leftX = 160;
  const rightX = 520;
  const startY = 80;
  const gapY = 90;

  let totalCost = 0;
  const createdNodes = [];

  // Crear nodos fuente (izquierda)
  sorted.forEach((enc, i) => {
    const y = startY + (i * gapY);
    const node = createNodeElement(enc.name, `Costo: ${enc.cost} niv`, leftX, y);
    nodesLayer.appendChild(node);
    createdNodes.push({ el: node, x: leftX, y: y });
    totalCost += enc.cost;
  });

  // Nodo destino combinado (derecha)
  const targetY = startY + ((sorted.length - 1) * gapY) / 2;
  const isTooExpensive = totalCost > 39;
  
  const targetNode = createNodeElement(
    `${document.querySelector(`.item-btn[data-item="${currentItem}"]`).textContent.split(" ")[1]} Suprema`,
    `${totalCost} NIVELES`,
    rightX,
    targetY,
    isTooExpensive ? "error" : "target"
  );
  nodesLayer.appendChild(targetNode);

  // Trazar conexiones curvas SVG
  createdNodes.forEach(src => {
    const path = drawBezierCurve(src.x, src.y, rightX, targetY, isTooExpensive);
    svg.appendChild(path);

    // Animación fluida con GSAP
    gsap.fromTo(path, 
      { strokeDashoffset: 100 },
      { strokeDashoffset: 0, duration: 1.2, ease: "power2.out" }
    );
  });

  // Banner y alertas de estado
  const banner = document.getElementById("statusBanner");
  banner.classList.remove("hidden", "error", "success");
  if (isTooExpensive) {
    banner.classList.add("error");
    banner.textContent = "✕ ¡DEMASIADO CARO! (Límite superado: máx 39 niveles)";
    gsap.fromTo(targetNode, { x: "+=6" }, { x: "-=6", repeat: 5, yoyo: true, duration: 0.05 });
  } else {
    banner.classList.add("success");
    banner.textContent = "✓ ¡COMBINACIÓN EFICIENTE! Ahorro garantizado";
  }

  document.getElementById("costIndicator").textContent = `Coste Total: ${totalCost} niveles`;
}

function createNodeElement(title, subtitle, x, y, extraClass = "") {
  const div = document.createElement("div");
  div.className = `tree-node ${extraClass}`;
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  div.innerHTML = `<h4>${title}</h4><span>${subtitle}</span>`;
  return div;
}

function drawBezierCurve(x1, y1, x2, y2, isError) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const dx = (x2 - x1) * 0.5;
  const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", isError ? "#ef4444" : "#38bdf8");
  path.setAttribute("stroke-width", "2.5");
  path.setAttribute("stroke-dasharray", "6,6");
  return path;
}

function clearTree() {
  document.getElementById("nodesLayer").innerHTML = "";
  document.getElementById("svgOverlay").innerHTML = "";
  document.getElementById("statusBanner").classList.add("hidden");
  document.getElementById("costIndicator").textContent = "Coste Total: -- niveles";
}

// Arrancar al cargar el DOM
window.addEventListener("DOMContentLoaded", init);
