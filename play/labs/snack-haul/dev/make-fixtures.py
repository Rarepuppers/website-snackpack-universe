# Builds small stand-in assets with Blender, to test the game's model and audio
# loader against real Blender exports. These are test fixtures, not game art.
#   blender --background --python dev/make-fixtures.py -- <output folder>
# Game axes: +X forward, +Y up, camera on +Z. Blender is Z-up, and the exporter
# maps Blender (x, y, z) to glTF (x, z, -y), so the visible side is Blender -Y.
import bpy, bmesh, math, os, sys
from mathutils import Matrix, Vector

out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "fixture-assets"


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, colour=(1, 1, 1), alpha=1.0, glow=None, rough=0.5, metal=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*colour, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Alpha"].default_value = alpha
    if glow:
        bsdf.inputs["Emission Color"].default_value = (*glow, 1)
        bsdf.inputs["Emission Strength"].default_value = 1.0
    if alpha < 1:
        for attr, value in (("blend_method", "BLEND"), ("surface_render_method", "BLENDED")):
            try:
                setattr(mat, attr, value)
            except Exception:
                pass
    return mat


def srgb(hex_colour):
    h = hex_colour.lstrip("#")
    return tuple(((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4))


def mesh_object(name, bm, mat, colour=(1, 1, 1), bevel=0.0, parent=None):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    layer = mesh.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="CORNER")
    for poly in mesh.polygons:
        # A cheap stand-in for baked shading: faces that point down are darker.
        shade = 0.72 + 0.28 * max(0.0, poly.normal.z * 0.5 + 0.5)
        for loop in poly.loop_indices:
            layer.data[loop].color = (colour[0] * shade, colour[1] * shade, colour[2] * shade, 1)
    mesh.color_attributes.active_color = layer
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if bevel:
        mod = obj.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    if parent:
        obj.parent = parent
    return obj


# Sizes and positions are given in game axes (x forward, y up, z towards camera).
def to_blender(x, y, z):
    return Vector((x, -z, y))


def box(name, size, at, mat, colour=(1, 1, 1), bevel=0.03, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(to_blender(*at)) @ Matrix.Diagonal((size[0], size[2], size[1], 1)))
    return mesh_object(name, bm, mat, colour, bevel, parent)


def disc(name, radius, depth, at, mat, colour=(1, 1, 1), segments=18, parent=None):
    # A cylinder whose axis is game Z (the axle direction).
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segments, radius1=radius, radius2=radius, depth=depth,
                          matrix=Matrix.Translation(to_blender(*at)) @ Matrix.Rotation(math.pi / 2, 4, "X"))
    return mesh_object(name, bm, mat, colour, 0.0, parent)


def empty(name, at, parent=None):
    obj = bpy.data.objects.new(name, None)
    obj.location = to_blender(*at)
    bpy.context.scene.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def export(path):
    full = os.path.join(out, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=full, export_format="GLB", export_apply=True, export_yup=True,
                              export_animations=False, export_cameras=False, export_lights=False,
                              export_vertex_color="ACTIVE", export_all_vertex_colors=False)
    print("wrote", full)


# ── Rusty Pickup: sizes from engine.js dimsFor() ───────────────────
reset()
paint, trim = material("paint", rough=0.35, metal=0.2), material("trim", rough=0.4)
detail = material("detail", rough=0.8)
body = empty("body", (0, 0, 0))
box("chassis", (3.5, 0.2, 1.6), (0, -0.2, 0), detail, srgb("#2a2a2e"), parent=body)
box("bed", (3.5, 0.2, 1.8), (0, 0.04, 0), detail, srgb("#6b4a30"), parent=body)
box("cab", (1.1, 1.14, 1.8), (1.15, 0.69, 0), paint, parent=body)
box("bonnet", (0.7, 0.5, 1.8), (2.05, 0.37, 0), paint, parent=body)
box("stripe", (1.8, 0.07, 1.83), (1.5, 0.3, 0), trim, parent=body)
box("bumper", (0.12, 0.14, 1.94), (2.44 - 0.1, 0.1, 0), detail, srgb("#c9c9c4"), parent=body)
glass = empty("glass", (0, 0, 0))
box("windows", (0.7, 0.42, 1.84), (1.2, 0.98, 0), material("glass", srgb("#1e3448"), alpha=0.6, rough=0.1), bevel=0, parent=glass)
front = empty("lights_front", (0, 0, 0))
box("lamps", (0.06, 0.16, 1.5), (2.41, 0.44, 0), material("lamp_front", (1, 0.95, 0.8), glow=(1, 0.85, 0.6)), bevel=0, parent=front)
brake = empty("lights_brake", (0, 0, 0))
box("tail", (0.06, 0.14, 1.6), (-1.78, 0.03, 0), material("lamp_brake", (0.7, 0.1, 0.1), glow=(1, 0.15, 0.1)), bevel=0, parent=brake)
empty("seat", (1.1, 0.94, 0.35))
empty("exhaust", (-1.7, -0.25, 0.5))
empty("topper", (1.15, 1.26, 0))
empty("headlight", (2.42, 0.44, 0))
export("models/trucks/truck_pickup.glb")

# ── Wheel: hub at the origin, axle along game Z ─────────────────────
reset()
rubber = material("tyre", rough=0.9)
disc("tyre", 0.5, 0.32, (0, 0, 0), rubber, srgb("#242225"))
disc("hub", 0.28, 0.04, (0, 0, 0.17), rubber, srgb("#d5d0c6"), segments=5)
export("models/wheels/wheel_pickup.glb")

# ── Driver stand-in ─────────────────────────────────────────────────
reset()
corgi = empty("corgi", (0, 0, 0))
box("head", (0.38, 0.36, 0.36), (0, 0, 0), material("fur", rough=0.8), srgb("#e8a050"), bevel=0.1, parent=corgi)
box("muffs", (0.14, 0.2, 0.5), (-0.02, 0.02, 0), material("corn", rough=0.6), srgb("#f4c21f"), bevel=0.05, parent=corgi)
export("models/driver/corgi_driver.glb")

# ── Cargo, coin and scenery ─────────────────────────────────────────
reset()
box("crate", (0.5, 0.5, 0.5), (0, 0, 0), material("wood", rough=0.8), srgb("#3fb7a6"))
export("models/cargo/cargo_crate.glb")

reset()
box("eggs", (0.5, 0.5, 0.5), (0, 0, 0), material("eggbox", rough=0.6), srgb("#fff3dc"))
export("models/cargo/cargo_eggs.glb")

reset()
box("eggs_broken", (0.5, 0.3, 0.5), (0, -0.11, 0), material("yolk", rough=0.6), srgb("#ffc62e"))
export("models/cargo/cargo_eggs_broken.glb")

reset()
disc("coin", 0.34, 0.08, (0, 0, 0), material("gold", rough=0.3, metal=0.4), srgb("#7a3fb8"))
export("models/road/coin.glb")

reset()
wood = material("bark", rough=0.9)
box("trunk", (0.5, 2.2, 0.5), (0, 1.1, 0), wood, srgb("#6d4a2c"))
box("crown", (2.6, 2.6, 2.6), (0, 3.4, 0), material("leaf", rough=0.9), srgb("#d8452e"), bevel=0.5)
export("models/props/oak.glb")
