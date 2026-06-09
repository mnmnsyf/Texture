(function () {
  const data = window.GALLERY_DATA;

  const els = {
    title: document.querySelector("#page-title"),
    subtitle: document.querySelector("#page-subtitle"),
    stats: document.querySelector("#stats"),
    gallery: document.querySelector("#gallery"),
    dialog: document.querySelector("#asset-dialog"),
    dialogTitle: document.querySelector("#dialog-title"),
    dialogKicker: document.querySelector("#dialog-kicker"),
    dialogStage: document.querySelector("#dialog-stage"),
    dialogLinks: document.querySelector("#dialog-links"),
  };

  const icon = (name, className = "h-4 w-4") => `<i data-lucide="${name}" class="${className}" aria-hidden="true"></i>`;
  const MISSING_OUTPUT_PREVIEW = "assets/missing-output.svg";

  const WATERTIGHT_REASON_LABELS = {
    all_scene_geometries_closed_manifold: "Closed manifold",
    scene_contains_non_watertight_geometry: "Open boundaries detected",
    closed_manifold: "Closed manifold",
    has_boundary_edges: "Open boundaries detected",
    has_nonmanifold_edges: "Non-manifold edges detected",
    load_or_parse_error: "Could not evaluate mesh",
  };

  function isViewableMesh(path) {
    return /\.(glb|gltf)$/i.test(path || "");
  }

  function normalizeAssetPath(path) {
    return String(path || "").replace(/^\.\//, "").replace(/\\/g, "/");
  }

  function getWatertightInfo(cell) {
    if (!cell || !cell.mesh || !data.watertightness) {
      return null;
    }

    return data.watertightness[normalizeAssetPath(cell.mesh)] || null;
  }

  function renderWatertightBadge(info) {
    if (!info) return "";

    const toneClass = info.isWatertight ? "asset-badge-ok" : "asset-badge-bad";
    const iconName = info.isWatertight ? "shield-check" : "triangle-alert";

    return `
      <span class="asset-badge ${toneClass}" title="${info.label}">
        ${icon(iconName, "h-3.5 w-3.5")}
        <span>${info.label}</span>
      </span>
    `;
  }

  function renderWatertightSummary(cell) {
    const info = getWatertightInfo(cell);
    if (!info) return "";

    const secondaryParts = [];
    if (!info.isWatertight && Number.isFinite(info.boundaryEdges)) {
      secondaryParts.push(`${info.boundaryEdges} boundary edge${info.boundaryEdges === 1 ? "" : "s"}`);
    }
    if (!info.isWatertight && Number.isFinite(info.nonmanifoldEdges) && info.nonmanifoldEdges > 0) {
      secondaryParts.push(`${info.nonmanifoldEdges} non-manifold edge${info.nonmanifoldEdges === 1 ? "" : "s"}`);
    }
    if (Number.isFinite(info.componentCount) && info.componentCount > 1) {
      secondaryParts.push(`${info.componentCount} components`);
    }

    const detail = secondaryParts.join(" · ") || WATERTIGHT_REASON_LABELS[info.reason] || info.reason || info.label;

    return `
      <div class="asset-health-row">
        ${renderWatertightBadge(info)}
        <p class="asset-health-copy">${detail}</p>
      </div>
    `;
  }

  function countAssets(cases) {
    return cases.reduce((total, item) => {
      return total + Object.values(item.results || {}).filter(Boolean).length + (item.input ? 1 : 0);
    }, 0);
  }

  function renderStats() {
    const stats = [
      { value: data.cases.length, label: "Cases" },
      { value: data.methods.length, label: "Methods" },
      { value: countAssets(data.cases), label: "Assets" },
    ];

    els.stats.innerHTML = stats
      .map(
        (stat, index) => `
          <article class="stat-metric ${index > 0 ? "stat-divider" : ""}">
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
          </article>
        `,
      )
      .join("");
  }

  function assetLinks(cell) {
    const links = [
      cell.mesh && { href: cell.mesh, label: isViewableMesh(cell.mesh) ? "View mesh" : "Mesh file", iconName: "box" },
      cell.texture && { href: cell.texture, label: "Texture", iconName: "image" },
      cell.parts && { href: cell.parts, label: "Parts", iconName: "blocks" },
      cell.preview && { href: cell.preview, label: "Preview", iconName: "image-down" },
    ].filter(Boolean);

    return links
      .map(
        (link) => `
          <a
            href="${link.href}"
            target="_blank"
            rel="noreferrer"
            class="inline-flex items-center gap-2 rounded-full bg-neutral-200/80 px-3 py-2 text-sm font-medium text-[#1D1D1F] transition-all duration-300 ease-out hover:bg-neutral-300"
            title="${link.label}"
          >
            ${icon(link.iconName)}
            <span>${link.label}</span>
          </a>
        `,
      )
      .join("");
  }

  function renderPreviewButton(cell, item, methodId, label, size = "default") {
    const preview = cell.preview || cell.texture;
    const canOpen = preview || isViewableMesh(cell.mesh);
    return `
      <button
        class="asset-trigger asset-viewport group/image relative block w-full overflow-hidden rounded-2xl bg-neutral-100 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-neutral-200/70 focus:outline-none focus:ring-4 focus:ring-neutral-300/60 ${size === "input" ? "asset-viewport-input" : ""}"
        type="button"
        data-case="${item.id}"
        data-method="${methodId}"
        ${canOpen ? "" : "disabled"}
        title="${label} preview"
      >
        <img
          class="h-full w-full object-contain p-6 transition-all duration-300 ease-out group-hover/image:scale-[1.012]"
          src="${preview}"
          alt="${item.name} ${label}"
          loading="lazy"
        />
        <span class="pointer-events-none absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-700 opacity-0 shadow-sm ring-1 ring-neutral-200/80 backdrop-blur transition-all duration-300 ease-out group-hover/image:opacity-100">
          ${icon("maximize-2", "h-3.5 w-3.5")}
        </span>
      </button>
    `;
  }

  function renderInputCard(item) {
    return `
      <article class="asset-card input-card min-w-0 overflow-hidden rounded-[1.35rem] bg-white p-3 ring-1 ring-neutral-200/70">
        <div class="asset-card-header">
          <div class="min-w-0">
            <p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#86868B]">Input Source</p>
            <h3 class="mt-1 truncate text-base font-semibold tracking-[-0.02em] text-[#1D1D1F]">${item.name}</h3>
          </div>
          <span class="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
            source
          </span>
        </div>
        ${renderWatertightSummary(item.input)}
        ${renderPreviewButton(item.input, item, "input", "Input", "input")}
      </article>
    `;
  }

  function renderMethodCard(item, method) {
    const cell = item.results ? item.results[method.id] : null;

    if (!cell) {
      return `
        <article class="asset-card flex min-h-72 min-w-0 flex-col overflow-hidden rounded-[1.35rem] bg-white p-3 ring-1 ring-neutral-200/70">
          <div class="asset-card-header">
            <h3 class="min-w-0 truncate text-base font-semibold tracking-[-0.02em] text-[#1D1D1F]">${method.name}</h3>
            <span class="max-w-full shrink-0 truncate rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">${method.tag}</span>
          </div>
          <div class="asset-viewport missing-output-viewport overflow-hidden rounded-2xl bg-neutral-100">
            <img
              class="h-full w-full object-cover"
              src="${MISSING_OUTPUT_PREVIEW}"
              alt="${method.name} missing output placeholder"
              loading="lazy"
            />
          </div>
        </article>
      `;
    }

    const partCount = typeof cell.partCount === "number" ? cell.partCount : null;
    const partLabel = partCount === null ? "Generated output" : `${partCount} part${partCount === 1 ? "" : "s"}`;

    return `
      <article class="asset-card min-w-0 overflow-hidden rounded-[1.35rem] bg-white p-3 ring-1 ring-neutral-200/70 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:ring-neutral-300">
        <div class="asset-card-header">
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold tracking-[-0.02em] text-[#1D1D1F]">${method.name}</h3>
            <p class="mt-0.5 text-sm text-[#86868B]">${partLabel}</p>
          </div>
          <span class="max-w-full shrink-0 truncate rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 sm:max-w-[50%]">
            ${method.tag}
          </span>
        </div>
        ${renderWatertightSummary(cell)}
        ${renderPreviewButton(cell, item, method.id, method.name)}
      </article>
    `;
  }

  function renderCaseBlock(item, index) {
    const methodCards = data.methods.map((method) => renderMethodCard(item, method)).join("");

    return `
      <section class="case-row min-w-0 overflow-hidden rounded-[2rem] bg-white/70 ring-1 ring-neutral-200/60 backdrop-blur-sm" style="--delay: ${index * 50}ms">
        <div class="case-layout">
          <aside class="case-label">
            <p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#86868B]">Case</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#1D1D1F]">${item.name}</h2>
          </aside>
          <div class="asset-strip">
            ${renderInputCard(item)}
            <div class="method-strip">
              ${methodCards}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderGallery() {
    els.title.textContent = data.title;
    els.subtitle.textContent = data.subtitle;
    renderStats();
    els.gallery.innerHTML = data.cases.map(renderCaseBlock).join("");
    refreshIcons();
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function findCell(caseId, methodId) {
    const item = data.cases.find((entry) => entry.id === caseId);
    if (!item) return null;
    const method = methodId === "input" ? null : data.methods.find((entry) => entry.id === methodId);
    const cell = methodId === "input" ? item.input : item.results && item.results[methodId];
    return cell ? { item, method, cell } : null;
  }

  function openDialog(caseId, methodId) {
    const found = findCell(caseId, methodId);
    if (!found) return;

    const { item, method, cell } = found;
    const name = method ? method.name : "Input Source";
    els.dialogTitle.textContent = `${item.name} / ${name}`;
    els.dialogKicker.textContent = method ? method.tag : "source";
    els.dialogLinks.innerHTML = assetLinks(cell);

    if (isViewableMesh(cell.mesh)) {
      els.dialogStage.innerHTML = `
        <model-viewer
          class="h-[70vh] w-full"
          src="${cell.mesh}"
          poster="${cell.preview || ""}"
          camera-controls
          auto-rotate
          shadow-intensity="0.8"
          exposure="0.9"
          environment-image="neutral"
          alt="${item.name} ${name} mesh">
        </model-viewer>
      `;
    } else {
      els.dialogStage.innerHTML = `<img class="max-h-[70vh] w-full object-contain p-8" src="${cell.preview || cell.texture}" alt="${item.name} ${name}" />`;
    }

    els.dialog.showModal();
    refreshIcons();
  }

  function bindEvents() {
    els.gallery.addEventListener("click", (event) => {
      const button = event.target.closest(".asset-trigger");
      if (!button || button.disabled) return;
      openDialog(button.dataset.case, button.dataset.method);
    });

    els.dialog.addEventListener("click", (event) => {
      if (event.target === els.dialog) {
        els.dialog.close();
      }
    });
  }

  function init() {
    renderGallery();
    bindEvents();
    refreshIcons();
    document.addEventListener("DOMContentLoaded", refreshIcons);
    window.addEventListener("load", refreshIcons);
  }

  init();
})();
