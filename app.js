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
    pocket: { type: "pocket", w: 190, h: 135, text: "Wissens-Tasche", secondary: "Zieh mich heraus!", bg: "#e6dafa", color: "#62517f" },
    wheel: { type: "wheel", w: 160, h: 160, text: "Drehen", secondary: "Thema", bg: "#e7dcf8", color: "#7055a4" },
    tab: { type: "tab", w: 125, h: 48, text: "KAPITEL 1", secondary: "", bg: "#d8ccf4", color: "#65518d" },
    note: { type: "note", w: 180, h: 120, text: "Schreibe hier deine Notiz.", secondary: "", bg: "#fff3cf", color: "#725a32" },
    circle: { type: "circle", w: 125, h: 125, text: "Kreis", secondary: "", bg: "#e9defa", color: "#594b72" },
    triangle: { type: "triangle", w: 145, h: 130, text: "Dreieck", secondary: "", bg: "#f5d9e5", color: "#87566f" },
    star: { type: "star", w: 140, h: 140, text: "Stern", secondary: "", bg: "#ffe7ae", color: "#8c6d35" },
    hexagon: { type: "hexagon", w: 160, h: 125, text: "Sechseck", secondary: "", bg: "#d5e9df", color: "#4f7560" },
    banner: { type: "banner", w: 270, h: 75, text: "Mein Thema", secondary: "", bg: "#f3cddd", color: "#87536e" },
    flower: { type: "flower", w: 230, h: 220, text: "Blütenmitte", secondary: "Blatt 1|Blatt 2|Blatt 3|Blatt 4|Blatt 5", bg: "#f4d7e5", color: "#80516b" },
    pocket4: { type: "pocket4", w: 245, h: 190, text: "Meine Tasche", secondary: "Karte 1|Karte 2|Karte 3|Karte 4", bg: "#e8def8", color: "#62517f" },
    fan1: { type: "fan1", w: 250, h: 185, text: "Fächer", secondary: "Thema 1|Thema 2|Thema 3|Thema 4", bg: "#e8def8", color: "#62517f" },
    fan2: { type: "fan2", w: 250, h: 210, text: "Fächer 2", secondary: "Teil 1|Teil 2|Teil 3|Teil 4", bg: "#e8def8", color: "#62517f" },
    leporello: { type: "leporello", w: 280, h: 150, text: "Leporello", secondary: "Seite 1|Seite 2|Seite 3|Seite 4", bg: "#e5dafa", color: "#5f4b87" },
    foldcross: { type: "foldcross", w: 230, h: 230, text: "Mitte", secondary: "Oben|Rechts|Unten|Links", bg: "#e7dafa", color: "#63517e" },
    foldsheet: { type: "foldsheet", w: 180, h: 255, text: "Faltblatt", secondary: "Feld 1|Feld 2|Feld 3", bg: "#e9defa", color: "#5f4b87" },
    hexfold: { type: "hexfold", w: 190, h: 220, text: "Sechseck", secondary: "Innenseite", bg: "#d8e9df", color: "#4f7560" },
    "leporello-figure": { type: "leporello-figure", w: 220, h: 285, text: "Meine Figur", secondary: "Kopf|Oberkörper|Mitte|Unterteil", bg: "#e8def8", color: "#62517f" },
    flipflap: { type: "flipflap", w: 275, h: 215, text: "Flip-Flap", secondary: "Klappe 1|Klappe 2|Klappe 3|Klappe 4", bg: "#e7dafa", color: "#63517e" },
    foldheart: { type: "foldheart", w: 235, h: 220, text: "Faltherz", secondary: "Herz 1|Herz 2|Herz 3|Herz 4", bg: "#f4d7e5", color: "#80516b" }
  };

  const catalogTypes = new Set([
    "wheel", "flower", "pocket4", "fan1", "fan2", "leporello", "foldcross",
    "foldsheet", "hexfold", "leporello-figure", "flipflap", "foldheart"
  ]);

  let project = loadProject();
  let zoom = 1;
  let drag = null;
  let toastTimer = null;

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

  function loadProject() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return structuredClone(defaults);
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.elements)) return structuredClone(defaults);
      parsed.elements = parsed.elements.filter(function (item) {
        return item && templates[item.type] && typeof item.id === "string";
      }).map(function (item) {
        const base = templates[item.type];
        return {
          id: item.id,
          type: item.type,
          x: clamp(Number(item.x) || 0, 0, 1000),
          y: clamp(Number(item.y) || 0, 0, 700),
          w: clamp(Number(item.w) || base.w, 45, 600),
          h: clamp(Number(item.h) || base.h, 40, 500),
          rotation: clamp(Number(item.rotation) || 0, -360, 360),
          text: String(item.text == null ? base.text : item.text).slice(0, 500),
          secondary: String(item.secondary == null ? base.secondary : item.secondary).slice(0, 500),
          bg: /^#[0-9a-f]{6}$/i.test(item.bg) ? item.bg : base.bg,
          color: /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : base.color,
          open: Boolean(item.open),
          openPanels: Array.isArray(item.openPanels) ? item.openPanels.filter(function (index) { return Number.isInteger(index) && index >= 0 && index < 8; }) : []
        };
      });
      return {
        title: String(parsed.title || defaults.title).slice(0, 60),
        paper: /^#[0-9a-f]{6}$/i.test(parsed.paper) ? parsed.paper : defaults.paper,
        guides: parsed.guides !== false,
        elements: parsed.elements,
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
      flower: "Blume", pocket4: "Tasche mit 4 Karten", fan1: "Fächer 1", fan2: "Fächer 2",
      leporello: "Leporello", foldcross: "Faltkreuz", foldsheet: "Faltblatt", hexfold: "Falt-Sechseck",
      "leporello-figure": "Leporello-Figur", flipflap: "Flip-Flap", foldheart: "Faltherz"
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

  function getPanelTexts(item, count) {
    const values = String(item.secondary || "").split("|").map(function (value) { return value.trim(); });
    while (values.length < count) values.push("Feld " + (values.length + 1));
    return values.slice(0, count);
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
    const count = item.type === "flower" ? 5
      : item.type === "wheel" ? 4
      : item.type === "foldsheet" ? 3
      : (["foldcross", "fan1", "fan2", "leporello-figure", "flipflap", "foldheart", "pocket4"].includes(item.type) ? 4 : 2);
    const labels = getPanelTexts(item, count);
    const center = document.createElement("div");
    center.className = "template-center";
    center.textContent = item.text;
    center.style.color = item.color;

    if (item.type === "wheel") {
      const disc = document.createElement("div");
      disc.className = "wheel-disc";
      disc.style.transform = "rotate(" + item.rotation + "deg)";
      labels.forEach(function (label, index) {
        const sector = document.createElement("div");
        sector.className = "wheel-sector wheel-sector-" + index;
        sector.textContent = label;
        sector.style.backgroundColor = index % 2 ? "#f5e7ef" : item.bg;
        sector.style.color = item.color;
        disc.append(sector);
      });
      const hub = document.createElement("div");
      hub.className = "wheel-hub";
      hub.textContent = item.text;
      disc.append(hub);
      layout.append(disc, makeToggle(item, "Drehscheibe um 90 Grad drehen"));
      addConstructionGuide(layout, "guide-fold wheel-pivot");
      addConstructionGuide(layout, "guide-cut guide-circle");
    } else if (item.type === "flower") {
      labels.forEach(function (label, index) {
        layout.append(makeTemplatePanel(item, index, "flower-petal flower-petal-" + index, label));
      });
      center.classList.add("flower-center");
      layout.append(center);
      addConstructionGuide(layout, "guide-fold flower-fold flower-fold-a");
      addConstructionGuide(layout, "guide-fold flower-fold flower-fold-b");
      addConstructionGuide(layout, "guide-glue flower-glue");
    } else if (item.type === "pocket4") {
      labels.forEach(function (label, index) {
        layout.append(makeTemplatePanel(item, index, "pocket4-card pocket4-card-" + index, label));
      });
      const pocket = document.createElement("div");
      pocket.className = "pocket4-front";
      pocket.textContent = item.text;
      pocket.style.backgroundColor = item.bg;
      pocket.style.color = item.color;
      layout.append(pocket);
      addConstructionGuide(layout, "guide-cut pocket4-cut");
      addConstructionGuide(layout, "guide-fold pocket4-fold");
      addConstructionGuide(layout, "guide-glue pocket4-glue");
    } else if (item.type === "fan1") {
      const angles = [-22, -8, 7, 22];
      labels.forEach(function (label, index) {
        const blade = makeTemplatePanel(item, index, "fan1-blade fan1-blade-" + index, label);
        const angle = angles[index] + ((item.openPanels || []).includes(index) ? (index < 2 ? -9 : 9) : 0);
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
        strip.style.top = (index * 19) + "%";
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
        if (index < 3) addConstructionGuide(layout, "guide-fold leporello-crease crease-" + index);
      });
      layout.append(makeToggle(item, "Leporello auf- oder zusammenfalten"));
      addConstructionGuide(layout, "guide-cut leporello-cut");
    } else if (item.type === "foldcross") {
      const positions = ["cross-top", "cross-right", "cross-bottom", "cross-left"];
      labels.forEach(function (label, index) {
        layout.append(makeTemplatePanel(item, index, "cross-flap " + positions[index], label));
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
        panel.style.backgroundColor = index % 2 ? "#f4eafa" : item.bg;
        panel.style.color = item.color;
        layout.append(panel);
        if (index < 2) addConstructionGuide(layout, "guide-fold foldsheet-crease crease-" + index);
      });
      layout.append(makeToggle(item, "Faltblatt auf- oder zusammenfalten"));
      addConstructionGuide(layout, "guide-cut foldsheet-cut");
    } else if (item.type === "hexfold") {
      const lower = document.createElement("div");
      lower.className = "hexfold-part hexfold-lower";
      lower.textContent = labels[0];
      lower.style.backgroundColor = item.bg;
      lower.style.color = item.color;
      const upper = document.createElement("div");
      upper.className = "hexfold-part hexfold-upper";
      upper.textContent = item.text;
      upper.style.backgroundColor = item.bg;
      upper.style.color = item.color;
      layout.append(lower, upper, makeToggle(item, "Sechseck auf- oder zuklappen"));
      addConstructionGuide(layout, "guide-fold hexfold-crease");
      addConstructionGuide(layout, "guide-cut hexfold-cut");
    } else if (item.type === "leporello-figure") {
      const head = document.createElement("div");
      head.className = "figure-head";
      head.textContent = "●";
      const arms = document.createElement("div");
      arms.className = "figure-arms";
      const body = document.createElement("div");
      body.className = "figure-body";
      labels.forEach(function (label, index) {
        const panel = document.createElement("div");
        panel.className = "figure-panel";
        panel.textContent = label;
        panel.style.backgroundColor = index % 2 ? "#f2eafa" : item.bg;
        panel.style.color = item.color;
        body.append(panel);
        if (index < 3) addConstructionGuide(body, "guide-fold figure-crease crease-" + index);
      });
      const title = document.createElement("div");
      title.className = "figure-title";
      title.textContent = item.text;
      layout.append(head, arms, title, body, makeToggle(item, "Figur-Leporello auffalten"));
      addConstructionGuide(layout, "guide-cut figure-cut");
      addConstructionGuide(layout, "guide-glue figure-glue");
    } else if (item.type === "flipflap") {
      const backing = document.createElement("div");
      backing.className = "flipflap-backing";
      backing.textContent = item.text;
      labels.forEach(function (label, index) {
        layout.append(makeTemplatePanel(item, index, "flipflap-panel flipflap-panel-" + index, label));
      });
      layout.append(backing);
      addConstructionGuide(layout, "guide-fold flipflap-crease");
      addConstructionGuide(layout, "guide-cut flipflap-cut");
      addConstructionGuide(layout, "guide-glue flipflap-glue");
    } else if (item.type === "foldheart") {
      labels.forEach(function (label, index) {
        layout.append(makeTemplatePanel(item, index, "heart-petal heart-petal-" + index, label));
      });
      center.classList.add("heart-center");
      layout.append(center);
      addConstructionGuide(layout, "guide-fold heart-fold heart-fold-a");
      addConstructionGuide(layout, "guide-fold heart-fold heart-fold-b");
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
    node.style.height = (item.h / 7) + "%";
    node.style.transform = item.type === "wheel" ? "rotate(0deg)" : "rotate(" + item.rotation + "deg)";
    node.style.zIndex = String(3 + project.elements.indexOf(item));
    node.style.color = item.color;

    if (catalogTypes.has(item.type) || ["flap", "booklet", "pocket", "accordion"].includes(item.type)) {
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
      const front = makeLabel(item.text, "flap-front");
      inside.style.color = item.color;
      inside.style.borderColor = item.bg;
      front.style.backgroundColor = item.bg;
      front.style.color = item.color;
      body.append(inside, front);
      node.append(body, makeToggle(item, item.open ? "Klappe schließen" : "Klappe öffnen"));
    } else if (item.type === "accordion") {
      const parts = [item.text].concat(item.secondary.split("|")).slice(0, 3);
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
      const cover = makeLabel(item.text, "booklet-cover");
      inside.style.color = item.color;
      cover.style.backgroundColor = item.bg;
      cover.style.color = item.color;
      node.append(inside, cover, makeToggle(item, item.open ? "Buch schließen" : "Buch öffnen"));
    } else if (item.type === "pocket") {
      const card = makeLabel(item.secondary, "pocket-card");
      const front = makeLabel(item.text, "pocket-front");
      card.style.color = item.color;
      front.style.backgroundColor = item.bg;
      front.style.color = item.color;
      node.append(card, front, makeToggle(item, item.open ? "Karte zurückstecken" : "Karte herausziehen"));
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
    if (!catalogTypes.has(item.type) && item.type !== "flap" && item.type !== "accordion" && item.type !== "booklet" && item.type !== "pocket") {
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
    return '<label class="field"><span class="field-label">' + label + '</span><input id="' + id + '" type="' + kind + '" value="' + escapeHtml(value) + '"' + (kind === "range" ? ' min="' + options.min + '" max="' + options.max + '" step="' + (options.step || 1) + '"' : '') + '></label>';
  }

  function renderInspector() {
    const item = getSelected();
    if (!item) {
      inspector.innerHTML = '<div class="inspector-empty"><div class="empty-selection-icon">＋</div><strong>Wähle ein Element aus</strong><p>Klicke auf ein Element auf der Arbeitsfläche, um Text, Größe, Farbe und Form anzupassen.</p></div>';
      return;
    }

    let html = '<section class="inspector-group"><div class="group-heading"><h3>Inhalt</h3><span class="element-kind">' + typeName(item.type) + '</span></div>';
    html += fieldMarkup("Vorderseite / Text", "element-text", item.text, { kind: "textarea", maxLength: 500 });
    if (["flap", "accordion", "booklet", "pocket"].includes(item.type) || catalogTypes.has(item.type)) {
      html += fieldMarkup("Weitere Felder (mit | trennen)", "element-secondary", item.secondary, { kind: "textarea", maxLength: 500 });
    }
    if (catalogTypes.has(item.type)) {
      html += '<p class="field-help">Bei mehrteiligen Vorlagen trennst du die einzelnen Texte mit einem senkrechten Strich ( | ). Die Teile lassen sich direkt auf der Arbeitsfläche aufklappen.</p>';
    }
    html += '</section>';
    html += '<section class="inspector-group"><div class="group-heading"><h3>Farben</h3></div><div class="color-controls"><label class="color-control">Papierfarbe<input id="element-bg" type="color" value="' + escapeHtml(item.bg) + '"></label><label class="color-control">Schriftfarbe<input id="element-color" type="color" value="' + escapeHtml(item.color) + '"></label></div></section>';
    html += '<section class="inspector-group"><div class="group-heading"><h3>Größe & Position</h3></div>';
    html += '<div class="inline-fields">' + fieldMarkup("Breite", "element-width", item.w, { kind: "range", min: 45, max: 600, step: 5 }) + fieldMarkup("Höhe", "element-height", item.h, { kind: "range", min: 40, max: 500, step: 5 }) + '</div>';
    html += fieldMarkup("Drehung", "element-rotation", item.rotation, { kind: "range", min: -360, max: 360, step: 5 });
    html += '</section>';
    html += '<section class="inspector-group"><div class="group-heading"><h3>Anordnen</h3></div><div class="layer-actions"><button type="button" class="small-action" data-inspector-action="duplicate">⧉ Duplizieren</button><button type="button" class="small-action" data-inspector-action="front">Nach vorne</button><button type="button" class="small-action" data-inspector-action="back">Nach hinten</button><button type="button" class="small-action delete-action" data-inspector-action="delete">Entfernen</button></div></section>';
    inspector.innerHTML = html;
    bindInspector(item);
  }

  function updateItem(property, value) {
    const item = getSelected();
    if (!item) return;
    if (["w", "h", "rotation"].includes(property)) {
      item[property] = Number(value);
    } else {
      item[property] = value;
    }
    renderStage();
    persist();
  }

  function bindInspector(item) {
    const textInput = document.getElementById("element-text");
    const secondaryInput = document.getElementById("element-secondary");
    if (textInput) textInput.addEventListener("input", function () { updateItem("text", textInput.value); });
    if (secondaryInput) secondaryInput.addEventListener("input", function () { updateItem("secondary", secondaryInput.value); });
    const bg = document.getElementById("element-bg");
    const color = document.getElementById("element-color");
    const width = document.getElementById("element-width");
    const height = document.getElementById("element-height");
    const rotation = document.getElementById("element-rotation");
    if (bg) bg.addEventListener("input", function () { updateItem("bg", bg.value); });
    if (color) color.addEventListener("input", function () { updateItem("color", color.value); });
    if (width) width.addEventListener("input", function () { updateItem("w", width.value); });
    if (height) height.addEventListener("input", function () { updateItem("h", height.value); });
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
      openPanels: []
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
    const copy = Object.assign({}, item, { id: uid(), x: clamp(item.x + 25, 0, 1000 - item.w), y: clamp(item.y + 25, 0, 700 - item.h), open: false });
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
    persist();
  }

  function applyZoom() {
    scaler.style.width = (Math.round(zoom * 100)) + "%";
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
    URL.revokeObjectURL(url);
  }

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
      offsetY: event.clientY - rect.top - (item.y / 700) * rect.height
    };
    stage.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  stage.addEventListener("pointermove", function (event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const item = project.elements.find(function (entry) { return entry.id === drag.id; });
    if (!item) return;
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left - drag.offsetX) / rect.width) * 1000;
    const y = ((event.clientY - rect.top - drag.offsetY) / rect.height) * 700;
    item.x = Math.round(clamp(x, 0, 1000 - item.w));
    item.y = Math.round(clamp(y, 0, 700 - item.h));
    const node = stageElements.querySelector('[data-id="' + item.id + '"]');
    if (node) {
      node.style.left = (item.x / 10) + "%";
      node.style.top = (item.y / 7) + "%";
    }
  });

  function finishDrag(event) {
    if (!drag || (event && drag.pointerId !== event.pointerId)) return;
    drag = null;
    persist();
  }
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
      renderStage();
      persist();
      return;
    }
    const toggle = event.target.closest('[data-action="toggle"]');
    if (toggle) {
      const node = toggle.closest(".element");
      const item = project.elements.find(function (entry) { return entry.id === node.dataset.id; });
      if (!item) return;
      selectElement(item.id);
      if (item.type === "wheel") item.rotation = (item.rotation + 90) % 360;
      else item.open = !item.open;
      renderStage();
      persist();
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
    if (project.elements.length && !window.confirm("Ein neues Lapbook starten? Dein aktuelles Projekt bleibt nur erhalten, wenn du es vorher exportierst.")) return;
    project = structuredClone(defaults);
    projectTitle.value = project.title;
    renderStage();
    renderInspector();
    persist();
    showToast("Neues Lapbook erstellt");
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
        const next = { title: String(parsed.title || "Importiertes Lapbook").slice(0, 60), paper: parsed.paper, guides: parsed.guides !== false, elements: parsed.elements, selectedId: null };
        const valid = next.elements.every(function (item) { return item && templates[item.type] && typeof item.id === "string"; });
        if (!valid) throw new Error("Die Datei enthält unbekannte Elemente.");
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
    const safe = {
      title: String(parsed.title || "Importiertes Lapbook").slice(0, 60),
      paper: /^#[0-9a-f]{6}$/i.test(parsed.paper) ? parsed.paper : defaults.paper,
      guides: parsed.guides !== false,
      selectedId: null,
      elements: parsed.elements.map(function (item) {
        const base = templates[item.type];
        return {
          id: uid(), type: item.type,
          x: clamp(Number(item.x) || 0, 0, 1000),
          y: clamp(Number(item.y) || 0, 0, 700),
          w: clamp(Number(item.w) || base.w, 45, 600),
          h: clamp(Number(item.h) || base.h, 40, 500),
          rotation: clamp(Number(item.rotation) || 0, -360, 360),
          text: String(item.text == null ? base.text : item.text).slice(0, 500),
          secondary: String(item.secondary == null ? base.secondary : item.secondary).slice(0, 500),
          bg: /^#[0-9a-f]{6}$/i.test(item.bg) ? item.bg : base.bg,
          color: /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : base.color,
          open: Boolean(item.open),
          openPanels: Array.isArray(item.openPanels) ? item.openPanels.filter(function (index) { return Number.isInteger(index) && index >= 0 && index < 8; }) : []
        };
      })
    };
    return safe;
  }

  document.getElementById("print-project").addEventListener("click", function () { window.print(); });
  document.getElementById("zoom-in").addEventListener("click", function () { zoom = clamp(zoom + 0.1, 0.6, 1.5); applyZoom(); });
  document.getElementById("zoom-out").addEventListener("click", function () { zoom = clamp(zoom - 0.1, 0.6, 1.5); applyZoom(); });
  document.getElementById("zoom-fit").addEventListener("click", function () { zoom = 1; applyZoom(); });

  document.addEventListener("keydown", function (event) {
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
    if (event.key === "Escape") {
      project.selectedId = null;
      selectElement(null);
    }
  });

  renderStage();
  renderInspector();
  persist();
  applyZoom();
})();