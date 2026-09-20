// Base de datos completa con multiplicadores oficiales de Minecraft (Java / Bedrock)
const ENCHANTMENTS_DATA = {
  sword: [
    { id: "sharpness", name: "Filo V", level: 5, weight: 1, conflicts: ["smite", "bane_of_arthropods"] },
    { id: "smite", name: "Golpeo V", level: 5, weight: 1, conflicts: ["sharpness", "bane_of_arthropods"] },
    { id: "bane_of_arthropods", name: "Perdición de los Artrópodos V", level: 5, weight: 1, conflicts: ["sharpness", "smite"] },
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
  boots: [
    { id: "protection", name: "Protección IV", level: 4, weight: 1, conflicts: ["fire_protection", "blast_protection", "projectile_protection"] },
    { id: "feather_falling", name: "Caída de Pluma IV", level: 4, weight: 1 },
    { id: "depth_strider", name: "Agilidad Acuática III", level: 3, weight: 2, conflicts: ["frost_walker"] },
    { id: "frost_walker", name: "Paso Helado II", level: 2, weight: 2, conflicts: ["depth_strider"] },
    { id: "soul_speed", name: "Velocidad de Almas III", level: 3, weight: 4 },
    { id: "unbreaking", name: "Irrompibilidad III", level: 3, weight: 1 },
    { id: "mending", name: "Reparación", level: 1, weight: 2 },
    { id: "thorns", name: "Espinas III", level: 3, weight: 4 }
  ],
  helmet: [
    { id: "protection", name: "Protección IV", level: 4, weight: 1, conflicts: ["fire_protection", "blast_protection", "projectile_protection"] },
    { id: "respiration", name: "Respiración III", level: 3, weight: 2 },
    { id: "aqua_affinity", name: "Afinidad Acuática", level: 1, weight: 2 },
    { id: "unbreaking", name: "Irrompibilidad III", level: 3, weight: 1 },
    { id: "mending", name: "Reparación", level: 1, weight: 2 },
    { id: "thorns", name: "Espinas III", level: 3, weight: 4 }
  ],
  chestplate: [
    { id: "protection", name: "Protección IV", level: 4, weight: 1, conflicts: ["fire_protection", "blast_protection", "projectile_protection"] },
    { id: "unbreaking", name: "Irrompibilidad III", level: 3, weight: 1 },
    { id: "mending", name: "Reparación", level: 1, weight: 2 },
    { id: "thorns", name: "Espinas III", level: 3, weight: 4 }
  ],
  bow: [
    { id: "power", name: "Poder V", level: 5, weight: 1 },
    { id: "flame", name: "Fuego", level: 1, weight: 2 },
    { id: "punch", name: "Retroceso II", level: 2, weight: 2 },
    { id: "infinity", name: "Infinidad", level: 1, weight: 4, conflicts: ["mending"] },
    { id: "unbreaking", name: "Irrompibilidad III", level: 3, weight: 1 },
    { id: "mending", name: "Reparación", level: 1, weight: 2, conflicts: ["infinity"] }
  ],
  crossbow: [
    { id: "quick_charge", name: "Carga Rápida III", level: 3, weight: 1 },
    { id: "multishot", name: "Multidisparo", level: 1, weight: 2, conflicts: ["piercing"] },
    { id: "piercing", name: "Perforación IV", level: 4, weight: 1, conflicts: ["multishot"] },
    { id: "unbreaking", name: "Irrompibilidad III", level: 3, weight: 1 },
    { id: "mending", name: "Reparación", level: 1, weight: 2 }
  ],
  trident: [
    { id: "impaling", name: "Empalamiento V", level: 5, weight: 1 },
    { id: "loyalty", name: "Lealtad III", level: 3, weight: 1, conflicts: ["riptide"] },
    { id: "channeling", name: "Conductividad", level: 1, weight: 4, conflicts: ["riptide"] },
    { id: "riptide", name: "Propulsión Acuática III", level: 3, weight: 2, conflicts: ["loyalty", "channeling"] },
    { id: "unbreaking", name: "Irrompibilidad III", level: 3, weight: 1 },
    { id: "mending", name: "Reparación", level: 1, weight: 2 }
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
    const div = document.createElement("div");
    div.className = `enchant-item ${isSelected ? "selected" : ""}`;
    div.innerHTML = `
      <span>${enc.name}</span>
      <span style="color: var(--text-muted); font-size: 0.7rem;">${enc.level * enc.weight} niv</span>
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
      const button = e.currentTarget;
      document.querySelectorAll(".item-btn").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      currentItem = button.dataset.item;
      selectedEnchants = [];
      renderEnchantList();
      clearTree();
    };
  });

  document.getElementById("optimizeBtn").onclick = optimizeAndDisplayTree;
  document.getElementById("resetBtn").onclick = clearTree;
}

class AnvilNode {
  constructor(name, cost = 0, priorPenalty = 0, isTarget = false, isBook = true, left = null, right = null) {
    this.name = name;
    this.cost = cost;
    this.priorPenalty = priorPenalty;
    this.isTarget = isTarget;
    this.isBook = isBook;
    this.left = left;
    this.right = right;
    this.x = 0;
    this.y = 0;
  }
}

function optimizeAndDisplayTree() {
  if (selectedEnchants.length === 0) return;

  clearTree();
  const nodesLayer = document.getElementById("nodesLayer");
  const svg = document.getElementById("svgOverlay");

  const leaves = selectedEnchants.map(enc => {
    const rawCost = enc.level * enc.weight;
    return new AnvilNode(enc.name, rawCost, 0, false, true);
  });

  // Ordenar de mayor a menor costo intrínseco
  leaves.sort((a, b) => b.cost - a.cost);

  const itemNames = {
    sword: "Espada", pickaxe: "Pico", boots: "Botas", helmet: "Casco",
    chestplate: "Pechera", bow: "Arco", crossbow: "Ballesta", trident: "Tridente"
  };
  const baseItemNode = new AnvilNode(`${itemNames[currentItem]} Base`, 0, 0, false, false);

  let pool = [...leaves];
  let totalXpSpent = 0;
  let tooExpensive = false;
  const textSteps = [];

  // Combinación en árbol binario para los libros
  while (pool.length > 1) {
    const a = pool.shift();
    const b = pool.shift();

    const stepPenalty = (Math.pow(2, a.priorPenalty) - 1) + (Math.pow(2, b.priorPenalty) - 1);
    const stepCost = b.cost + stepPenalty;
    const nextPenalty = Math.max(a.priorPenalty, b.priorPenalty) + 1;

    totalXpSpent += stepCost;
    if (stepCost > 39) tooExpensive = true;

    textSteps.push({
      left: a.name,
      right: b.name,
      cost: stepCost,
      result: `Libro (${a.name.split(" ")[0]} + ${b.name.split(" ")[0]})`
    });

    const merged = new AnvilNode(
      `Libro (${a.name.split(" ")[0]} + ${b.name.split(" ")[0]})`,
      stepCost,
      nextPenalty,
      false,
      true,
      a,
      b
    );
    pool.push(merged);
  }

  // Combinar el árbol de libros con el ítem
  const finalBookTree = pool[0];
  const finalStepPenalty = (Math.pow(2, baseItemNode.priorPenalty) - 1) + (Math.pow(2, finalBookTree.priorPenalty) - 1);
  const finalStepCost = finalBookTree.cost + finalStepPenalty;
  totalXpSpent += finalStepCost;
  if (finalStepCost > 39) tooExpensive = true;

  textSteps.push({
    left: baseItemNode.name,
    right: finalBookTree.name,
    cost: finalStepCost,
    result: `${itemNames[currentItem]} Suprema`
  });

  const rootNode = new AnvilNode(
    `${itemNames[currentItem]} Suprema`,
    finalStepCost,
    Math.max(baseItemNode.priorPenalty, finalBookTree.priorPenalty) + 1,
    true,
    false,
    baseItemNode,
    finalBookTree
  );

  renderTreeLayout(rootNode, nodesLayer, svg);
  renderStepByStep(textSteps);

  const banner = document.getElementById("statusBanner");
  banner.classList.remove("hidden", "error", "success");
  if (tooExpensive) {
    banner.classList.add("error");
    banner.textContent = "✕ ¡DEMASIADO CARO! Un paso supera los 39 niveles";
  } else {
    banner.classList.add("success");
    banner.textContent = "✓ ¡RUTA ÓPTIMA! Combinación validada sin penalización excesiva";
  }

  document.getElementById("costIndicator").textContent = `Coste Total: ${totalXpSpent} niveles`;
}

function renderTreeLayout(root, container, svg) {
  let currentY = 40;
  const leafX = 130;
  const stepX = 240;

  function layoutLeaves(node, depth) {
    if (!node.left && !node.right) {
      node.x = leafX;
      node.y = currentY;
      currentY += 75;
      return;
    }
    if (node.left) layoutLeaves(node.left, depth + 1);
    if (node.right) layoutLeaves(node.right, depth + 1);
    node.x = leafX + (depth * stepX);
    node.y = ((node.left ? node.left.y : currentY) + (node.right ? node.right.y : currentY)) / 2;
  }

  layoutLeaves(root, 1);

  // Ajustar altura del contenedor SVG si el árbol es alto
  document.getElementById("treeContainer").style.minHeight = `${Math.max(currentY + 20, 420)}px`;

  function drawNodes(node) {
    if (!node) return;

    const isStepError = node.cost > 39;
    const nodeEl = document.createElement("div");
    nodeEl.className = `tree-node ${node.isTarget ? "target" : ""} ${isStepError ? "error" : ""} ${node.isBook ? "enchanted" : ""}`;
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;
    
    nodeEl.innerHTML = `
      <h4>${node.name}</h4>
      <span>${node.cost > 0 ? `Coste: ${node.cost} niv` : "Base"}</span>
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
  path.setAttribute("stroke", isError ? "#f87171" : "#38bdf8");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-dasharray", "4,4");
  svg.appendChild(path);

  if (window.gsap) {
    gsap.fromTo(path, 
      { strokeDashoffset: 60, opacity: 0 },
      { strokeDashoffset: 0, opacity: 1, duration: 0.7, ease: "power2.out" }
    );
  }
}

// Pintar la guía paso a paso textual
function renderStepByStep(steps) {
  const recipeBox = document.getElementById("recipeBox");
  const list = document.getElementById("recipeSteps");
  list.innerHTML = "";

  steps.forEach((s, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `Paso ${idx + 1}: Coloca <strong>${s.left}</strong> a la izquierda y <strong>${s.right}</strong> a la derecha ➔ Gasto: <span>${s.cost} niveles</span>`;
    list.appendChild(li);
  });

  recipeBox.classList.remove("hidden");
}

function clearTree() {
  document.getElementById("nodesLayer").innerHTML = "";
  document.getElementById("svgOverlay").innerHTML = "";
  document.getElementById("statusBanner").classList.add("hidden");
  document.getElementById("recipeBox").classList.add("hidden");
  document.getElementById("costIndicator").textContent = "Coste Total: -- niveles";
}

window.onload = init;
