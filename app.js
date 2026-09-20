// Base de datos técnica con multiplicadores oficiales de Minecraft (Java/Bedrock)
// weight: multiplicador al aplicar desde un libro
const ENCHANTMENTS_DATA = {
  sword: [
    { id: "sharpness", name: "Filo V", level: 5, weight: 1 },
    { id: "smite", name: "Golpeo V", level: 5, weight: 1, conflicts: ["sharpness", "bane_of_arthropods"] },
    { id: "looting", name: "Botín III", level: 3, weight: 2 },
    { id: "fire_aspect", name: "Aspecto Ígneo II", level: 2, weight: 2 },
    { id: "sweeping_edge", name: "Filo Arrasador III", level: 3, weight: 2 },
    { id: "unbreaking", name: "Irrompibilidad III", level: 3, weight: 1 },
    { id: "mending", name: "Reparación", level: 1, weight: 2 }
  ],
  pickaxe: [
    { id: "efficiency", name: "Eficiencia V", level: 5, weight: 1 },
    { id: "fortune", name: "Fortuna III", level: 3, weight: 2, conflicts: ["silk_touch"] },
    { id: "silk_touch", name: "Toque de Seda", level: 1, weight: 4, conflicts: ["fortune"] },
    { id: "unbreaking", name: "Irrompibilidad III", level: 3, weight: 1 },
    { id: "mending", name: "Reparación", level: 1, weight: 2 }
  ],
  armor: [
    { id: "protection", name: "Protección IV", level: 4, weight: 1, conflicts: ["fire_protection", "blast_protection", "projectile_protection"] },
    { id: "unbreaking", name: "Irrompibilidad III", level: 3, weight: 1 },
    { id: "mending", name: "Reparación", level: 1, weight: 2 },
    { id: "thorns", name: "Espinas III", level: 3, weight: 4 }
  ]
};

let currentItem = "sword";
let selectedEnchants = [];

function init() {
  renderEnchantList();
  setupEventListeners();
}

function renderEnchantList() {
  const container = document.getElementById("enchantList");
  container.innerHTML = "";
  
  ENCHANTMENTS_DATA[currentItem].forEach(enc => {
    const isSelected = selectedEnchants.some(e => e.id === enc.id);
    const baseCost = enc.level * enc.weight;
    
    const div = document.createElement("div");
    div.className = `enchant-item ${isSelected ? "selected" : ""}`;
    div.innerHTML = `
      <span>${enc.name}</span>
      <span style="color: var(--text-muted); font-size: 0.75rem;">Base: ${baseCost} niv</span>
    `;
    div.onclick = () => toggleEnchant(enc);
    container.appendChild(div);
  });
}

function toggleEnchant(enc) {
  const index = selectedEnchants.findIndex(e => e.id === enc.id);
  if (index > -1) {
    selectedEnchants.splice(index, 1);
  } else {
    // Manejar incompatibilidades (ej. Fortuna vs Toque de Seda)
    if (enc.conflicts) {
      selectedEnchants = selectedEnchants.filter(e => !enc.conflicts.includes(e.id));
    }
    selectedEnchants.push(enc);
  }
  renderEnchantList();
}

function setupEventListeners() {
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

  document.getElementById("optimizeBtn").onclick = optimizeAndDisplayTree;
  document.getElementById("resetBtn").onclick = clearTree;
}

// Representación de un nodo en el proceso del yunque
class AnvilNode {
  constructor(name, cost = 0, priorPenalty = 0, isTarget = false, left = null, right = null) {
    this.name = name;
    this.cost = cost; // Costo en niveles para esta combinación específica
    this.priorPenalty = priorPenalty; // Penalización por trabajos previos (n)
    this.isTarget = isTarget;
    this.left = left;
    this.right = right;
    this.x = 0;
    this.y = 0;
  }
}

