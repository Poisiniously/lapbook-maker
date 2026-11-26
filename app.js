(() => {
  "use strict";

  const STORAGE_KEY = "lapbook-maker-project-v1";
  const stage = document.getElementById("lapbook-stage");
  const stageElements = document.getElementById("stage-elements");
  const stageEmpty = document.getElementById("stage-empty");
  const inspector = document.getElementById("inspector-content");
  const projectTitle = document.getElementById("project-title");
  const saveState = document.getElementById("save-state");
  const elementCount = document.getElementById("element-count");
  const selectionLabel = document.getElementById("selection-label");
  const scaler = document.getElementById("canvas-scaler");
  const zoomLabel = document.getElementById("zoom-label");
  const paperColor = document.getElementById("paper-color");
  const toast = document.getElementById("toast");

  const MAX_PARTS = 12;

  const defaults = {
    title: "Mein Lapbook",
    paper: "#fffdf7",
    guides: true,
    elements: [],
    selectedId: null
  };

  const templates = {
    flap: { type: "flap", w: 190, h: 150, text: "Hier öffnen", secondary: "Deine geheime Info steht hier.", bg: "#e7dafa", color: "#63517e" },
    accordion: { type: "accordion", w: 255, h: 105, text: "Teil 1", secondary: "Teil 2|Teil 3", bg: "#e8def8", color: "#63517f" },
    booklet: { type: "booklet", w: 155, h: 180, text: "Mini-Buch", secondary: "Dein Wissen auf mehreren Seiten.", bg: "#d9cdf2", color: "#5f4b87" },
    pocket: { type: "pocket", w: 190, h: 150, text: "Wissens-Tasche", secondary: "Karte 1", bg: "#e6dafa", color: "#62517f" },
    wheel: { type: "wheel", w: 200, h: 200, text: "Drehen", secondary: "Thema 1|Thema 2|Thema 3|Thema 4", bg: "#e7dcf8", color: "#7055a4" },
    tab: { type: "tab", w: 125, h: 48, text: "KAPITEL 1", secondary: "", bg: "#d8ccf4", color: "#65518d" },
    note: { type: "note", w: 180, h: 120, text: "Schreibe hier deine Notiz.", secondary: "", bg: "#fff3cf", color: "#725a32" },
    circle: { type: "circle", w: 125, h: 125, text: "Kreis", secondary: "", bg: "#e9defa", color: "#594b72" },
    triangle: { type: "triangle", w: 145, h: 130, text: "Dreieck", secondary: "", bg: "#f5d9e5", color: "#87566f" },
    star: { type: "star", w: 140, h: 140, text: "Stern", secondary: "", bg: "#ffe7ae", color: "#8c6d35" },
    hexagon: { type: "hexagon", w: 160, h: 125, text: "Sechseck", secondary: "", bg: "#d5e9df", color: "#4f7560" },
    banner: { type: "banner", w: 270, h: 75, text: "Mein Thema", secondary: "", bg: "#f3cddd", color: "#87536e" },
    flower: { type: "flower", w: 220, h: 220, text: "Blütenmitte", secondary: "Blatt 1|Blatt 2|Blatt 3|Blatt 4|Blatt 5", bg: "#f4d7e5", color: "#80516b" },
    fan1: { type: "fan1", w: 250, h: 185, text: "Fächer", secondary: "Thema 1|Thema 2|Thema 3|Thema 4", bg: "#e8def8", color: "#62517f" },
    fan2: { type: "fan2", w: 250, h: 210, text: "Fächer 2", secondary: "Teil 1|Teil 2|Teil 3|Teil 4", bg: "#e8def8", color: "#62517f" },
    leporello: { type: "leporello", w: 200, h: 320, text: "Leporello", secondary: "Seite 1|Seite 2|Seite 3|Seite 4", bg: "#e5dafa", color: "#5f4b87" },
    foldcross: { type: "foldcross", w: 230, h: 230, text: "Mitte", secondary: "Oben|Rechts|Unten|Links", bg: "#e7dafa", color: "#63517e" },
    foldsheet: { type: "foldsheet", w: 180, h: 255, text: "Faltblatt", secondary: "Feld 1|Feld 2|Feld 3", bg: "#e9defa", color: "#5f4b87" },
    hexfold: { type: "hexfold", w: 200, h: 350, text: "Sechseck", secondary: "Innenseite", bg: "#d8e9df", color: "#4f7560" },
    flipflap: { type: "flipflap", w: 275, h: 215, text: "Flip-Flap", secondary: "Klappe 1\nText 1|Klappe 2\nText 2|Klappe 3\nText 3|Klappe 4\nText 4|Klappe 5\nText 5", bg: "#e7dafa", color: "#63517e" },
    foldheart: { type: "foldheart", w: 235, h: 220, text: "Faltherz", secondary: "Herz 1|Herz 2|Herz 3|Herz 4", bg: "#f4d7e5", color: "#80516b" }
  };

  const catalogTypes = new Set([
    "wheel", "flower", "pocket", "fan1", "fan2", "leporello", "foldcross",
    "foldsheet", "hexfold", "flipflap", "foldheart"
  ]);
  const multiPartCounts = {
    accordion: 2, wheel: 4, flower: 5, pocket: 1,
    fan1: 4, fan2: 4, leporello: 4, foldcross: 4, foldsheet: 3,
    hexfold: 2, flipflap: 5, foldheart: 4
  };
  const minPartCounts = { flower: 3, wheel: 2, pocket: 1, fan1: 2, fan2: 2, leporello: 2, foldcross: 2, foldsheet: 2, flipflap: 2, foldheart: 2 };

  let project = loadProject();
  let pocketView = null; // { id, index, returnFocus } while the card popup is open
  let zoom = 1;
  let drag = null;
  let toastTimer = null;

  // Old saved pocket4 elements become pocket elements; their cards are kept as parts.
  function migrateType(type) {
    return type === "pocket4" ? "pocket" : type;
  }

  function maxPartsFor(type) {
    return type === "pocket" ? 10 : MAX_PARTS;
  }

  function uid() {
    return "el-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  function normalizeElement(source, regenerateId) {
    const item = Object.assign({}, source, { type: migrateType(source.type) });
    const base = templates[item.type];
    const secondary = String(item.secondary == null ? base.secondary : item.secondary).slice(0, 500);
    const legacyParts = secondary.split("|").map(function (value) { return value.trim(); }).slice(0, maxPartsFor(item.type));
    let parts = null;

    if (multiPartCounts[item.type]) {
      const sourceParts = Array.isArray(item.parts) ? item.parts : legacyParts;
      parts = sourceParts.map(function (part) { return String(part).slice(0, 500); }).slice(0, maxPartsFor(item.type));
      if (!parts.length) parts = legacyParts.slice();
    }

    const centerSidesAuto = item.centerSidesAuto !== false;
    const requestedSides = Number(item.centerSides);
    const defaultSides = item.type === "flower" && parts && parts.length ? parts.length : 5;
    const centerSides = centerSidesAuto
      ? clamp(defaultSides, 3, MAX_PARTS)
      : clamp(Number.isFinite(requestedSides) && requestedSides ? requestedSides : defaultSides, 3, MAX_PARTS);
    const width = clamp(Number(item.w) || base.w, 45, 600);
    const height = clamp(Number(item.h) || base.h, 40, 500);

    return {
      id: regenerateId ? uid() : (typeof item.id === "string" && item.id ? item.id : uid()),
      type: item.type,
      x: clamp(Number(item.x) || 0, 0, 1000 - width),
      y: clamp(Number(item.y) || 0, 0, 700 - height),
      w: width,
      h: height,
      rotation: clamp(Number(item.rotation) || 0, -360, 360),
      text: String(item.text == null ? base.text : item.text).slice(0, 500),
      secondary: secondary,
      parts: parts,
      centerSides: centerSides,
      centerSidesAuto: centerSidesAuto,
      bg: /^#[0-9a-f]{6}$/i.test(item.bg) ? item.bg : base.bg,
      color: /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : base.color,
      open: Boolean(item.open),
      openPanels: Array.isArray(item.openPanels)
        ? item.openPanels.filter(function (index) { return Number.isInteger(index) && index >= 0 && index < MAX_PARTS; })
        : []
    };
  }

  function loadProject() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return structuredClone(defaults);
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.elements)) return structuredClone(defaults);

      const usedIds = new Set();
      const elements = parsed.elements
        .filter(function (item) { return item && Object.hasOwn(templates, migrateType(item.type)) && typeof item.id === "string" && item.id; })
        .map(function (item) {
          const normalized = normalizeElement(item, false);
          if (usedIds.has(normalized.id)) normalized.id = uid();
          usedIds.add(normalized.id);
          return normalized;
        });

      return {
        title: String(parsed.title || defaults.title).slice(0, 60),
        paper: /^#[0-9a-f]{6}$/i.test(parsed.paper) ? parsed.paper : defaults.paper,
        guides: parsed.guides !== false,
        elements: elements,
        selectedId: null
      };
    } catch (error) {
      console.warn("Could not load saved lapbook:", error);
      return structuredClone(defaults);
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        title: project.title,
        paper: project.paper,
        guides: project.guides !== false,
        elements: project.elements
      }));
      saveState.innerHTML = '<span class="save-dot"></span> Lokal gespeichert';
    } catch (error) {
      saveState.innerHTML = '<span class="save-dot" style="background:#d59c52"></span> Speicher voll';
      console.warn("Could not save lapbook:", error);
      showToast("Speichern nicht möglich – exportiere dein Lapbook als Datei.");
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("visible"); }, 2300);
  }

  function getSelected() {
    return project.elements.find(function (item) { return item.id === project.selectedId; }) || null;
  }

  function selectElement(id) {
    project.selectedId = id;
    stageElements.querySelectorAll(".element").forEach(function (node) {
      node.classList.toggle("selected", node.dataset.id === id);
    });
    const selected = getSelected();
    selectionLabel.textContent = selected ? (templates[selected.type] ? typeName(selected.type) : "Element") : "Nichts ausgewählt";
    renderInspector();
  }

  function typeName(type) {
    const names = {
      flap: "Klappe", accordion: "Akkordeon", booklet: "Mini-Buch", pocket: "Tasche",
      wheel: "Drehscheibe", tab: "Reiter", note: "Notizkarte", circle: "Kreis",
      triangle: "Dreieck", star: "Stern", hexagon: "Sechseck", banner: "Banner",
      flower: "Blume", fan1: "Fächer 1", fan2: "Fächer 2",
      leporello: "Leporello", foldcross: "Faltkreuz", foldsheet: "Faltblatt", hexfold: "Falt-Sechseck",
      flipflap: "Flip-Flap", foldheart: "Faltherz"
    };
    return names[type] || "Element";
  }

  function makeLabel(text, className) {
    const label = document.createElement("div");
    label.className = className || "element-label";
    label.textContent = text;
    return label;
  }

  function makeToggle(item, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fold-toggle";
    button.dataset.action = "toggle";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.textContent = item.open ? "↶" : "↗";
    return button;
  }

  function getPanelTexts(item, fallbackCount) {
    const legacy = String(item.secondary || "").split("|").map(function (value) { return value.trim(); });
    const values = Array.isArray(item.parts) && item.parts.length ? item.parts.slice() : legacy;
    const count = Math.max(1, Math.min(12, values.length || fallbackCount));
    while (values.length < count) values.push("Feld " + (values.length + 1));
    return values.slice(0, count);
  }

  function getDefaultParts(item) {
    const count = multiPartCounts[item.type] || 0;
    const legacy = String(item.secondary || "").split("|").map(function (value) { return value.trim(); });
    while (legacy.length < count) legacy.push("Feld " + (legacy.length + 1));
    return legacy.slice(0, count);
  }

  function syncParts(item) {
    if (!Array.isArray(item.parts) || !item.parts.length) item.parts = getDefaultParts(item);
    item.parts = item.parts.slice(0, 12).map(function (part) { return String(part).slice(0, 500); });
    item.secondary = item.parts.join("|");
  }

  function polygonClipPath(sides) {
    const points = [];
    for (let index = 0; index < sides; index += 1) {
      const angle = (-90 + index * 360 / sides) * Math.PI / 180;
      const x = 50 + 49 * Math.cos(angle);
      const y = 50 + 49 * Math.sin(angle);
      points.push(x.toFixed(2) + "% " + y.toFixed(2) + "%");
    }
    return "polygon(" + points.join(",") + ")";
  }

  function renderPartFields(item) {
    const maxParts = maxPartsFor(item.type);
    const parts = getPanelTexts(item, multiPartCounts[item.type] || 2).slice(0, maxParts);
    const partNames = {
      accordion: "Akkordeon-Teil", wheel: "Segment", flower: "Blütenblatt",
      pocket: "Karte", fan1: "Fächerblatt", fan2: "Fächerteil",
      leporello: "Seite", foldcross: "Klappe", foldsheet: "Feld",
      hexfold: "Innenseite",
      flipflap: "Klappe", foldheart: "Herzblatt"
    };
    const partName = partNames[item.type] || "Teil";
    let html = '<div class="parts-editor"><div class="parts-editor-heading"><strong>Einzelne Felder</strong><span>' + parts.length + ' / ' + maxParts + '</span></div>';
    parts.forEach(function (part, index) {
      const label = partName + " " + (index + 1);
      html += '<div class="part-field-row"><label class="field"><span class="field-label">' + label + '</span><textarea data-part-index="' + index + '" aria-label="' + label + '" maxlength="500" rows="2">' + escapeHtml(part) + '</textarea></label>';
      html += '<button type="button" class="part-remove" data-part-remove="' + index + '" aria-label="' + label + ' entfernen" title="Teil entfernen"' + (parts.length <= (minPartCounts[item.type] || 1) ? ' disabled' : '') + '>−</button></div>';
    });
    html += '<button type="button" class="part-add" data-part-add' + (parts.length >= maxParts ? ' disabled' : '') + '>＋ Teil hinzufügen</button>';
    html += '<p class="field-help">Jeder Teil hat ein eigenes Textfeld. Du kannst bis zu ' + maxParts + ' Teile verwenden.</p>';
    if (item.type === "flipflap") html += '<p class="field-help">Erste Zeile = Vorderseite der Klappe. Weitere Zeilen = Text, der unter der Klappe steht.</p>';
    html += '</div>';
    return html;
  }

  function addConstructionGuide(parent, className) {
    const guide = document.createElement("span");
    guide.className = "construction-guide " + className;
    guide.setAttribute("aria-hidden", "true");
    parent.append(guide);
  }

  function makeTemplatePanel(item, index, className, text) {
    const panel = document.createElement("button");
    panel.type = "button";
    panel.className = "template-panel " + className;
    panel.dataset.action = "panel-toggle";
    panel.dataset.panelIndex = String(index);
    panel.textContent = text;
    panel.style.backgroundColor = item.bg;
    panel.style.color = item.color;
    panel.style.borderColor = item.color;
    panel.setAttribute("aria-pressed", String((item.openPanels || []).includes(index)));
    if ((item.openPanels || []).includes(index)) panel.classList.add("is-open");
    return panel;
  }

  function renderCatalogElement(item, node) {
    const layout = document.createElement("div");
    layout.className = "catalog-layout " + item.type + "-layout" + (item.open ? " is-open" : "");
    const fallbackCount = multiPartCounts[item.type] || 2;
    const labels = getPanelTexts(item, fallbackCount);
    const count = labels.length;
    const center = document.createElement("div");
    center.className = "template-center";
    center.textContent = item.text;
    center.style.color = item.color;

    if (item.type === "wheel") {
      const disc = document.createElement("div");
      const wheelColors = [item.bg, "#f5e7ef", "#e5f0e7", "#fff0ce", "#e5eafa", "#f4e5d8"];
      const anglePerPart = 360 / count;
      const gradientStops = labels.map(function (_label, index) {
        const start = (index * anglePerPart).toFixed(2);
        const end = ((index + 1) * anglePerPart).toFixed(2);
        return wheelColors[index % wheelColors.length] + " " + start + "deg " + end + "deg";
      });
      disc.className = "wheel-disc";
      disc.style.transform = "rotate(" + item.rotation + "deg)";
      disc.dataset.spin = String(item.rotation);
      disc.style.background = "conic-gradient(" + gradientStops.join(", ") + ")";
      labels.forEach(function (label, index) {
        const angle = (-90 + (index + 0.5) * anglePerPart) * Math.PI / 180;
        const sector = document.createElement("div");
        sector.className = "wheel-sector-label";
        sector.textContent = label;
        sector.style.left = (50 + 29 * Math.cos(angle)) + "%";
        sector.style.top = (50 + 29 * Math.sin(angle)) + "%";
        sector.style.width = Math.max(11, Math.min(42, 150 / count - 1)) + "%";
        sector.style.fontSize = Math.max(0.52, 0.76 - count * 0.02) + "em";
        sector.style.transform = "translate(-50%, -50%)";
        sector.style.color = item.color;
        disc.append(sector);
      });
      const hub = document.createElement("div");
      hub.className = "wheel-hub";
      hub.textContent = item.text;
      hub.style.color = item.color;
      disc.append(hub);
      // Static top disc with a 90° window: the rotating disc shows through it.
      const front = document.createElement("div");
      front.className = "wheel-front";
      front.style.backgroundColor = item.bg;
      // Polygon from the center around the circle, leaving out one segment-wide window at the top.
      const windowAngle = 360 / count;
      const frontPoints = ["50% 50%"];
      for (let deg = windowAngle; deg <= 360; deg += 3) {
        const rad = deg * Math.PI / 180;
        frontPoints.push((50 + 50 * Math.sin(rad)).toFixed(2) + "% " + (50 - 50 * Math.cos(rad)).toFixed(2) + "%");
      }
      front.style.clipPath = "polygon(" + frontPoints.join(", ") + ")";
      const pin = document.createElement("span");
      pin.className = "wheel-pin";
      layout.append(disc, front, pin, makeToggle(item, "Drehscheibe um 90 Grad drehen"));
      addConstructionGuide(layout, "guide-fold wheel-pivot");
      addConstructionGuide(layout, "guide-cut guide-circle");
    } else if (item.type === "flower") {
      // Petals sit on the edges of the center polygon; the polygon has the same number of sides.
      // The template is square, so % values in both directions match and the polygon stays regular.
      const sides = clamp(Number(item.centerSides) || count, 3, 12);
      const step = 360 / sides;
      const apothem = 20.6 * Math.cos(Math.PI / sides); // polygon radius is 49% of the 42% box
      const petalWidth = clamp(2 * apothem * Math.tan(Math.PI / sides) * 1.25, 16, 36);
      const petalHeight = 30;
      labels.forEach(function (label, index) {
        const petal = makeTemplatePanel(item, index, "flower-petal flower-petal-" + index, label);
        // Petals point at the middle of an edge, not at a corner.
        const angle = -90 + (index + 0.5) * 360 / count;
        const radians = angle * Math.PI / 180;
        // Distance from the center to the polygon edge in this direction.
        const offset = (((angle + 90) / step) % 1 - 0.5) * step * Math.PI / 180;
        const edgeDistance = apothem / Math.cos(offset);
        const distance = edgeDistance + petalHeight / 2 - 3; // overlap is hidden under the center
        petal.style.width = petalWidth + "%";
        petal.style.height = petalHeight + "%";
        petal.style.left = (50 + distance * Math.cos(radians) - petalWidth / 2) + "%";
        petal.style.top = (50 + distance * Math.sin(radians) - petalHeight / 2) + "%";
        petal.style.setProperty("--base-rotation", (angle + 90) + "deg");
        petal.style.transform = "rotate(" + (angle + 90) + "deg)";
        layout.append(petal);
      });
      center.classList.add("flower-center");
      center.style.left = "29%";
      center.style.top = "29%";
      center.style.width = "42%";
      center.style.height = "42%";
      center.style.backgroundColor = item.bg;
      center.style.borderColor = item.color;
      const centerPolygon = polygonClipPath(clamp(Number(item.centerSides) || count, 3, 12));
      // The clip-path cuts off borders, so the outline is a slightly larger shape behind the center.
      const outline = document.createElement("div");
      outline.className = "flower-center-outline";
      outline.style.position = "absolute";
      outline.style.left = "27%";
      outline.style.top = "27%";
      outline.style.width = "46%";
      outline.style.height = "46%";
      outline.style.backgroundColor = item.color;
      outline.style.clipPath = centerPolygon;
      layout.append(outline);
      center.style.clipPath = centerPolygon;
      layout.append(center);
      addConstructionGuide(layout, "guide-fold flower-fold flower-fold-a");
      addConstructionGuide(layout, "guide-fold flower-fold flower-fold-b");
      addConstructionGuide(layout, "guide-glue flower-glue");
    } else if (item.type === "pocket") {
      // The cards sit inside the pocket; only the top card peeks out. The popup shows all of them.
      for (let layer = Math.min(count - 1, 3); layer >= 1; layer -= 1) {
        const edge = document.createElement("span");
        edge.className = "pocket-stack-edge";
        edge.style.setProperty("--layer", String(layer));
        layout.append(edge);
      }
      const top = makeLabel(labels[0], "pocket-card");
      top.style.color = item.color;
      const front = makeLabel(item.text, "pocket-front");
      front.style.backgroundColor = item.bg;
      front.style.color = item.color;
      const tabs = ["pocket-tab-left", "pocket-tab-right"].map(function (name) {
        const tab = document.createElement("span");
        tab.className = "pocket-tab " + name;
        return tab;
      });
      const badge = document.createElement("span");
      badge.className = "pocket-count";
      badge.textContent = count + (count === 1 ? " Karte" : " Karten");
      layout.append(top, ...tabs, front, badge, makeToggle(item, "Tasche öffnen und Karten ansehen"));
      addConstructionGuide(layout, "guide-cut pocket-cut");
      addConstructionGuide(layout, "guide-fold pocket-fold");
      addConstructionGuide(layout, "guide-glue pocket-glue");
    } else if (item.type === "fan1") {
      labels.forEach(function (label, index) {
        const blade = makeTemplatePanel(item, index, "fan1-blade fan1-blade-" + index, label);
        const baseAngle = count === 1 ? 0 : -38 + index * 76 / (count - 1);
        const angle = baseAngle + ((item.openPanels || []).includes(index) ? (index < count / 2 ? -7 : 7) : 0);
        blade.style.setProperty("--fan-angle", angle + "deg");
        blade.style.transform = "rotate(" + angle + "deg)";
        blade.style.zIndex = String(index + 2);
        layout.append(blade);
      });
      const pivot = document.createElement("span");
      pivot.className = "fan-pivot";
      layout.append(pivot, makeToggle(item, "Fächer auffächern"));
      addConstructionGuide(layout, "guide-cut fan-cut");
      addConstructionGuide(layout, "guide-fold fan-pivot-line");
    } else if (item.type === "fan2") {
      const glue = document.createElement("span");
      glue.className = "fan2-glue";
      glue.textContent = "Kleben";
      layout.append(glue);
      labels.forEach(function (label, index) {
        const strip = makeTemplatePanel(item, index, "fan2-strip fan2-strip-" + index, label);
        strip.style.top = (index * (100 / count)) + "%";
        strip.style.height = (100 / count) + "%";
        strip.style.width = (83 * (1 - index * 0.42 / count)) + "%";
        strip.style.zIndex = String(index + 1);
        if ((item.openPanels || []).includes(index)) strip.classList.add("is-expanded");
        layout.append(strip);
      });
      addConstructionGuide(layout, "guide-fold fan2-fold");
      addConstructionGuide(layout, "guide-glue fan2-glue-guide");
    } else if (item.type === "leporello") {
      labels.forEach(function (label, index) {
        const panel = document.createElement("div");
        panel.className = "leporello-panel";
        panel.textContent = label;
        panel.style.backgroundColor = index % 2 ? "#f3e8f3" : item.bg;
        panel.style.color = item.color;
        layout.append(panel);
        if (index < count - 1) {
          const crease = document.createElement("span");
          crease.className = "construction-guide guide-fold leporello-crease";
          crease.style.top = ((index + 1) * 100 / count) + "%";
          layout.append(crease);
        }
      });
      layout.append(makeToggle(item, "Leporello auf- oder zusammenfalten"));
      addConstructionGuide(layout, "guide-cut leporello-cut");
    } else if (item.type === "foldcross") {
      // Square arms on a 3x3 grid: center and each arm take one third.
      const flapWidth = clamp(33.33 - (count - 4) * 2, 18, 33.33);
      const flapHeight = flapWidth;
      labels.forEach(function (label, index) {
        const flap = makeTemplatePanel(item, index, "cross-flap cross-flap-" + index, label);
        const angle = -90 + index * 360 / count;
        const radians = angle * Math.PI / 180;
        flap.style.width = flapWidth + "%";
        flap.style.height = flapHeight + "%";
        flap.style.left = (50 + flapWidth * Math.cos(radians) - flapWidth / 2) + "%";
        flap.style.top = (50 + flapWidth * Math.sin(radians) - flapHeight / 2) + "%";
        flap.style.setProperty("--base-rotation", (angle + 90) + "deg");
        flap.style.transform = "rotate(" + (angle + 90) + "deg)";
        layout.append(flap);
      });
      const middle = document.createElement("div");
      middle.className = "cross-center";
      middle.textContent = item.text;
      middle.style.backgroundColor = item.bg;
      middle.style.color = item.color;
      layout.append(middle);
      addConstructionGuide(layout, "guide-fold cross-fold-v");
      addConstructionGuide(layout, "guide-fold cross-fold-h");
    } else if (item.type === "foldsheet") {
      labels.forEach(function (label, index) {
        const panel = document.createElement("div");
        panel.className = "foldsheet-panel foldsheet-panel-" + index;
        panel.textContent = label;
        panel.style.top = (index * (100 / count)) + "%";
        panel.style.height = (100 / count) + "%";
        panel.style.backgroundColor = index % 2 ? "#f4eafa" : item.bg;
        panel.style.color = item.color;
        layout.append(panel);
        if (index < count - 1) {
          const crease = document.createElement("span");
          crease.className = "construction-guide guide-fold foldsheet-crease";
          crease.style.top = ((index + 1) * 100 / count) + "%";
          layout.append(crease);
        }
      });
      layout.append(makeToggle(item, "Faltblatt auf- oder zusammenfalten"));
      addConstructionGuide(layout, "guide-cut foldsheet-cut");
    } else if (item.type === "hexfold") {
      const lower = document.createElement("div");
      lower.className = "hexfold-part hexfold-lower";
      lower.style.backgroundColor = item.bg;
      lower.style.color = item.color;
      labels.forEach(function (label, index) {
        const part = document.createElement("span");
        part.className = "hexfold-inner-panel";
        part.textContent = label;
        part.style.flex = "1 1 " + (100 / count) + "%";
        lower.append(part);
      });
      const upper = document.createElement("div");
      upper.className = "hexfold-part hexfold-upper";
      // Front shows the title; the back, visible when folded, shows the inside label.
      const upperFront = document.createElement("span");
      upperFront.className = "hexfold-label-front";
      upperFront.textContent = item.text;
      const upperBack = document.createElement("span");
      upperBack.className = "hexfold-label-back";
      upperBack.textContent = labels[0] || "Innenseite";
      upper.append(upperFront, upperBack);
      upper.style.backgroundColor = item.bg;
      upper.style.color = item.color;
      layout.append(lower, upper, makeToggle(item, "Sechseck auf- oder zuklappen"));
      addConstructionGuide(layout, "guide-fold hexfold-crease");
      addConstructionGuide(layout, "guide-cut hexfold-cut");
    } else if (item.type === "flipflap") {
      const backing = document.createElement("div");
      backing.className = "flipflap-backing";
      backing.textContent = item.text;
      labels.forEach(function (label, index) {
        // First line = front of the flap, further lines = text underneath the flap.
        const lines = label.split("\n");
        const top = (index * (100 / count)) + "%";
        const height = (100 / count) + "%";
        const under = document.createElement("div");
        under.className = "flipflap-under";
        under.textContent = lines.slice(1).join("\n");
        under.style.top = top;
        under.style.height = height;
        under.style.color = item.color;
        layout.append(under);
        const panel = makeTemplatePanel(item, index, "flipflap-panel flipflap-panel-" + index, "");
        const face = document.createElement("span");
        face.className = "flip-face";
        face.textContent = lines[0];
        face.style.backgroundColor = item.bg;
        face.style.color = item.color;
        face.style.borderColor = item.color;
        const back = document.createElement("span");
        back.className = "flip-back";
        back.style.backgroundColor = item.bg;
        back.style.borderColor = item.color;
        panel.replaceChildren(face, back);
        panel.style.backgroundColor = "transparent";
        panel.style.borderColor = "transparent";
        panel.style.top = top;
        panel.style.height = height;
        layout.append(panel);
      });
      backing.style.backgroundColor = item.bg;
      backing.style.color = item.color;
      layout.append(backing);
      addConstructionGuide(layout, "guide-fold flipflap-crease");
      addConstructionGuide(layout, "guide-cut flipflap-cut");
      addConstructionGuide(layout, "guide-glue flipflap-glue");
    } else if (item.type === "foldheart") {
      // Each heart's tip sits in the center; the hearts radiate outward from it.
      const heartWidth = clamp(47 - (count - 4) * 2.8, 24, 47);
      const heartHeight = clamp(48 - (count - 4) * 2.7, 25, 48);
      labels.forEach(function (label, index) {
        const petal = makeTemplatePanel(item, index, "heart-petal heart-petal-" + index, label);
        petal.style.width = heartWidth + "%";
        petal.style.height = heartHeight + "%";
        petal.style.left = (50 - heartWidth / 2) + "%";
        petal.style.top = (50 - heartHeight) + "%";
        petal.style.setProperty("--base-rotation", (index * 360 / count) + "deg");
        layout.append(petal);
      });
      center.classList.add("heart-center");
      center.style.backgroundColor = item.bg;
      center.style.borderColor = item.color;
      layout.append(center);
      addConstructionGuide(layout, "guide-fold heart-fold heart-fold-a");
      addConstructionGuide(layout, "guide-fold heart-fold heart-fold-b");
    }

    if (["fan1", "fan2", "leporello", "foldsheet"].includes(item.type)) {
      const caption = document.createElement("div");
      caption.className = "template-caption";
      caption.textContent = item.text;
      caption.setAttribute("aria-hidden", "true");
      layout.append(caption);
    }

    node.append(layout);
  }

  function renderElement(item) {
    const node = document.createElement("div");
    node.className = "element type-" + item.type + (item.open ? " is-open" : "");
    node.dataset.id = item.id;
    node.style.left = (item.x / 10) + "%";
    node.style.top = (item.y / 7) + "%";
    node.style.width = (item.w / 10) + "%";
    // Flowers are always square: the height follows the width, also for older saved flowers.
    node.style.height = ((item.type === "flower" ? item.w : item.h) / 7) + "%";
    node.style.transform = item.type === "wheel" ? "rotate(0deg)" : "rotate(" + item.rotation + "deg)";
    node.style.zIndex = String(3 + project.elements.indexOf(item));
    node.style.color = item.color;

    if (catalogTypes.has(item.type) || ["flap", "booklet", "accordion"].includes(item.type)) {
      node.style.background = "transparent";
    } else {
      node.style.backgroundColor = item.bg;
    }

    if (catalogTypes.has(item.type)) {
      renderCatalogElement(item, node);
    } else if (item.type === "flap") {
      const body = document.createElement("div");
      body.className = "flap-body";
      const inside = makeLabel(item.secondary, "flap-inside");
      // The flap has two faces: the printed front and the plain back that shows when it is lifted.
      const front = document.createElement("div");
      front.className = "flap-front";
      const face = makeLabel(item.text, "flap-face");
      const back = document.createElement("div");
      back.className = "flap-back";
      face.dataset.tap = "toggle";
      back.dataset.tap = "toggle";
      inside.style.color = item.color;
      inside.style.borderColor = item.bg;
      face.style.backgroundColor = item.bg;
      face.style.color = item.color;
      back.style.backgroundColor = item.bg;
      front.append(face, back);
      body.append(inside, front);
      node.append(body, makeToggle(item, item.open ? "Klappe schließen" : "Klappe öffnen"));
    } else if (item.type === "accordion") {
      const parts = [item.text].concat(getPanelTexts(item, 2)).slice(0, 13);
      const panels = document.createElement("div");
      panels.className = "accordion-panels";
      parts.forEach(function (part, index) {
        const panel = makeLabel(part, "accordion-panel");
        panel.style.color = item.color;
        if (index === 0) panel.style.backgroundColor = item.bg;
        panels.append(panel);
      });
      node.append(panels, makeToggle(item, item.open ? "Akkordeon schließen" : "Akkordeon auffalten"));
    } else if (item.type === "booklet") {
      const inside = makeLabel(item.secondary, "booklet-inside");
      // The cover swings open around the left edge; its back shows the inside of the cover.
      const cover = document.createElement("div");
      cover.className = "booklet-cover";
      const coverFace = makeLabel(item.text, "booklet-face");
      const coverBack = document.createElement("div");
      coverBack.className = "booklet-back";
      coverFace.dataset.tap = "toggle";
      coverBack.dataset.tap = "toggle";
      inside.style.color = item.color;
      coverFace.style.backgroundColor = item.bg;
      coverFace.style.color = item.color;
      coverBack.style.backgroundColor = item.bg;
      cover.append(coverFace, coverBack);
      node.append(inside, cover, makeToggle(item, item.open ? "Buch schließen" : "Buch öffnen"));
    } else if (item.type === "wheel") {
      const face = document.createElement("div");
      face.className = "wheel-face";
      face.style.transform = "rotate(" + item.rotation + "deg)";
      face.style.background = "conic-gradient(" + item.bg + " 0 25%, #f7e5ed 25% 50%, #e5f0e7 50% 75%, #fff0ce 75%)";
      const center = makeLabel(item.text, "wheel-center");
      center.style.color = item.color;
      face.append(center);
      node.append(face, makeToggle(item, "Drehscheibe drehen"));
    } else {
      node.append(makeLabel(item.text));
    }
    if (!catalogTypes.has(item.type) && item.type !== "flap" && item.type !== "accordion" && item.type !== "booklet") {
      node.style.backgroundColor = item.bg;
    }
    if (project.selectedId === item.id) node.classList.add("selected");
    return node;
  }

  function renderStage() {
    stageElements.replaceChildren();
    project.elements.forEach(function (item) {
      stageElements.append(renderElement(item));
    });
    stageEmpty.hidden = project.elements.length > 0;
    elementCount.textContent = String(project.elements.length);
    stage.style.backgroundColor = project.paper;
    stage.classList.toggle("guides-off", project.guides === false);
    const guideButton = document.getElementById("toggle-guides");
    if (guideButton) {
      guideButton.textContent = project.guides === false ? "Linien: Aus" : "Linien: An";
      guideButton.setAttribute("aria-pressed", String(project.guides !== false));
    }
    paperColor.value = project.paper;
    selectionLabel.textContent = getSelected() ? typeName(getSelected().type) : "Nichts ausgewählt";
  }

  function fieldMarkup(label, id, value, options) {
    options = options || {};
    const kind = options.kind || "text";
    const maxLength = options.maxLength || 100;
    if (kind === "textarea") {
      return '<label class="field"><span class="field-label">' + label + '</span><textarea id="' + id + '" maxlength="' + maxLength + '">' + escapeHtml(value) + '</textarea></label>';
    }
    const bounds = ["range", "number"].includes(kind)
      ? ' min="' + options.min + '" max="' + options.max + '" step="' + (options.step || 1) + '"'
      : '';
    const valueDisplay = kind === "range"
      ? '<output class="field-value" id="' + id + '-value">' + escapeHtml(value) + '</output>'
      : '';
    return '<label class="field"><span class="field-label">' + label + valueDisplay + '</span><input id="' + id + '" type="' + kind + '" value="' + escapeHtml(value) + '"' + bounds + '></label>';
  }

  // Collapsible categories. The open/closed state is kept in memory only, not saved.
  const collapsedSections = new Set();

  function makeCollapsible(heading) {
    const title = heading.textContent.trim();
    const button = document.createElement("button");
    button.type = "button";
    button.className = "section-toggle";
    button.textContent = title;
    const collapsed = collapsedSections.has(title);
    button.setAttribute("aria-expanded", String(!collapsed));
    heading.textContent = "";
    heading.append(button);
    heading.closest(".tool-section, .inspector-group").classList.toggle("is-collapsed", collapsed);
  }

  document.addEventListener("click", function (event) {
    const toggle = event.target.closest(".section-toggle");
    if (!toggle) return;
    const title = toggle.textContent.trim();
    const collapsed = toggle.closest(".tool-section, .inspector-group").classList.toggle("is-collapsed");
    toggle.setAttribute("aria-expanded", String(!collapsed));
    if (collapsed) collapsedSections.add(title);
    else collapsedSections.delete(title);
  });

  document.querySelectorAll(".tool-section h2").forEach(makeCollapsible);

  function renderInspector() {
    const item = getSelected();
    if (!item) {
      inspector.innerHTML = '<div class="inspector-empty"><div class="empty-selection-icon">＋</div><strong>Wähle ein Element aus</strong><p>Klicke auf ein Element auf der Arbeitsfläche, um Text, Größe, Farbe und Form anzupassen.</p></div>';
      return;
    }

    const selectedIndex = project.elements.indexOf(item);
    const primaryLabels = {
      accordion: "Erstes Feld", wheel: "Text in der Mitte", flower: "Text in der Mitte",
      pocket: "Beschriftung der Tasche", fan1: "Titel", fan2: "Titel",
      leporello: "Titel", foldcross: "Text in der Mitte", foldsheet: "Titel",
      hexfold: "Text auf der Oberseite",
      flipflap: "Text auf der Rückseite", foldheart: "Text in der Mitte"
    };
    const secondaryLabels = {
      flap: "Text auf der Innenseite",
      booklet: "Inhalt im Mini-Buch"
    };

    let html = '<section class="inspector-group"><div class="group-heading"><h3>Inhalt</h3><span class="element-kind">' + typeName(item.type) + '</span></div>';
    html += fieldMarkup(primaryLabels[item.type] || "Text", "element-text", item.text, { kind: "textarea", maxLength: 500 });

    if (secondaryLabels[item.type]) {
      html += fieldMarkup(secondaryLabels[item.type], "element-secondary", item.secondary, { kind: "textarea", maxLength: 500 });
    }

    if (item.type === "flower") {
      html += '<label class="field flower-auto-field"><input id="flower-center-auto" type="checkbox"' + (item.centerSidesAuto !== false ? ' checked' : '') + '> <span>Seitenzahl an Blütenblätter koppeln</span></label>';
      html += '<label class="field"><span class="field-label">Ecken des Mittelteils</span><input id="flower-center-sides" type="number" min="3" max="' + MAX_PARTS + '" step="1" value="' + clamp(Number(item.centerSides) || 5, 3, MAX_PARTS) + '"' + (item.centerSidesAuto !== false ? ' disabled' : '') + '></label>';
      html += '<p class="field-help">Standardmäßig entspricht die Zahl der Ecken der Zahl der Blütenblätter.</p>';
    }

    if (multiPartCounts[item.type]) {
      syncParts(item);
      html += renderPartFields(item);
    }
    html += '</section>';
    html += '<section class="inspector-group"><div class="group-heading"><h3>Farben</h3></div><div class="color-controls"><label class="color-control">Papierfarbe<input id="element-bg" type="color" value="' + escapeHtml(item.bg) + '"></label><label class="color-control">Schriftfarbe<input id="element-color" type="color" value="' + escapeHtml(item.color) + '"></label></div></section>';
    html += '<section class="inspector-group"><div class="group-heading"><h3>Größe & Position</h3></div>';
    html += '<div class="inline-fields">' + fieldMarkup("Breite", "element-width", item.w, { kind: "range", min: 45, max: 600, step: 5 }) + fieldMarkup("Höhe", "element-height", item.h, { kind: "range", min: 40, max: 500, step: 5 }) + '</div>';
    html += '<div class="inline-fields position-fields">' + fieldMarkup("X-Position", "element-x", item.x, { kind: "number", min: 0, max: 1000, step: 1 }) + fieldMarkup("Y-Position", "element-y", item.y, { kind: "number", min: 0, max: 700, step: 1 }) + '</div>';
    html += fieldMarkup("Drehung", "element-rotation", item.rotation, { kind: "range", min: -360, max: 360, step: 5 });
    html += '</section>';
    html += '<section class="inspector-group"><div class="group-heading"><h3>Anordnen</h3></div><div class="layer-actions"><button type="button" class="small-action" data-inspector-action="duplicate">⧉ Duplizieren</button><button type="button" class="small-action" data-inspector-action="front"' + (selectedIndex >= project.elements.length - 1 ? ' disabled' : '') + '>Ebene hoch</button><button type="button" class="small-action" data-inspector-action="back"' + (selectedIndex <= 0 ? ' disabled' : '') + '>Ebene runter</button><button type="button" class="small-action delete-action" data-inspector-action="delete">Entfernen</button></div></section>';
    inspector.innerHTML = html;
    inspector.querySelectorAll(".inspector-group .group-heading h3").forEach(makeCollapsible);
    bindInspector(item);
  }

  inspector.addEventListener("click", function (event) {
    const add = event.target.closest("[data-part-add]");
    const remove = event.target.closest("[data-part-remove]");
    const item = getSelected();
    if (!item || (!add && !remove)) return;
    syncParts(item);
    if (add && item.parts.length < maxPartsFor(item.type)) {
      item.parts.push("Neues Teil " + (item.parts.length + 1));
      if (item.type === "flower" && item.centerSidesAuto !== false) item.centerSides = item.parts.length;
    } else if (remove && Number.isInteger(Number(remove.dataset.partRemove)) && Number(remove.dataset.partRemove) >= 0 && Number(remove.dataset.partRemove) < item.parts.length && item.parts.length > (minPartCounts[item.type] || 1)) {
      item.parts.splice(Number(remove.dataset.partRemove), 1);
      if (item.type === "flower" && item.centerSidesAuto !== false) item.centerSides = item.parts.length;
    } else {
      return;
    }
    item.secondary = item.parts.join("|");
    renderStage();
    renderInspector();
    persist();
  });

  function updateItem(property, value) {
    const item = getSelected();
    if (!item) return;

    if (["w", "h", "x", "y", "rotation"].includes(property)) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) return;
      if (property === "w") {
        item.w = clamp(numericValue, 45, 600);
        item.x = clamp(item.x, 0, 1000 - item.w);
      } else if (property === "h") {
        item.h = clamp(numericValue, 40, 500);
        item.y = clamp(item.y, 0, 700 - item.h);
      } else if (property === "x") {
        item.x = clamp(numericValue, 0, 1000 - item.w);
      } else if (property === "y") {
        item.y = clamp(numericValue, 0, 700 - item.h);
      } else {
        item.rotation = clamp(numericValue, -360, 360);
      }
      const xInput = document.getElementById("element-x");
      const yInput = document.getElementById("element-y");
      if (xInput) xInput.value = String(item.x);
      if (yInput) yInput.value = String(item.y);
      const rangeIds = { w: "element-width-value", h: "element-height-value", rotation: "element-rotation-value" };
      if (rangeIds[property]) {
        const output = document.getElementById(rangeIds[property]);
        if (output) output.textContent = String(item[property]);
      }
    } else {
      item[property] = value;
    }

    renderStage();
    persist();
  }

  function bindInspector(item) {
    const textInput = document.getElementById("element-text");
    if (textInput) textInput.addEventListener("input", function () { updateItem("text", textInput.value); });

    const secondaryInput = document.getElementById("element-secondary");
    if (secondaryInput) secondaryInput.addEventListener("input", function () { updateItem("secondary", secondaryInput.value); });

    const centerAuto = document.getElementById("flower-center-auto");
    if (centerAuto) centerAuto.addEventListener("change", function () {
      item.centerSidesAuto = centerAuto.checked;
      if (item.centerSidesAuto) {
        syncParts(item);
        item.centerSides = clamp(item.parts.length, 3, MAX_PARTS);
      }
      renderStage();
      renderInspector();
      persist();
    });

    const centerSides = document.getElementById("flower-center-sides");
    if (centerSides) centerSides.addEventListener("input", function () {
      item.centerSides = clamp(Number(centerSides.value) || 5, 3, MAX_PARTS);
      item.centerSidesAuto = false;
      renderStage();
      persist();
    });
    inspector.querySelectorAll("[data-part-index]").forEach(function (input) {
      input.addEventListener("input", function () {
        const index = Number(input.dataset.partIndex);
        syncParts(item);
        item.parts[index] = input.value.slice(0, 500);
        item.secondary = item.parts.join("|");
        renderStage();
        persist();
      });
    });
    const bg = document.getElementById("element-bg");
    const color = document.getElementById("element-color");
    const width = document.getElementById("element-width");
    const height = document.getElementById("element-height");
    const x = document.getElementById("element-x");
    const y = document.getElementById("element-y");
    const rotation = document.getElementById("element-rotation");
    if (bg) bg.addEventListener("input", function () { updateItem("bg", bg.value); });
    if (color) color.addEventListener("input", function () { updateItem("color", color.value); });
    if (width) width.addEventListener("input", function () { updateItem("w", width.value); });
    if (height) height.addEventListener("input", function () { updateItem("h", height.value); });
    if (x) x.addEventListener("change", function () { updateItem("x", x.value); });
    if (y) y.addEventListener("change", function () { updateItem("y", y.value); });
    if (rotation) rotation.addEventListener("input", function () { updateItem("rotation", rotation.value); });
  }

  function addElement(type) {
    const template = templates[type];
    if (!template) return;
    const count = project.elements.length;
    const item = Object.assign({}, template, {
      id: uid(),
      x: clamp(120 + (count % 5) * 38, 0, 1000 - template.w),
      y: clamp(100 + (count % 4) * 35, 0, 700 - template.h),
      rotation: 0,
      open: false,
      openPanels: [],
      parts: (multiPartCounts[type] ? String(template.secondary || "").split("|").map(function (part) { return part.trim(); }).slice(0, maxPartsFor(type)) : []),
      centerSides: type === "flower" ? String(template.secondary || "").split("|").length : 5,
      centerSidesAuto: true
    });
    project.elements.push(item);
    project.selectedId = item.id;
    renderStage();
    renderInspector();
    persist();
    showToast(typeName(type) + " hinzugefügt");
  }

  function duplicateSelected() {
    const item = getSelected();
    if (!item) return;
    const copy = Object.assign({}, item, {
      id: uid(),
      x: clamp(item.x + 25, 0, 1000 - item.w),
      y: clamp(item.y + 25, 0, 700 - item.h),
      open: false,
      openPanels: Array.isArray(item.openPanels) ? item.openPanels.slice() : [],
      parts: Array.isArray(item.parts) ? item.parts.slice() : item.parts
    });
    const index = project.elements.indexOf(item);
    project.elements.splice(index + 1, 0, copy);
    project.selectedId = copy.id;
    renderStage();
    renderInspector();
    persist();
  }

  function deleteSelected() {
    if (!project.selectedId) return;
    project.elements = project.elements.filter(function (item) { return item.id !== project.selectedId; });
    project.selectedId = null;
    renderStage();
    renderInspector();
    persist();
    showToast("Element entfernt");
  }

  function moveLayer(direction) {
    const index = project.elements.findIndex(function (item) { return item.id === project.selectedId; });
    if (index < 0) return;
    const target = clamp(index + direction, 0, project.elements.length - 1);
    if (target === index) return;
    const temp = project.elements[index];
    project.elements[index] = project.elements[target];
    project.elements[target] = temp;
    renderStage();
    renderInspector();
    persist();
  }

  function applyZoom() {
    zoom = clamp(Number(zoom) || 1, 0.6, 1.5);
    scaler.style.maxWidth = "none";
    scaler.style.width = "min(" + Math.round(900 * zoom) + "px, " + Math.round(zoom * 100) + "%)";
    zoomLabel.textContent = Math.round(zoom * 100) + "%";
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Card popup for pocket elements: flip through the cards with arrows or the keyboard.
  const pocketModal = document.getElementById("pocket-modal");
  const pocketModalTitle = document.getElementById("pocket-modal-title");
  const pocketModalCard = document.getElementById("pocket-modal-card");
  const pocketModalCount = document.getElementById("pocket-modal-count");
  const pocketPrev = document.getElementById("pocket-prev");
  const pocketNext = document.getElementById("pocket-next");
  const pocketClose = document.getElementById("pocket-modal-close");

  function renderPocketView() {
    const item = project.elements.find(function (entry) { return entry.id === pocketView.id; });
    if (!item) {
      closePocket();
      return;
    }
    const cards = getPanelTexts(item, 1);
    pocketView.index = clamp(pocketView.index, 0, cards.length - 1);
    pocketModalTitle.textContent = item.text;
    pocketModalCard.textContent = cards[pocketView.index];
    pocketModalCard.style.backgroundColor = item.bg;
    pocketModalCard.style.color = item.color;
    pocketModalCount.textContent = (pocketView.index + 1) + " / " + cards.length;
    pocketPrev.disabled = pocketView.index === 0;
    pocketNext.disabled = pocketView.index === cards.length - 1;
  }

  function openPocket(id) {
    pocketView = { id: id, index: 0, returnFocus: document.activeElement };
    renderPocketView();
    pocketModal.hidden = false;
    pocketClose.focus();
  }

  function closePocket() {
    if (!pocketView) return;
    const returnFocus = pocketView.returnFocus;
    pocketView = null;
    pocketModal.hidden = true;
    if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
  }

  function stepPocket(delta) {
    if (!pocketView) return;
    pocketView.index += delta;
    renderPocketView();
  }

  pocketPrev.addEventListener("click", function () { stepPocket(-1); });
  pocketNext.addEventListener("click", function () { stepPocket(1); });
  pocketClose.addEventListener("click", closePocket);
  pocketModal.addEventListener("click", function (event) {
    if (event.target === pocketModal) closePocket();
  });

  document.querySelectorAll("[data-add]").forEach(function (button) {
    button.addEventListener("click", function () { addElement(button.dataset.add); });
  });

  stage.addEventListener("pointerdown", function (event) {
    const itemNode = event.target.closest(".element");
    if (!itemNode || event.target.closest(".fold-toggle, [data-action='panel-toggle']")) return;
    const item = project.elements.find(function (entry) { return entry.id === itemNode.dataset.id; });
    if (!item) return;
    selectElement(item.id);
    const rect = stage.getBoundingClientRect();
    drag = {
      id: item.id,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left - (item.x / 1000) * rect.width,
      offsetY: event.clientY - rect.top - (item.y / 700) * rect.height,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      // A tap (no movement) on a flap face opens or closes the element.
      tapToggle: Boolean(event.target.closest("[data-tap='toggle']"))
    };
    itemNode.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  stage.addEventListener("pointermove", function (event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const item = project.elements.find(function (entry) { return entry.id === drag.id; });
    if (!item) return;
    if (!drag.moved && Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) < 5) return;
    drag.moved = true;
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left - drag.offsetX) / rect.width) * 1000;
    const y = ((event.clientY - rect.top - drag.offsetY) / rect.height) * 700;
    item.x = Math.round(clamp(x, 0, 1000 - item.w));
    item.y = Math.round(clamp(y, 0, 700 - item.h));
    const xInput = document.getElementById("element-x");
    const yInput = document.getElementById("element-y");
    if (xInput) xInput.value = String(item.x);
    if (yInput) yInput.value = String(item.y);
    const node = stageElements.querySelector('[data-id="' + item.id + '"]');
    if (node) {
      node.style.left = (item.x / 10) + "%";
      node.style.top = (item.y / 7) + "%";
    }
  });

  function finishDrag(event) {
    if (!drag || (event && drag.pointerId !== event.pointerId)) return;
    const finished = drag;
    drag = null;
    if (!finished.moved && finished.tapToggle && event && event.type === "pointerup") {
      const tapped = project.elements.find(function (entry) { return entry.id === finished.id; });
      if (tapped) toggleItem(tapped);
      return;
    }
    persist();
  }

  // Opens or closes an element in place, so the CSS transition can play.
  function toggleItem(item) {
    const node = stageElements.querySelector('[data-id="' + item.id + '"]');
    if (item.type === "wheel") {
      const step = 360 / Math.max(2, getPanelTexts(item).length);
      const disc = node && node.querySelector(".wheel-disc");
      if (disc) {
        const spin = (Number(disc.dataset.spin) || 0) + step;
        disc.dataset.spin = String(spin);
        disc.style.transform = "rotate(" + spin + "deg)";
        item.rotation = spin % 360;
      } else {
        item.rotation = (item.rotation + step) % 360;
        renderStage();
      }
      persist();
      return;
    }
    item.open = !item.open;
    if (!node) {
      renderStage();
    } else {
      node.classList.toggle("is-open", item.open);
      const layout = node.querySelector(".catalog-layout");
      if (layout) layout.classList.toggle("is-open", item.open);
      const button = node.querySelector(".fold-toggle");
      if (button) {
        button.textContent = item.open ? "↶" : "↗";
        button.title = item.open ? "Zuklappen" : "Aufklappen";
        button.setAttribute("aria-label", button.title);
      }
    }
    persist();
  }

  // Types whose single panels only depend on the panel's own is-open class.
  const inPlacePanelTypes = new Set(["flipflap", "pocket4", "foldcross", "flower", "foldheart"]);
  stage.addEventListener("pointerup", finishDrag);
  stage.addEventListener("pointercancel", finishDrag);

  stage.addEventListener("click", function (event) {
    const panelToggle = event.target.closest('[data-action="panel-toggle"]');
    if (panelToggle) {
      const panelNode = panelToggle.closest(".element");
      const panelItem = project.elements.find(function (entry) { return entry.id === panelNode.dataset.id; });
      if (!panelItem) return;
      selectElement(panelItem.id);
      const panelIndex = Number(panelToggle.dataset.panelIndex);
      const current = new Set(panelItem.openPanels || []);
      if (current.has(panelIndex)) current.delete(panelIndex);
      else current.add(panelIndex);
      panelItem.openPanels = Array.from(current).sort(function (a, b) { return a - b; });
      if (inPlacePanelTypes.has(panelItem.type)) {
        // Keep the node so the panel animates.
        panelToggle.classList.toggle("is-open", current.has(panelIndex));
        panelToggle.setAttribute("aria-pressed", String(current.has(panelIndex)));
      } else {
        renderStage();
      }
      persist();
      return;
    }
    const toggle = event.target.closest('[data-action="toggle"]');
    if (toggle) {
      const node = toggle.closest(".element");
      const item = project.elements.find(function (entry) { return entry.id === node.dataset.id; });
      if (!item) return;
      selectElement(item.id);
      if (item.type === "pocket") {
        openPocket(item.id);
        return;
      }
      toggleItem(item);
      return;
    }
    if (!event.target.closest(".element")) {
      project.selectedId = null;
      selectElement(null);
    }
  });

  inspector.addEventListener("click", function (event) {
    const button = event.target.closest("[data-inspector-action]");
    if (!button) return;
    const action = button.dataset.inspectorAction;
    if (action === "duplicate") duplicateSelected();
    if (action === "delete") deleteSelected();
    if (action === "front") moveLayer(1);
    if (action === "back") moveLayer(-1);
  });

  projectTitle.value = project.title;
  projectTitle.addEventListener("input", function () {
    project.title = projectTitle.value.slice(0, 60);
    persist();
  });

  paperColor.addEventListener("input", function () {
    project.paper = paperColor.value;
    stage.style.backgroundColor = project.paper;
    persist();
  });

  document.getElementById("toggle-guides").addEventListener("click", function () {
    project.guides = project.guides === false;
    renderStage();
    persist();
  });

  document.getElementById("new-project").addEventListener("click", function () {
    const hasUnsavedWork = project.elements.length > 0 || project.title !== defaults.title || project.paper !== defaults.paper || project.guides !== defaults.guides;
    if (hasUnsavedWork && !window.confirm("Ein neues Lapbook starten? Exportiere dein aktuelles Projekt vorher, wenn du es behalten möchtest.")) return;
    project = structuredClone(defaults);
    projectTitle.value = project.title;
    renderStage();
    renderInspector();
    persist();
    showToast("Neues Lapbook erstellt");
  });

  document.getElementById("clear-all").addEventListener("click", function () {
    if (project.elements.length === 0) {
      showToast("Die Arbeitsfläche ist bereits leer");
      return;
    }
    if (!window.confirm("Wirklich alle Elemente von der Arbeitsfläche löschen? Dieser Schritt kann nicht rückgängig gemacht werden.")) return;
    project.elements = [];
    project.selectedId = null;
    renderStage();
    renderInspector();
    persist();
    showToast("Alle Elemente gelöscht");
  });

  document.getElementById("export-project").addEventListener("click", function () {
    const safeName = (project.title || "lapbook").trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "lapbook";
    download(safeName + ".lapbook.json", JSON.stringify({ format: "lapbook-maker", version: 2, title: project.title, paper: project.paper, guides: project.guides !== false, elements: project.elements }, null, 2), "application/json");
    showToast("Lapbook exportiert");
  });

  const importInput = document.getElementById("import-file");
  document.getElementById("import-project").addEventListener("click", function () { importInput.click(); });
  importInput.addEventListener("change", function () {
    const file = importInput.files && importInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || !Array.isArray(parsed.elements)) throw new Error("Ungültige Lapbook-Datei");
        if (parsed.elements.length > 500) throw new Error("Die Datei enthält mehr als 500 Elemente.");
        const next = { title: String(parsed.title || "Importiertes Lapbook").slice(0, 60), paper: parsed.paper, guides: parsed.guides !== false, elements: parsed.elements, selectedId: null };
        const valid = next.elements.every(function (item) { return item && typeof item === "object" && Object.hasOwn(templates, migrateType(item.type)); });
        if (!valid) throw new Error("Die Datei enthält unbekannte Elemente.");

        const hasCurrentProject = project.elements.length > 0 || project.title !== defaults.title || project.paper !== defaults.paper || project.guides !== defaults.guides;
        if (hasCurrentProject && !window.confirm("Der Import ersetzt dein aktuelles Lapbook. Möchtest du fortfahren?")) {
          showToast("Import abgebrochen");
          importInput.value = "";
          return;
        }

        project = loadFromImport(next);
        projectTitle.value = project.title;
        renderStage();
        renderInspector();
        persist();
        showToast("Lapbook importiert");
      } catch (error) {
        showToast(error.message || "Datei konnte nicht importiert werden.");
      }
      importInput.value = "";
    };
    reader.onerror = function () { showToast("Datei konnte nicht gelesen werden."); importInput.value = ""; };
    reader.readAsText(file);
  });

  function loadFromImport(parsed) {
    return {
      title: String(parsed.title || "Importiertes Lapbook").slice(0, 60),
      paper: /^#[0-9a-f]{6}$/i.test(parsed.paper) ? parsed.paper : defaults.paper,
      guides: parsed.guides !== false,
      selectedId: null,
      elements: parsed.elements.map(function (item) { return normalizeElement(item, true); })
    };
  }

  document.getElementById("zoom-in").addEventListener("click", function () { zoom = clamp(zoom + 0.1, 0.6, 1.5); applyZoom(); });
  document.getElementById("zoom-out").addEventListener("click", function () { zoom = clamp(zoom - 0.1, 0.6, 1.5); applyZoom(); });
  document.getElementById("zoom-fit").addEventListener("click", function () { zoom = 1; applyZoom(); });

  document.addEventListener("keydown", function (event) {
    if (pocketView) {
      // While the card popup is open, keys only flip or close it; nothing gets deleted.
      if (event.key === "Escape") closePocket();
      else if (event.key === "ArrowLeft") stepPocket(-1);
      else if (event.key === "ArrowRight") stepPocket(1);
      return;
    }
    const tag = event.target && event.target.tagName;
    const editing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || event.target.isContentEditable;
    if (!editing && (event.key === "Delete" || event.key === "Backspace")) {
      event.preventDefault();
      deleteSelected();
    }
    if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateSelected();
    }
    if (!editing && event.key === "Escape") {
      project.selectedId = null;
      selectElement(null);
    }
  });

  renderStage();
  renderInspector();
  persist();
  applyZoom();
})();

// Theme toggle: switches light and dark and remembers the choice.
(function () {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", function () {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("lapbook-theme", next); } catch (error) { /* storage unavailable */ }
  });
})();