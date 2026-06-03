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

  function isViewableMesh(path) {
    return /\.(glb|gltf)$/i.test(path || "");
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
          <div class="grid flex-1 place-items-center rounded-2xl bg-neutral-100 text-xs font-semibold uppercase tracking-[0.18em] text-[#86868B]">Missing</div>
        </article>
      `;
    }

    return `
      <article class="asset-card min-w-0 overflow-hidden rounded-[1.35rem] bg-white p-3 ring-1 ring-neutral-200/70 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:ring-neutral-300">
        <div class="asset-card-header">
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold tracking-[-0.02em] text-[#1D1D1F]">${method.name}</h3>
            <p class="mt-0.5 text-sm text-[#86868B]">Generated output</p>
          </div>
          <span class="max-w-full shrink-0 truncate rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 sm:max-w-[50%]">
            ${method.tag}
          </span>
        </div>
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
