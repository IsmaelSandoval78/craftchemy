// --- Datos de Progresión y Primeras Horas ---
const PROGRESSION_DATA = {
  wood: {
    title: "Fase 1: El Despertar con un Tronco de Roble",
    badge: "Minuto 0 - 2",
    tip: "Regla de Oro: Solo fabrica un pico de madera. No desperdicies madera en espadas, hachas o palas de madera.",
    breakdown: "Para esta fase necesitas talar: <strong>3 troncos de roble</strong> (generan 12 tablones).",
    steps: [
      { step: "Paso 1", title: "Procesar Madera", desc: "Pon los troncos en la cuadrícula de fabricación para conseguir 12 tablones de roble." },
      { step: "Paso 2", title: "Mesa de Trabajo", desc: "Usa 4 tablones para craftear tu Mesa de Trabajo y colócala en el suelo." },
      { step: "Paso 3", title: "Palos y Pico de Madera", desc: "Haz 4 palos (2 tablones) y fabrica EXCLUSIVAMENTE 1 Pico de Madera (3 tablones + 2 palos)." }
    ]
  },
  stone: {
    title: "Fase 2: La Era de Piedra Inmediata",
    badge: "Minuto 3 - 5",
    tip: "Pica 3 bloques de piedra con tu pico de madera, fabrica el pico de piedra y tira o guarda el de madera.",
    breakdown: "Objetivo de extracción: <strong>14 a 20 bloques de adoquín (Cobblestone)</strong>.",
    steps: [
      { step: "Paso 1", title: "Primeros 3 Adoquines", desc: "Cava hacia abajo o entra a una colina. Pica solo 3 piedras y fabrica tu Pico de Piedra inmediatamente." },
      { step: "Paso 2", title: "Armamento de Piedra", desc: "Extrae 11 bloques más: fabrica 1 Espada de Piedra (defensa), 1 Hacha de Piedra (talar rápido) y 1 Horno." },
      { step: "Paso 3", title: "Aceleración de Tala", desc: "Usa tu nueva hacha de piedra para recolectar 15-20 troncos en menos de un minuto." }
    ]
  },
  night: {
    title: "Fase 3: Refugio, Carbón y Primera Noche",
    badge: "Minuto 6 - 9",
    tip: "Si no tienes carbón mineral, cocina troncos sin procesar dentro del horno usando tablones como combustible para obtener carbón vegetal.",
    breakdown: "Kit de noche: <strong>1 Cama (o refugio 3x3), 1 Horno activo, 4 Antorchas</strong>.",
    steps: [
      { step: "Paso 1", title: "Carbón Vegetal", desc: "Mete 4 troncos en la casilla superior del horno y tablones abajo. Obtendrás carbón vegetal para antorchas." },
      { step: "Paso 2", title: "Iluminación de Seguridad", desc: "Combina 1 carbón con 1 palo para crear 4 antorchas. Evita que aparezcan creepers a tu alrededor." },
      { step: "Paso 3", title: "Dormir o Cavar", desc: "Si conseguiste 3 de lana de oveja haz una cama. Si no, cava un túnel de 3x3 en la piedra y tapa la entrada hasta que amanezca." }
    ]
  },
  iron: {
    title: "Fase 4: La Fiebre del Hierro",
    badge: "Día 2",
    tip: "Nunca piques mineral de hierro con un pico de madera (se romperá sin soltar nada). Requiere pico de piedra o superior.",
    breakdown: "Meta mínima: <strong>24 lingotes de hierro</strong> (armadura completa + escudo + cubo de agua).",
    steps: [
      { step: "Paso 1", title: "El Escudo (Prioridad 1)", desc: "1 lingote de hierro + 6 tablones. Bloquea el 100% del daño de flechas de esqueletos y explosiones de creepers." },
      { step: "Paso 2", title: "El Cubo de Agua", desc: "3 lingotes de hierro. Te salva de caídas (water bucket clutch) y apaga lava en minas profundas." },
      { step: "Paso 3", title: "Pico y Armadura de Hierro", desc: "Reemplaza tus herramientas de piedra por hierro y equípate la pechera para resistir ataques en cuevas." }
    ]
  },
  diamond: {
    title: "Fase 5: Profundidades y Diamante",
    badge: "Juego Medio",
    tip: "Los diamantes aparecen con mayor frecuencia entre las capas Y: -53 e Y: -58. Requiere pico de hierro.",
    breakdown: "Primeros 5 diamantes: <strong>3 para el Pico de Diamante + 2 para la Mesa de Encantamientos</strong>.",
    steps: [
      { step: "Paso 1", title: "Descenso a Capas Negativas", desc: "Baja a cuevas profundas (Deepslate) entre Y: -50 y Y: -58 iluminando siempre tu espalda." },
      { step: "Paso 2", title: "Extracción Segura", desc: "Cava alrededor del diamante antes de picarlo para asegurarte de que no haya lava oculta debajo." },
      { step: "Paso 3", title: "Paso hacia Craftchemy Anvil", desc: "Con tus diamantes y obsidiana abres la puerta a la mesa de encantamientos y yunques." }
    ]
  }
};

// --- Control de Pestañas Globales ---
function setupTabNavigation() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.dataset.tab;
      document.getElementById(targetId).classList.add("active");
    };
  });

  // Eventos de la pestaña de progresión
  document.querySelectorAll(".milestone-btn").forEach(btn => {
    btn.onclick = (e) => {
      document.querySelectorAll(".milestone-btn").forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      renderProgressionStage(e.currentTarget.dataset.stage);
    };
  });
}

function renderProgressionStage(stageKey) {
  const stage = PROGRESSION_DATA[stageKey];
  document.getElementById("stageTitle").textContent = stage.title;
  document.getElementById("stageBadge").textContent = stage.badge;
  document.getElementById("survivalTip").innerHTML = `<strong>Consejo Pro:</strong> ${stage.tip}`;
  document.getElementById("resourceBreakdown").innerHTML = stage.breakdown;

  const container = document.getElementById("stageSteps");
  container.innerHTML = "";

  stage.steps.forEach(st => {
    const card = document.createElement("div");
    card.className = "prog-card";
    card.innerHTML = `
      <span class="card-step">${st.step}</span>
      <h3>${st.title}</h3>
      <p>${st.desc}</p>
    `;
    container.appendChild(card);
  });
}

// Mantener llamada en init
const originalInit = window.onload;
window.onload = () => {
  if (typeof init === "function") init();
  setupTabNavigation();
  renderProgressionStage("wood");
};
