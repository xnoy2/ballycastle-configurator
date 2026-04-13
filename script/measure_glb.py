#!/usr/bin/env python3
"""
measure_glb.py — Extract attachment geometry from a GLB model

Usage:
  python3 scripts/measure_glb.py public/models/18_7ft_tube_slide.glb tube-slide

Prints the scaled bounding box and top/bottom attachment Z coordinates,
which tell you what `offset` to set in products.js.
"""
import sys, struct, json, numpy as np

CATEGORY_SIZES = {
    'platform-tower':3.5,'platform':3.5,'treehouse':3.5,'ninja':6.0,
    'aframe':3.0,'monkey-bar-swing':4.0,'playhouse':3.0,'shelter':4.0,
    'toddler-castle':2.5,'gym-bar':3.0,'swing-beam-triple':4.0,
    'swing-beam-double':3.5,'swing-beam':2.5,'swing-tyre':0.8,
    'tube-slide':2.2,'cargo':1.8,'net-tunnel':2.5,'rope-bridge':2.0,
    'climbing-net':1.8,'rock-wall':1.8,'tyre-wall':1.8,'fireman':1.8,
    'single-beam':1.5,'monkey-beam':2.5,'default':2.5,
}

def gts(v):
    for k, s in CATEGORY_SIZES.items():
        if k in v: return s
    return 2.5

def read_glb(path):
    with open(path, 'rb') as f:
        f.read(12)
        chunk_len = struct.unpack('<I', f.read(4))[0]
        f.read(4)
        gltf = json.loads(f.read(chunk_len))
        remaining = f.read()
        bin_data = remaining[8:8 + struct.unpack('<I', remaining[:4])[0]] if len(remaining) >= 8 else b''
    return gltf, bin_data

def get_verts(gltf, bin_data):
    all_verts = []
    for mesh in gltf.get('meshes', []):
        for prim in mesh.get('primitives', []):
            idx = prim.get('attributes', {}).get('POSITION')
            if idx is None: continue
            acc = gltf['accessors'][idx]
            bv  = gltf['bufferViews'][acc['bufferView']]
            off = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
            n   = acc['count']
            stride = bv.get('byteStride', 12)
            verts = [struct.unpack_from('<3f', bin_data, off + i * stride) for i in range(n)]
            all_verts.append(np.array(verts, dtype=np.float32))
    return np.concatenate(all_verts) * 0.001 if all_verts else None

def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    path, value = sys.argv[1], sys.argv[2]
    target = gts(value)
    gltf, bin_data = read_glb(path)
    verts = get_verts(gltf, bin_data)
    if verts is None:
        print("No vertex data found"); sys.exit(1)

    mins, maxs = verts.min(0), verts.max(0)
    size = maxs - mins
    scale = target / size.max()
    sv = verts * scale
    s_min, s_max = sv.min(0), sv.max(0)
    cx, cz = (s_min[0]+s_max[0])/2, (s_min[2]+s_max[2])/2

    # Apply Three.js centering
    sv[:, 0] -= cx;  sv[:, 1] -= s_min[1];  sv[:, 2] -= cz

    max_y = sv[:, 1].max()
    top_v = sv[sv[:,1] > max_y * 0.85]
    bot_v = sv[sv[:,1] < max_y * 0.15]

    hX, hZ = sv[:,0].max(), sv[:,2].max()

    print(f"\n=== {path} ===")
    print(f"Target size category: '{value}' → {target}m  (scale={scale:.4f})")
    print(f"\nAfter Three.js centering:")
    print(f"  halfX = {hX:.3f}m    (model spans X=[{-hX:.3f}, {hX:.3f}])")
    print(f"  halfZ = {hZ:.3f}m    (model spans Z=[{-hZ:.3f}, {hZ:.3f}])")
    print(f"  height = {max_y:.3f}m  (model spans Y=[0, {max_y:.3f}])")

    if len(top_v):
        print(f"\nTop attachment point (top 15% of Y={max_y*0.85:.2f}m → {max_y:.2f}m):")
        print(f"  Z mean = {top_v[:,2].mean():+.3f}m  ← this is where the top face is")
        print(f"  X range = [{top_v[:,0].min():.3f}, {top_v[:,0].max():.3f}]")

    if len(bot_v):
        print(f"\nBottom attachment point (bottom 15% of Y=0 → {max_y*0.15:.2f}m):")
        print(f"  Z mean = {bot_v[:,2].mean():+.3f}m")

    TOWER_HALF_Z = 1.750
    if len(top_v):
        top_z = top_v[:,2].mean()
        front_offset = TOWER_HALF_Z - top_z
        back_offset  = -TOWER_HALF_Z - top_z
        print(f"\nTo align top face with tower FRONT (+{TOWER_HALF_Z}m):  offset: [0, 0, {front_offset:.2f}]")
        print(f"To align top face with tower BACK  (-{TOWER_HALF_Z}m):  offset: [0, 0, {back_offset:.2f}]")

if __name__ == '__main__':
    main()
