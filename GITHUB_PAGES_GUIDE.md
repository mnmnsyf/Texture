# Mesh Gallery GitHub Pages Guide

This repository is maintained as a static GitHub Pages gallery. It has no build step, so Pages can publish the repository root directly.

## 0. Layout Rules

Keep the active root layout focused on the gallery only:

- site files: `index.html`, `styles.css`, `app.js`, `data/results.js`
- gallery assets referenced by `data/results.js`
- supporting folders such as `input_images/`, `Meshy/`, `TRELLIS2/`, `MaterialMVP/`, `Hunyuan/`, `Test_Model/`

Keep large local-only materials out of the active root set:

- `archive/`: Blender backups, old environments, local-only archives
- `raw/experimental/`: large experiment outputs not shown in the gallery

These folders are ignored by Git and should stay unpublished.

## 1. Local Preview

Run a simple HTTP server from the repository root:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8000/
```

Main files:

- `index.html`: page structure
- `styles.css`: visual style
- `app.js`: gallery rendering and preview dialog
- `data/results.js`: gallery data

There is no bundler, build command, or asset pipeline.

## 2. Add A New Case

Open `data/results.js` and add an item to the `cases` array:

```js
{
  id: "new_case",
  name: "New Case",
  category: "Object",
  input: {
    preview: "input_images/new_case.png",
    mesh: "Test_Model/new_case/raw_geometry.glb",
  },
  results: {
    meshy: {
      preview: "Meshy/new_case.png",
      mesh: "Meshy/new_case_texture.glb",
      status: "ready",
    },
  },
}
```

Use paths relative to the repository root.

- `preview` should usually be a `.png` or `.jpg`
- if `mesh` is `.glb` or `.gltf`, clicking the image opens a 3D preview
- for `.obj`, the dialog shows the preview image and provides the mesh file link

Before adding a case, confirm that its files belong in the published gallery. If they are only intermediate or exploratory outputs, store them under `raw/experimental/` instead.

## 3. Add A New Method

Add a method to the `methods` array:

```js
{
  id: "new_method",
  name: "New Method",
  tag: "textured mesh",
}
```

Then add matching results under each case:

```js
new_method: {
  preview: "NewMethod/bicycle.png",
  mesh: "NewMethod/bicycle.glb",
  status: "ready",
}
```

If a case has no result for a method, leave that method out. The page will show `Missing`.

If a method generates a large number of raw or alternate outputs, keep only the published subset in the active method folder and move the rest to `raw/experimental/`.

## 4. Keep The Repo Clean

Use these rules when reorganizing files:

- keep only one active virtual environment in the repo root: `.venv/`
- move extra environments to `archive/python-env/` or delete them
- move Blender working files and `.blend1` backups to `archive/blender/`
- move non-gallery experiment directories to `raw/experimental/`
- if an asset is not referenced by `data/results.js`, it usually should not stay in the active root layout

## 5. Publish With GitHub Pages

1. Commit `README.md`, `index.html`, `styles.css`, `app.js`, `data/results.js`, `.nojekyll`, and the referenced image / mesh assets.
2. Open the GitHub repository page.
3. Go to `Settings -> Pages`.
4. Set `Source` to `Deploy from a branch`.
5. Set `Branch` to `main` and the folder to `/root`.
6. Save and wait for GitHub Pages to deploy.

Use `/root` because the page references existing repository folders such as `input_images/`, `Meshy/`, `TRELLIS2/`, and `MaterialMVP/`.

## 6. Current Page Structure

- First column: case name
- `Input` column: source image and raw mesh
- Method columns: generated mesh / texture previews
- Image click: opens a larger image or `.glb/.gltf` 3D preview

