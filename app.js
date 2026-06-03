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
      { value: data.cases.length, label: "Cases", iconName: "layers-3" },
      { value: data.methods.length, label: "Methods", iconName: "workflow" },
      { value: countAssets(data.cases), label: "Assets", iconName: "box" },
    ];

    els.stats.innerHTML = stats
      .map(
        (stat) => `
          <article class="group rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-glow backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/[0.1]">
            <div class="mb-3 flex items-center justify-between">
              <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20">
                ${icon(stat.iconName)}
              </span>
              <span class="h-1.5 w-1.5 rounded-full bg-cyan-300/80 shadow-[0_0_16px_rgba(34,211,238,0.9)]"></span>
            </div>
            <div class="text-3xl font-black tracking-tight text-white">${stat.value}</div>
            <div class="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">${stat.label}</div>
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
            class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-white"
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
    const heightClass = size === "input" ? "h-56 lg:h-52" : "h-52";

    return `
      <button
        class="asset-trigger group/image relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 ${heightClass} transition duration-300 hover:border-cyan-300/45 hover:shadow-[0_24px_70px_rgba(34,211,238,0.16)] focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
        type="button"
        data-case="${item.id}"
        data-method="${methodId}"
        ${canOpen ? "" : "disabled"}
        title="${label} preview"
      >
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_70%)]"></div>
        <img
          class="relative h-full w-full object-contain p-5 transition duration-500 group-hover/image:scale-[1.035]"
          src="${preview}"
          alt="${item.name} ${label}"
          loading="lazy"
        />
        <span class="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-slate-200 opacity-0 shadow-lg backdrop-blur transition duration-300 group-hover/image:opacity-100">
          ${icon("maximize-2")}
        </span>
      </button>
    `;
  }

  function renderInputCard(item) {
    return `
      <article class="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl lg:col-span-3">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Input Source</p>
            <h3 class="mt-1 text-lg font-bold text-white">${item.name}</h3>
          </div>
          <span class="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
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
        <article class="flex min-h-72 min-w-0 flex-col overflow-hidden rounded-3xl border border-dashed border-white/10 bg-white/[0.035] p-4 text-slate-500">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="min-w-0 truncate text-lg font-bold text-slate-400">${method.name}</h3>
            <span class="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold">${method.tag}</span>
          </div>
          <div class="grid flex-1 place-items-center rounded-2xl bg-slate-900/50 text-sm font-bold uppercase tracking-[0.2em]">Missing</div>
        </article>
      `;
    }

    return `
      <article class="method-card min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.075] hover:shadow-[0_26px_80px_rgba(15,23,42,0.45)]">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-lg font-bold text-white">${method.name}</h3>
            <p class="mt-1 text-sm text-slate-400">Generated output</p>
          </div>
          <span class="max-w-[48%] shrink-0 truncate rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-100">
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
      <section class="case-block overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-5 lg:p-6" style="--delay: ${index * 70}ms">
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Benchmark Case</p>
            <h2 class="mt-1 text-3xl font-black tracking-tight text-white">${item.name}</h2>
          </div>
          <div class="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-semibold text-cyan-100">
            ${icon("scan-search")}
            <span>${data.methods.length} methods compared</span>
          </div>
        </div>
        <div class="grid gap-4 lg:grid-cols-15">
          ${renderInputCard(item)}
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:col-span-12">
            ${methodCards}
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
      els.dialogStage.innerHTML = `<img class="max-h-[70vh] w-full object-contain p-6" src="${cell.preview || cell.texture}" alt="${item.name} ${name}" />`;
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