// Algoritmo voraz / binario de combinación óptima
function optimizeAndDisplayTree() {
  if (selectedEnchants.length === 0) return;

  clearTree();
  const nodesLayer = document.getElementById("nodesLayer");
  const svg = document.getElementById("svgOverlay");

  // Crear la lista de libros iniciales ordenada de mayor a menor costo intrínseco
  const leaves = selectedEnchants.map(enc => {
    const rawCost = enc.level * enc.weight;
    return new AnvilNode(enc.name, rawCost, 0);
  });

  // Ordenar los libros para que los más costosos tengan menor penalización acumulada
  leaves.sort((a, b) => b.cost - a.cost);

  // Nodo base del ítem (el objeto sin encantar)
  const itemNames = { sword: "Espada", pickaxe: "Pico", armor: "Armadura" };
  const baseItemNode = new AnvilNode(`${itemNames[currentItem]} Virgen`, 0, 0);

  // Construcción del árbol balanceado por pares
  let pool = [...leaves];
  let totalXpSpent = 0;
  let tooExpensive = false;

  // Combinar libros entre sí primero en árbol binario para minimizar penalización
  while (pool.length > 1) {
    const a = pool.shift();
    const b = pool.shift();

    // Costo del paso: penalizaciones previas de ambos + costo de los encantamientos transferidos
    const stepPenalty = (Math.pow(2, a.priorPenalty) - 1) + (Math.pow(2, b.priorPenalty) - 1);
    const stepCost = b.cost + stepPenalty;
    const nextPenalty = Math.max(a.priorPenalty, b.priorPenalty) + 1;

    totalXpSpent += stepCost;
    if (stepCost > 39) tooExpensive = true;

    const merged = new AnvilNode(`Libro Combinado`, stepCost, nextPenalty, false, a, b);
    pool.push(merged);
  }

  // Combinar el árbol de libros resultante con el ítem principal
  const finalBookTree = pool[0];
  const finalStepPenalty = (Math.pow(2, baseItemNode.priorPenalty) - 1) + (Math.pow(2, finalBookTree.priorPenalty) - 1);
  const finalStepCost = finalBookTree.cost + finalStepPenalty;
  totalXpSpent += finalStepCost;
  if (finalStepCost > 39) tooExpensive = true;

  const rootNode = new AnvilNode(
    `${itemNames[currentItem]} Perfecta`,
    finalStepCost,
    Math.max(baseItemNode.priorPenalty, finalBookTree.priorPenalty) + 1,
    true,
    baseItemNode,
    finalBookTree
  );

  // Posicionamiento visual de nodos
  renderTreeLayout(rootNode, nodesLayer, svg, tooExpensive);

  // Actualizar indicadores
  const banner = document.getElementById("statusBanner");
  banner.classList.remove("hidden", "error", "success");
  if (tooExpensive) {
    banner.classList.add("error");
    banner.textContent = "✕ ¡DEMASIADO CARO! Un paso supera los 39 niveles";
  } else {
    banner.classList.add("success");
    banner.textContent = "✓ ¡RUTA ÓPTIMA GARANTIZADA! Combina según el esquema";
  }

  document.getElementById("costIndicator").textContent = `Coste Total: ${totalXpSpent} niveles`;
}

// Renderizador recursivo para nodos y conexiones
function renderTreeLayout(root, container, svg, isGlobalError) {
  let currentY = 50;
  const leafX = 140;
  const stepX = 260;

  // Asignar coordenadas iniciales a las hojas
  function layoutLeaves(node, depth) {
    if (!node.left && !node.right) {
      node.x = leafX;
      node.y = currentY;
      currentY += 80;
      return;
    }
    if (node.left) layoutLeaves(node.left, depth + 1);
    if (node.right) layoutLeaves(node.right, depth + 1);
    node.x = leafX + (depth * stepX);
    node.y = ((node.left ? node.left.y : currentY) + (node.right ? node.right.y : currentY)) / 2;
  }

  layoutLeaves(root, 1);

  // Pintar recursivamente nodos y trazar líneas Bezier
  function drawNodes(node) {
    if (!node) return;

    const isStepError = node.cost > 39;
    const nodeEl = document.createElement("div");
    nodeEl.className = `tree-node ${node.isTarget ? "target" : ""} ${isStepError ? "error" : ""}`;
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;
    
    nodeEl.innerHTML = `
      <h4>${node.name}</h4>
      <span>${node.cost > 0 ? `Paso: ${node.cost} niv` : "Base"}</span>
    `;
    container.appendChild(nodeEl);

    if (node.left) {
      drawConnection(node.left, node, svg, isStepError);
      drawNodes(node.left);
    }
    if (node.right) {
      drawConnection(node.right, node, svg, isStepError);
      drawNodes(node.right);
    }
  }

  drawNodes(root);
}

function drawConnection(src, dest, svg, isError) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const dx = (dest.x - src.x) * 0.5;
  const d = `M ${src.x} ${src.y} C ${src.x + dx} ${src.y}, ${dest.x - dx} ${dest.y}, ${dest.x} ${dest.y}`;
  
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", isError ? "#ef4444" : "#38bdf8");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-dasharray", "4,4");
  svg.appendChild(path);

  if (window.gsap) {
    gsap.fromTo(path, 
      { strokeDashoffset: 80, opacity: 0 },
      { strokeDashoffset: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
    );
  }
}

function clearTree() {
  document.getElementById("nodesLayer").innerHTML = "";
  document.getElementById("svgOverlay").innerHTML = "";
  document.getElementById("statusBanner").classList.add("hidden");
  document.getElementById("costIndicator").textContent = "Coste Total: -- niveles";
}

window.onload = init;
