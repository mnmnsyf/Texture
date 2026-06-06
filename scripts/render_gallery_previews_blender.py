#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Render transparent-background gallery previews for all benchmark repo cases.

This script is intended to run inside Blender, for example:

    blender --background --python scripts/render_gallery_previews_blender.py

Or with optional filters:

    blender --background --python scripts/render_gallery_previews_blender.py -- --repo hunyuan --case transformer

Outputs are written to the exact preview image paths currently referenced by
`data/results.js`, so the generated PNGs can be used directly by the static site.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import math
from pathlib import Path
import sys
import traceback
from typing import Iterable, Sequence

import bpy
from mathutils import Vector


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_ROOT = SCRIPT_DIR.parent
REPO_IDS = ("meshy", "trellis2", "materialmvp", "hunyuan")
CASE_IDS = ("bicycle", "scissors", "stitcher", "telescope", "transformer")


@dataclass(frozen=True)
class RenderCase:
    repo_id: str
    case_id: str
    mesh_path: Path
    output_path: Path

    @property
    def label(self) -> str:
        return f"{self.repo_id}/{self.case_id}"


CASE_SPECS: tuple[tuple[str, str, str, str], ...] = (
    # Meshy
    ("meshy", "bicycle", "Meshy/Meshy_Bicycle_texture.glb", "Meshy/bicycle.png"),
    ("meshy", "scissors", "Meshy/Meshy_scissors_texture.glb", "Meshy/scissors.png"),
    ("meshy", "stitcher", "Meshy/Meshy_stitcher_texture.glb", "Meshy/stitcher.png"),
    ("meshy", "telescope", "Meshy/Meshy_telescope_texture.glb", "Meshy/telescope.png"),
    ("meshy", "transformer", "Meshy/Meshy_Transforner_texture.glb", "Meshy/transformer.png"),
    # TRELLIS2
    ("trellis2", "bicycle", "TRELLIS2/bicycle/bicycle_trellis_textured.glb", "TRELLIS2/TRELLIS2_bicycle.png"),
    ("trellis2", "scissors", "TRELLIS2/scissors/scissors_trellis_textured.glb", "TRELLIS2/TRELLIS2_scissors.png"),
    ("trellis2", "stitcher", "TRELLIS2/stitcher/stitcher_trellis_textured.glb", "TRELLIS2/TRELLIS2_stitcher.png"),
    ("trellis2", "telescope", "TRELLIS2/telescope/telescope_trellis_textured.glb", "TRELLIS2/TRELLIS2_telescope.png"),
    ("trellis2", "transformer", "TRELLIS2/transformer_texturing/merged/transformer_merged_textured.glb", "TRELLIS2/transformer_texturing/merged.png"),
    # MaterialMVP
    ("materialmvp", "bicycle", "MaterialMVP/bicycle/bicycle_textured.glb", "MaterialMVP/MVP_bicycle.png"),
    ("materialmvp", "scissors", "MaterialMVP/scissors/scissors_textured.glb", "MaterialMVP/MVP_scissors.png"),
    ("materialmvp", "stitcher", "MaterialMVP/stitcher/stitcher_textured.glb", "MaterialMVP/MVP_stitcher.png"),
    ("materialmvp", "telescope", "MaterialMVP/telescope/telescope_textured.glb", "MaterialMVP/MVP_telescope.png"),
    ("materialmvp", "transformer", "MaterialMVP/transformer_output/merged_output/merged_textured.glb", "MaterialMVP/transformer_output/merged_output.png"),
    # Hunyuan
    ("hunyuan", "bicycle", "Hunyuan/bicycle_texture_test/bicycle_textured.obj", "Hunyuan/Hunyuan_bicycle.png"),
    ("hunyuan", "scissors", "Hunyuan/scissors_texture_test/scissors_textured.obj", "Hunyuan/Hunyuan_scissors.png"),
    ("hunyuan", "stitcher", "Hunyuan/stitcher_texture_test/stitcher_textured.obj", "Hunyuan/Hunyuan_stitcher.png"),
    ("hunyuan", "telescope", "Hunyuan/telescope_texture_test/telescope_textured.obj", "Hunyuan/Hunyuan_telescope.png"),
    ("hunyuan", "transformer", "Hunyuan/transformer_texture_test/transformer_textured.obj", "Hunyuan/transformer_texture_test/hunyuan_result.png"),
)


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render transparent PNG previews for the gallery mesh outputs."
    )
    parser.add_argument(
        "--root",
        default=str(DEFAULT_ROOT),
        help="Repository root path. Defaults to the parent of the scripts directory.",
    )
    parser.add_argument(
        "--repo",
        action="append",
        choices=REPO_IDS,
        help="Render only the selected repo. Repeat to include multiple repos.",
    )
    parser.add_argument(
        "--case",
        dest="case_ids",
        action="append",
        choices=CASE_IDS,
        help="Render only the selected case. Repeat to include multiple cases.",
    )
    parser.add_argument(
        "--resolution",
        type=int,
        default=1024,
        help="Output width and height in pixels. Default: 1024.",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=64,
        help="Render samples for Eevee/Cycles. Default: 64.",
    )
    parser.add_argument(
        "--engine",
        choices=("auto", "eevee", "cycles"),
        default="auto",
        help="Render engine selection. Default: auto.",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip cases whose output PNG already exists.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the render plan without rendering.",
    )
    parser.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Continue rendering remaining cases if one case fails.",
    )
    return parser.parse_args(list(argv))


