# Texture Benchmark Gallery

Static GitHub Pages gallery for comparing mesh and texture outputs in this repository.

## What this repo keeps at the root

Only the gallery app and the assets referenced by `data/results.js` should stay in the active root layout:

- `index.html`
- `styles.css`
- `app.js`
- `data/results.js`
- referenced preview images and mesh assets under folders such as `input_images/`, `Meshy/`, `TRELLIS2/`, `MaterialMVP/`, `Hunyuan/`, `Test_Model/`

## Repository layout

```text
.
├─ index.html              # static page entry
├─ styles.css              # page styling
├─ app.js                  # gallery UI logic
├─ data/results.js         # gallery dataset
├─ assets/                 # site preview assets
├─ input_images/           # source renders for each case
├─ Meshy/                  # Meshy assets used by gallery
├─ TRELLIS2/               # TRELLIS2 assets used by gallery
├─ MaterialMVP/            # MaterialMVP assets used by gallery
├─ Hunyuan/                # Hunyuan assets used by gallery
├─ Test_Model/             # input meshes referenced by gallery
├─ archive/                # local-only archived assets, ignored by git
│  ├─ blender/
│  └─ python-env/
└─ raw/                    # local-only experimental outputs, ignored by git
   └─ experimental/
```

## Local-only folders

These folders are intentionally **not** part of the published gallery:

- `archive/`: large local backups, Blender files, old virtual environments
- `raw/experimental/`: experimental outputs not referenced by the gallery

Both are ignored by Git.

## Python environment

Keep only one working local environment at the repo root:

- active environment: `.venv/`

Extra environments should be deleted or moved under `archive/python-env/`.

## Update the gallery

1. Put the new preview image / mesh files in the correct method folder.
2. Add or update the matching entry in `data/results.js`.
3. Make sure every referenced path is relative to the repository root.
4. Preview locally before committing.

## Local preview

Because this is a static site, no build step is required. Serve the repo root with a simple local HTTP server and open the shown local address in a browser.

## Publishing notes

- GitHub Pages can publish directly from the repository root.
- `.gitignore` is whitelist-based: only the site files and referenced assets should be tracked.
- If an asset is not used by `data/results.js`, it should usually live in `raw/experimental/` or `archive/` instead of the active root layout.

For a Pages-specific workflow, see `GITHUB_PAGES_GUIDE.md`.
