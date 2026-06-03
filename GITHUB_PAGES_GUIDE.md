# Mesh Gallery GitHub Pages Guide

This static page records mesh / texture results from this repository. It does not need a build step, so GitHub Pages can publish it directly.

## 1. Local Preview

Run this in the repository root:

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

Use paths relative to the repository root. `preview` should usually be a `.png` or `.jpg`. If `mesh` is `.glb` or `.gltf`, clicking the image opens a 3D preview. For `.obj`, the dialog shows the preview image and provides the mesh file link.

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

## 4. Publish With GitHub Pages

1. Commit `index.html`, `styles.css`, `app.js`, `data/results.js`, `.nojekyll`, and the referenced image / mesh assets.
2. Open the GitHub repository page.
3. Go to `Settings -> Pages`.
4. Set `Source` to `Deploy from a branch`.
5. Set `Branch` to `main` and the folder to `/root`.
6. Save and wait for GitHub Pages to deploy.

Use `/root` because the page references existing repository folders such as `input_images/`, `Meshy/`, `TRELLIS2/`, and `MaterialMVP/`.

## 5. Current Page Structure

- First column: case name
- `Input` column: source image and raw mesh
- Method columns: generated mesh / texture previews
- Image click: opens a larger image or `.glb/.gltf` 3D preview