def extract_script_argv(argv: Sequence[str]) -> list[str]:
    if "--" not in argv:
        return []
    marker_index = argv.index("--")
    return list(argv[marker_index + 1 :])


def build_cases(root: Path) -> list[RenderCase]:
    return [
        RenderCase(
            repo_id=repo_id,
            case_id=case_id,
            mesh_path=root / mesh_rel_path,
            output_path=root / output_rel_path,
        )
        for repo_id, case_id, mesh_rel_path, output_rel_path in CASE_SPECS
    ]


def filter_cases(cases: Iterable[RenderCase], args: argparse.Namespace) -> list[RenderCase]:
    repo_filter = set(args.repo or [])
    case_filter = set(args.case_ids or [])

    selected: list[RenderCase] = []
    for render_case in cases:
        if repo_filter and render_case.repo_id not in repo_filter:
            continue
        if case_filter and render_case.case_id not in case_filter:
            continue
        selected.append(render_case)

    return selected


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    for collection in (
        bpy.data.meshes,
        bpy.data.materials,
        bpy.data.images,
        bpy.data.lights,
        bpy.data.cameras,
        bpy.data.armatures,
        bpy.data.actions,
        bpy.data.node_groups,
    ):
        for datablock in list(collection):
            if datablock.users == 0:
                collection.remove(datablock)


def import_mesh(mesh_path: Path) -> None:
    if not mesh_path.is_file():
        raise FileNotFoundError(f"Mesh file not found: {mesh_path}")

    suffix = mesh_path.suffix.lower()
    filepath = str(mesh_path)

    if suffix in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=filepath)
        return

    if suffix == ".obj":
        if hasattr(bpy.ops.wm, "obj_import"):
            bpy.ops.wm.obj_import(filepath=filepath)
            return
        if hasattr(bpy.ops.import_scene, "obj"):
            bpy.ops.import_scene.obj(filepath=filepath)
            return
        raise RuntimeError("OBJ importer is not available in this Blender build.")

    raise ValueError(f"Unsupported mesh format: {mesh_path}")


def get_mesh_objects() -> list[bpy.types.Object]:
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def get_root_objects(objects: Iterable[bpy.types.Object]) -> list[bpy.types.Object]:
    object_set = set(objects)
    roots: list[bpy.types.Object] = []
    for obj in objects:
        if obj.parent is None or obj.parent not in object_set:
            roots.append(obj)
    return roots


