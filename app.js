(function () {
  const data = window.GALLERY_DATA;

  const els = {
    title: document.querySelector("#page-title"),
    subtitle: document.querySelector("#page-subtitle"),
    caseCount: document.querySelector("#case-count"),
    methodCount: document.querySelector("#method-count"),
    assetCount: document.querySelector("#asset-count"),
    table: document.querySelector("#gallery-table"),
    dialog: document.querySelector("#asset-dialog"),
    dialogTitle: document.querySelector("#dialog-title"),
    dialogKicker: document.querySelector("#dialog-kicker"),
    dialogStage: document.querySelector("#dialog-stage"),
    dialogLinks: document.querySelector("#dialog-links"),
  };

  const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;

  function isViewableMesh(path) {
    return /\.(glb|gltf)$/i.test(path || "");
  }

  function countAssets(cases) {
    return cases.reduce((total, item) => {
      return total + Object.values(item.results || {}).filter(Boolean).length + (item.input ? 1 : 0);
    }, 0);
  }

  function renderSummary(cases) {
    els.title.textContent = data.title;
    els.subtitle.textContent = data.subtitle;
    els.caseCount.textContent = cases.length;
    els.methodCount.textContent = data.methods.length;
    els.assetCount.textContent = countAssets(cases);
  }

  function assetLinks(cell) {
    const links = [
      cell.mesh && { href: cell.mesh, label: isViewableMesh(cell.mesh) ? "View mesh" : "Mesh file", icon: "box" },
      cell.texture && { href: cell.texture, label: "Texture", icon: "image" },
      cell.parts && { href: cell.parts, label: "Parts", icon: "blocks" },
      cell.preview && { href: cell.preview, label: "Preview", icon: "image-down" },
    ].filter(Boolean);

    return links
      .map(
        (link) => `
          <a href="${link.href}" target="_blank" rel="noreferrer" title="${link.label}">
            ${icon(link.icon)}
            <span>${link.label}</span>
          </a>
        `,
      )
      .join("");
  }

  function renderAssetCard(cell, item, method) {
    const preview = cell.preview || cell.texture;
    const methodName = method ? method.name : "Input";
    const canOpen = preview || isViewableMesh(cell.mesh);

    return `
      <div class="asset-card">
        <button class="asset-button" type="button" data-case="${item.id}" data-method="${method ? method.id : "input"}" ${
          canOpen ? "" : "disabled"
        } title="${methodName} preview">
          <img class="asset-preview" src="${preview}" alt="${item.name} ${methodName}" loading="lazy" />
        </button>
      </div>
    `;
  }

  function renderMissing() {
    return `<div class="missing-cell">Missing</div>`;
  }

  function renderTable() {
    const methods = data.methods;
    const cases = data.cases;
    renderSummary(cases);

    els.table.style.setProperty("--visible-method-count", methods.length + 1);

    const headers = [
      `<div class="header-cell corner-cell">Case</div>`,
      `<div class="header-cell"><span>Input</span><small>source</small></div>`,
      ...methods.map(
        (method) => `
          <div class="header-cell">
            <span>${method.name}</span>
            <small>${method.tag}</small>
          </div>
        `,
      ),
    ];

    const rows = cases.flatMap((item) => {
      const row = [
        `
          <div class="case-cell">
            <div class="case-pill">
              <strong>${item.name}</strong>
            </div>
          </div>
        `,
        `<div class="result-cell">${renderAssetCard(item.input, item, null)}</div>`,
      ];

      methods.forEach((method) => {
        const cell = item.results ? item.results[method.id] : null;
        row.push(`<div class="result-cell">${cell ? renderAssetCard(cell, item, method) : renderMissing()}</div>`);
      });

      return row;
    });

    els.table.innerHTML = headers.concat(rows).join("");
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
    const name = method ? method.name : "Input";
    els.dialogTitle.textContent = `${item.name} / ${name}`;
    els.dialogKicker.textContent = name;
    els.dialogLinks.innerHTML = assetLinks(cell);

    if (isViewableMesh(cell.mesh)) {
      els.dialogStage.innerHTML = `
        <model-viewer
          src="${cell.mesh}"
          poster="${cell.preview || ""}"
          camera-controls
          auto-rotate
          shadow-intensity="0.7"
          exposure="0.9"
          environment-image="neutral"
          alt="${item.name} ${name} mesh">
        </model-viewer>
      `;
    } else {
      els.dialogStage.innerHTML = `<img src="${cell.preview || cell.texture}" alt="${item.name} ${name}" />`;
    }

    els.dialog.showModal();
    refreshIcons();
  }

  function bindEvents() {
    els.table.addEventListener("click", (event) => {
      const button = event.target.closest(".asset-button");
      if (!button || button.disabled) return;
      openDialog(button.dataset.case, button.dataset.method);
    });
  }

  function init() {
    renderTable();
    bindEvents();
    refreshIcons();
    document.addEventListener("DOMContentLoaded", refreshIcons);
    window.addEventListener("load", refreshIcons);
  }

  init();
})();
