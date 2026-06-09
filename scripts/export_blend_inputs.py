#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Export downloaded Blender inputs to GLB and render input thumbnails.

Run inside Blender, for example:

    blender --background --python scripts/export_blend_inputs.py
"""

from __future__ import annotations

from argparse import Namespace
from dataclasses import dataclass
import json
import math
from pathlib import Path
import struct
import sys
import traceback
from typing import Sequence

import bpy
from mathutils import Vector

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_ROOT = SCRIPT_DIR.parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from render_gallery_previews_blender import (
    add_light_rig,
    clear_scene,
    compute_bounds,
    configure_render,
    configure_world,
    get_mesh_objects,
    get_root_objects,
    import_mesh,
)


@dataclass(frozen=True)
class BlendInput:
    case_id: str
    blend_rel_path: str
    glb_rel_path: str
    preview_rel_path: str

    @property
    def label(self) -> str:
        return self.case_id


INPUT_SPECS: tuple[BlendInput, ...] = (
    BlendInput(
        case_id="cross_pein_hammer",
        blend_rel_path="Test_Model/cross_pein_hammer_4k.blend/cross_pein_hammer_4k.blend",
        glb_rel_path="Test_Model/cross_pein_hammer_4k.blend/raw_geometry.glb",
        preview_rel_path="input_images/cross_pein_hammer.png",
    ),
    BlendInput(
        case_id="multi_cleaner_5_litre",
        blend_rel_path="Test_Model/multi_cleaner_5_litre_4k.blend/multi_cleaner_5_litre_4k.blend",
        glb_rel_path="Test_Model/multi_cleaner_5_litre_4k.blend/raw_geometry.glb",
        preview_rel_path="input_images/multi_cleaner_5_litre.png",
    ),
    BlendInput(
        case_id="carved_wooden_plate",
        blend_rel_path="Test_Model/carved_wooden_plate_4k.blend/carved_wooden_plate_4k.blend",
        glb_rel_path="Test_Model/carved_wooden_plate_4k.blend/raw_geometry.glb",
        preview_rel_path="input_images/carved_wooden_plate.png",
    ),
    BlendInput(
        case_id="alarm_clock_01",
        blend_rel_path="Test_Model/alarm_clock_01_4k.blend/alarm_clock_01_4k.blend",
        glb_rel_path="Test_Model/alarm_clock_01_4k.blend/raw_geometry.glb",
        preview_rel_path="input_images/alarm_clock_01.png",
    ),
    BlendInput(
        case_id="green_chair_01",
        blend_rel_path="Test_Model/GreenChair_01_4k.blend/GreenChair_01_4k.blend",
        glb_rel_path="Test_Model/GreenChair_01_4k.blend/raw_geometry.glb",
        preview_rel_path="input_images/green_chair_01.png",
    ),
)


def remove_export_helper_objects() -> None:
    helper_prefixes = ("wdg_", "wgt-", "wgt_")
    for obj in list(bpy.context.scene.objects):
        object_name = obj.name.lower()
        data_name = getattr(obj.data, "name", "").lower() if obj.data else ""
        if object_name.startswith(helper_prefixes) or data_name.startswith(helper_prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def get_principled_bsdf(material: bpy.types.Material) -> bpy.types.Node | None:
    if not material.use_nodes:
        return None

    return next(
        (node for node in material.node_tree.nodes if node.bl_idname == "ShaderNodeBsdfPrincipled"),
        None,
    )


def unlink_principled_input(material: bpy.types.Material, socket_name: str) -> None:
    bsdf = get_principled_bsdf(material)
    if bsdf is None:
        return

    socket = bsdf.inputs.get(socket_name)
    if socket is None:
        return

    for link in list(socket.links):
        material.node_tree.links.remove(link)


def set_principled_default(material: bpy.types.Material, socket_name: str, value) -> None:
    bsdf = get_principled_bsdf(material)
    if bsdf is None or socket_name not in bsdf.inputs:
        return

    bsdf.inputs[socket_name].default_value = value


def set_first_existing_principled_default(
    material: bpy.types.Material, socket_names: tuple[str, ...], value
) -> None:
    bsdf = get_principled_bsdf(material)
    if bsdf is None:
        return

    for socket_name in socket_names:
        if socket_name in bsdf.inputs:
            bsdf.inputs[socket_name].default_value = value
            return


def repair_alarm_clock_materials() -> None:
    for obj in list(bpy.context.scene.objects):
        if obj.type == "MESH" and "glass" in obj.name.lower():
            bpy.data.objects.remove(obj, do_unlink=True)

    for image in bpy.data.images:
        image_name = image.name.lower()
        if "diff" in image_name:
            image.colorspace_settings.name = "sRGB"
        elif any(marker in image_name for marker in ("metal", "rough", "nor", "normal")):
            image.colorspace_settings.name = "Non-Color"

    for material in bpy.data.materials:
        material_name = material.name.lower()
        if not material_name.startswith("alarm_clock_01"):
            continue

        # The source PBR side maps make the exported GLB render with a magenta
        # cast in browser/preview viewers, so keep the diffuse texture as the
        # authoritative visible material for this benchmark input.
        unlink_principled_input(material, "Metallic")
        unlink_principled_input(material, "Roughness")
        unlink_principled_input(material, "Normal")
        set_principled_default(material, "Metallic", 0.0)
        set_principled_default(material, "Roughness", 0.58)

        if "glass" in material_name:
            material.blend_method = "BLEND"
            if hasattr(material, "use_screen_refraction"):
                material.use_screen_refraction = True
            set_principled_default(material, "Base Color", (1.0, 1.0, 1.0, 0.08))
            set_principled_default(material, "Alpha", 0.08)
            set_principled_default(material, "Roughness", 0.05)
            set_first_existing_principled_default(
                material,
                ("Coat Weight", "Clearcoat", "Clearcoat Weight"),
                0.0,
            )
            set_first_existing_principled_default(
                material,
                ("Specular IOR Level", "Specular", "Specular Tint"),
                0.4,
            )


def repair_materials_for_input(item: BlendInput) -> None:
    if item.case_id == "alarm_clock_01":
        repair_alarm_clock_materials()


def export_glb(output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    operator_props = {
        prop.identifier
        for prop in bpy.ops.export_scene.gltf.get_rna_type().properties
    }
    requested_options = {
        "filepath": str(output_path),
        "export_format": "GLB",
        "export_animations": False,
        "export_materials": "EXPORT",
        "export_image_format": "AUTO",
        "export_yup": True,
        "use_visible": True,
        "use_renderable": True,
    }
    options = {
        key: value
        for key, value in requested_options.items()
        if key in operator_props
    }
    bpy.ops.export_scene.gltf(**options)


def mark_glb_materials_unlit(glb_path: Path) -> None:
    data = glb_path.read_bytes()
    magic, version, _ = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF":
        raise ValueError(f"Not a GLB file: {glb_path}")

    offset = 12
    chunks: list[tuple[int, bytes]] = []
    while offset < len(data):
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunks.append((chunk_type, data[offset : offset + chunk_length]))
        offset += chunk_length

    json_index = next(index for index, (chunk_type, _) in enumerate(chunks) if chunk_type == 0x4E4F534A)
    gltf = json.loads(chunks[json_index][1].rstrip(b" \0").decode("utf-8"))

    for material in gltf.get("materials", []):
        material.setdefault("extensions", {})["KHR_materials_unlit"] = {}

    extensions_used = gltf.setdefault("extensionsUsed", [])
    if "KHR_materials_unlit" not in extensions_used:
        extensions_used.append("KHR_materials_unlit")

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
    chunks[json_index] = (0x4E4F534A, json_bytes)

    body = bytearray()
    for chunk_type, chunk_data in chunks:
        body.extend(struct.pack("<II", len(chunk_data), chunk_type))
        body.extend(chunk_data)

    header = struct.pack("<4sII", magic, version, 12 + len(body))
    glb_path.write_bytes(header + body)


def make_preview_materials_unlit() -> None:
    for material in bpy.data.materials:
        if not material.use_nodes:
            continue

        source_image = None
        for node in material.node_tree.nodes:
            if node.bl_idname == "ShaderNodeTexImage" and node.image:
                source_image = node.image
                if "diff" in source_image.name.lower():
                    break

        if source_image is None:
            continue

        nodes = material.node_tree.nodes
        links = material.node_tree.links
        nodes.clear()

        output = nodes.new(type="ShaderNodeOutputMaterial")
        emission = nodes.new(type="ShaderNodeEmission")
        texture = nodes.new(type="ShaderNodeTexImage")
        texture.image = source_image
        texture.image.colorspace_settings.name = "sRGB"
        emission.inputs["Strength"].default_value = 1.0

        links.new(texture.outputs["Color"], emission.inputs["Color"])
        links.new(emission.outputs["Emission"], output.inputs["Surface"])


def get_preview_mesh_objects() -> list[bpy.types.Object]:
    return [
        obj
        for obj in get_mesh_objects()
        if obj.visible_get() and not obj.hide_render
    ]


def center_preview_content(scene_objects: list[bpy.types.Object]) -> tuple[Vector, float]:
    mesh_objects = get_preview_mesh_objects()
    min_corner, max_corner = compute_bounds(mesh_objects)
    center = (min_corner + max_corner) / 2.0

    for obj in get_root_objects(scene_objects):
        obj.location = obj.location - center

    recentered_min, recentered_max = compute_bounds(get_preview_mesh_objects())
    radius = 0.0
    for corner in (
        Vector((recentered_min.x, recentered_min.y, recentered_min.z)),
        Vector((recentered_min.x, recentered_min.y, recentered_max.z)),
        Vector((recentered_min.x, recentered_max.y, recentered_min.z)),
        Vector((recentered_min.x, recentered_max.y, recentered_max.z)),
        Vector((recentered_max.x, recentered_min.y, recentered_min.z)),
        Vector((recentered_max.x, recentered_min.y, recentered_max.z)),
        Vector((recentered_max.x, recentered_max.y, recentered_min.z)),
        Vector((recentered_max.x, recentered_max.y, recentered_max.z)),
    ):
        radius = max(radius, corner.length)

    return Vector((0.0, 0.0, 0.0)), max(radius, 0.02)


def add_preview_camera(target_location: Vector, radius: float) -> bpy.types.Object:
    scene = bpy.context.scene

    camera_data = bpy.data.cameras.new("RenderCamera")
    camera_data.lens = 55.0
    camera_data.clip_start = 0.001
    camera_data.clip_end = max(radius * 100.0, 10.0)
    camera = bpy.data.objects.new("RenderCamera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera

    target = bpy.data.objects.new("RenderTarget", None)
    target.location = target_location
    scene.collection.objects.link(target)

    direction = Vector((1.8, -1.8, 1.25)).normalized()
    fov = min(camera_data.angle_x, camera_data.angle_y)
    distance = max((radius / math.tan(fov / 2.0)) * 1.18, radius * 2.4, 0.08)

    camera.location = target_location + direction * distance

    constraint = camera.constraints.new(type="TRACK_TO")
    constraint.target = target
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"

    return camera


def render_preview(output_path: Path, resolution: int, samples: int) -> None:
    mesh_objects = get_preview_mesh_objects()
    if not mesh_objects:
        raise RuntimeError("No mesh objects found in the opened .blend file.")

    all_objects = list(bpy.context.scene.objects)
    target_location, radius = center_preview_content(all_objects)

    args = Namespace(resolution=resolution, samples=samples, engine="auto")
    configure_world()
    configure_render(args, output_path)
    add_preview_camera(target_location, radius)
    add_light_rig(radius)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(write_still=True)


def process_input(root: Path, item: BlendInput, resolution: int, samples: int) -> None:
    blend_path = root / item.blend_rel_path
    glb_path = root / item.glb_rel_path
    preview_path = root / item.preview_rel_path

    if not blend_path.is_file():
        raise FileNotFoundError(f"Blend file not found: {blend_path}")

    print(f"\n=== Processing {item.label} ===")
    print(f"Blend  : {blend_path}")
    print(f"GLB    : {glb_path}")
    print(f"Preview: {preview_path}")

    bpy.ops.wm.open_mainfile(filepath=str(blend_path))
    remove_export_helper_objects()
    repair_materials_for_input(item)
    export_glb(glb_path)
    if item.case_id == "alarm_clock_01":
        mark_glb_materials_unlit(glb_path)
    print(f"Exported GLB: {glb_path}")

    clear_scene()
    import_mesh(glb_path)
    if item.case_id == "alarm_clock_01":
        make_preview_materials_unlit()
    render_preview(preview_path, resolution=resolution, samples=samples)
    print(f"Rendered preview: {preview_path}")


def extract_script_argv(argv: Sequence[str]) -> list[str]:
    if "--" not in argv:
        return []
    marker_index = argv.index("--")
    return list(argv[marker_index + 1 :])


def parse_args(argv: Sequence[str]) -> Namespace:
    import argparse

    parser = argparse.ArgumentParser(description="Export input .blend files to GLB.")
    parser.add_argument(
        "--root",
        default=str(DEFAULT_ROOT),
        help="Repository root path. Defaults to the parent of the scripts directory.",
    )
    parser.add_argument(
        "--case",
        dest="case_ids",
        action="append",
        choices=[item.case_id for item in INPUT_SPECS],
        help="Process only the selected case. Repeat to include multiple cases.",
    )
    parser.add_argument(
        "--resolution",
        type=int,
        default=1024,
        help="Preview width and height in pixels. Default: 1024.",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=64,
        help="Render samples for Eevee/Cycles. Default: 64.",
    )
    parser.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Continue exporting remaining inputs if one input fails.",
    )
    return parser.parse_args(list(argv))


def main(argv: Sequence[str]) -> int:
    args = parse_args(extract_script_argv(argv))
    root = Path(args.root).resolve()
    case_filter = set(args.case_ids or [])
    selected_inputs = [
        item for item in INPUT_SPECS if not case_filter or item.case_id in case_filter
    ]

    failures: list[tuple[str, str]] = []
    for item in selected_inputs:
        try:
            process_input(root, item, resolution=args.resolution, samples=args.samples)
        except Exception as exc:  # pragma: no cover - Blender runtime path
            failures.append((item.label, str(exc)))
            print(f"ERROR while processing {item.label}: {exc}")
            traceback.print_exc()
            if not args.continue_on_error:
                break

    if failures:
        print("\nExport completed with failures:")
        for label, message in failures:
            print(f"- {label}: {message}")
        return 1

    print(f"\nExport completed successfully for {len(selected_inputs)} input(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