def compute_bounds(mesh_objects: Iterable[bpy.types.Object]) -> tuple[Vector, Vector]:
    min_corner = Vector((math.inf, math.inf, math.inf))
    max_corner = Vector((-math.inf, -math.inf, -math.inf))

    found = False
    for obj in mesh_objects:
        found = True
        for corner in obj.bound_box:
            world_corner = obj.matrix_world @ Vector(corner)
            min_corner.x = min(min_corner.x, world_corner.x)
            min_corner.y = min(min_corner.y, world_corner.y)
            min_corner.z = min(min_corner.z, world_corner.z)
            max_corner.x = max(max_corner.x, world_corner.x)
            max_corner.y = max(max_corner.y, world_corner.y)
            max_corner.z = max(max_corner.z, world_corner.z)

    if not found:
        raise RuntimeError("No mesh objects found after import.")

    return min_corner, max_corner


def center_imported_content(imported_objects: Iterable[bpy.types.Object]) -> tuple[Vector, float]:
    mesh_objects = get_mesh_objects()
    min_corner, max_corner = compute_bounds(mesh_objects)
    center = (min_corner + max_corner) / 2.0

    for obj in get_root_objects(imported_objects):
        obj.location = obj.location - center

    recentered_mesh_objects = get_mesh_objects()
    _, recentered_max = compute_bounds(recentered_mesh_objects)
    recentered_min, recentered_max = compute_bounds(recentered_mesh_objects)
    radius = 0.0
    for axis_center_sign in (
        Vector((recentered_min.x, recentered_min.y, recentered_min.z)),
        Vector((recentered_min.x, recentered_min.y, recentered_max.z)),
        Vector((recentered_min.x, recentered_max.y, recentered_min.z)),
        Vector((recentered_min.x, recentered_max.y, recentered_max.z)),
        Vector((recentered_max.x, recentered_min.y, recentered_min.z)),
        Vector((recentered_max.x, recentered_min.y, recentered_max.z)),
        Vector((recentered_max.x, recentered_max.y, recentered_min.z)),
        Vector((recentered_max.x, recentered_max.y, recentered_max.z)),
    ):
        radius = max(radius, axis_center_sign.length)

    return Vector((0.0, 0.0, 0.0)), max(radius, 0.5)


def configure_world() -> None:
    scene = bpy.context.scene
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True

    background = world.node_tree.nodes.get("Background")
    if background is None:
        background = world.node_tree.nodes.new(type="ShaderNodeBackground")

    background.inputs[0].default_value = (1.0, 1.0, 1.0, 1.0)
    background.inputs[1].default_value = 0.12


def select_engine(requested_engine: str) -> str:
    if requested_engine == "cycles":
        return "CYCLES"

    if requested_engine == "eevee":
        for engine_name in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
            try:
                bpy.context.scene.render.engine = engine_name
                return engine_name
            except TypeError:
                continue
        raise RuntimeError("Eevee is not available in this Blender build.")

    for engine_name in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
        try:
            bpy.context.scene.render.engine = engine_name
            return engine_name
        except TypeError:
            continue

    raise RuntimeError("No supported render engine found.")


def configure_render(args: argparse.Namespace, output_path: Path) -> str:
    scene = bpy.context.scene
    engine = select_engine(args.engine)
    scene.render.engine = engine
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.use_file_extension = True
    scene.render.resolution_x = args.resolution
    scene.render.resolution_y = args.resolution
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(output_path)

    if engine == "CYCLES":
        scene.cycles.samples = max(args.samples, 1)
        scene.cycles.use_denoising = True
    elif hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = max(args.samples, 1)

    return engine


def add_camera(target_location: Vector, radius: float) -> bpy.types.Object:
    scene = bpy.context.scene

    camera_data = bpy.data.cameras.new("RenderCamera")
    camera_data.lens = 55.0
    camera = bpy.data.objects.new("RenderCamera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera

    target = bpy.data.objects.new("RenderTarget", None)
    target.location = target_location
    scene.collection.objects.link(target)

    direction = Vector((1.8, -1.8, 1.25)).normalized()
    fov = min(camera_data.angle_x, camera_data.angle_y)
    distance = max((radius / math.tan(fov / 2.0)) * 1.15, 1.5)

    camera.location = target_location + direction * distance

    constraint = camera.constraints.new(type="TRACK_TO")
    constraint.target = target
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"

    return camera


def add_light_rig(radius: float) -> None:
    scene = bpy.context.scene
    distance = max(radius * 3.0, 4.0)

    def add_sun(name: str, energy: float, rotation_xyz: tuple[float, float, float]) -> None:
        light_data = bpy.data.lights.new(name=name, type="SUN")
        light_data.energy = energy
        light_object = bpy.data.objects.new(name=name, object_data=light_data)
        light_object.rotation_euler = rotation_xyz
        scene.collection.objects.link(light_object)

    add_sun(
        name="KeySun",
        energy=3.2,
        rotation_xyz=(math.radians(42.0), 0.0, math.radians(35.0)),
    )
    add_sun(
        name="FillSun",
        energy=1.2,
        rotation_xyz=(math.radians(55.0), 0.0, math.radians(-120.0)),
    )
    add_sun(
        name="RimSun",
        energy=0.9,
        rotation_xyz=(math.radians(120.0), 0.0, math.radians(160.0)),
    )

    top_light_data = bpy.data.lights.new(name="TopArea", type="AREA")
    top_light_data.energy = 1800.0
    top_light_data.shape = "DISK"
    top_light_data.size = max(radius * 2.0, 2.0)
    top_light = bpy.data.objects.new(name="TopArea", object_data=top_light_data)
    top_light.location = Vector((0.0, 0.0, distance))
    scene.collection.objects.link(top_light)


def render_case(render_case: RenderCase, args: argparse.Namespace) -> None:
    print(f"\n=== Rendering {render_case.label} ===")
    print(f"Mesh   : {render_case.mesh_path}")
    print(f"Output : {render_case.output_path}")

    clear_scene()
    import_mesh(render_case.mesh_path)

    imported_objects = list(bpy.context.scene.objects)
    if not imported_objects:
        raise RuntimeError(f"Import produced no objects: {render_case.mesh_path}")

    target_location, radius = center_imported_content(imported_objects)
    configure_world()
    engine = configure_render(args, render_case.output_path)
    add_camera(target_location, radius)
    add_light_rig(radius)

    render_case.output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(write_still=True)
    print(f"Rendered with {engine}: {render_case.output_path}")


def print_plan(cases: Iterable[RenderCase]) -> None:
    print("Render plan:")
    for render_case in cases:
        print(f"- {render_case.label}: {render_case.mesh_path} -> {render_case.output_path}")


def main(argv: Sequence[str]) -> int:
    args = parse_args(extract_script_argv(argv))
    root = Path(args.root).resolve()
    all_cases = build_cases(root)
    selected_cases = filter_cases(all_cases, args)

    if not selected_cases:
        print("No cases matched the requested filters.")
        return 1

    if args.skip_existing:
        selected_cases = [
            render_case
            for render_case in selected_cases
            if not render_case.output_path.is_file()
        ]
        if not selected_cases:
            print("All selected output PNGs already exist; nothing to do.")
            return 0

    print_plan(selected_cases)

    if args.dry_run:
        return 0

    failures: list[tuple[str, str]] = []
    for case_item in selected_cases:
        try:
            render_case(case_item, args)
        except Exception as exc:  # pragma: no cover - Blender runtime path
            failures.append((case_item.label, str(exc)))
            print(f"ERROR while rendering {case_item.label}: {exc}")
            traceback.print_exc()
            if not args.continue_on_error:
                break

    if failures:
        print("\nRender completed with failures:")
        for label, message in failures:
            print(f"- {label}: {message}")
        return 1

    print(f"\nRender completed successfully for {len(selected_cases)} case(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
