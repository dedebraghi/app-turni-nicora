import os
import cv2
import numpy as np
import scipy.interpolate as interp
from PIL import Image

def generate_icons():
    # 1. Load source mockup
    src_path = 'public/Icona app-nicora ufficiale.jpg'
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source file not found: {src_path}")
    
    img = cv2.imread(src_path)
    crop_y, crop_x = 300, 1150
    crop = img[300:980, 1150:2200]
    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)

    # 2. Extract masks
    orange_mask = ((rgb[:, :, 0] > 175) & (rgb[:, :, 1] < 140) & (rgb[:, :, 2] < 80)).astype(np.uint8) * 255
    white_mask = ((rgb[:, :, 0] > 205) & (rgb[:, :, 1] > 205) & (rgb[:, :, 2] > 205)).astype(np.uint8) * 255
    leaf_mask = cv2.bitwise_or(orange_mask, white_mask)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    leaf_clean = cv2.morphologyEx(leaf_mask, cv2.MORPH_CLOSE, kernel)
    white_clean = cv2.morphologyEx(white_mask, cv2.MORPH_CLOSE, kernel)

    cnts_l, _ = cv2.findContours(leaf_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    leaf_cnt = max(cnts_l, key=cv2.contourArea)[:, 0, :] + [crop_x, crop_y]

    cnts_w, _ = cv2.findContours(white_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    white_cnt = max(cnts_w, key=cv2.contourArea)[:, 0, :] + [crop_x, crop_y]

    # 3. Calculate center and bounding box
    min_x, max_x = np.min(leaf_cnt[:, 0]), np.max(leaf_cnt[:, 0])
    min_y, max_y = np.min(leaf_cnt[:, 1]), np.max(leaf_cnt[:, 1])
    cx = (min_x + max_x) / 2.0
    cy = (min_y + max_y) / 2.0
    leaf_w = max_x - min_x

    # Target: 512x512 canvas, center at 256, 256
    # Width of leaf calibrated to 345px to stay strictly within the 80% safe zone circle (radius 204.8px)
    scale = 345.0 / leaf_w
    target_cx, target_cy = 256.0, 256.0

    t_leaf = np.column_stack([(leaf_cnt[:, 0] - cx) * scale + target_cx, (leaf_cnt[:, 1] - cy) * scale + target_cy])
    t_white = np.column_stack([(white_cnt[:, 0] - cx) * scale + target_cx, (white_cnt[:, 1] - cy) * scale + target_cy])

    # 4. Spline smoothing
    def smooth(pts, num_pts=500, s=20.0):
        pts_closed = np.vstack([pts, pts[0]])
        tck, u = interp.splprep([pts_closed[:, 0], pts_closed[:, 1]], s=s, per=True)
        unew = np.linspace(0, 1, num_pts)
        out = interp.splev(unew, tck)
        return np.column_stack(out)

    s_leaf = smooth(t_leaf, num_pts=500, s=20.0)
    s_white = smooth(t_white, num_pts=350, s=12.0)

    # 5. Build SVG string
    def to_svg_path(pts):
        d = f"M {pts[0, 0]:.2f} {pts[0, 1]:.2f} "
        for p in pts[1:]:
            d += f"L {p[0]:.2f} {p[1]:.2f} "
        d += "Z"
        return d

    svg_leaf_path = to_svg_path(s_leaf)
    svg_white_path = to_svg_path(s_white)

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#035F64"/>
  <path d="{svg_leaf_path}" fill="#E15311"/>
  <path d="{svg_white_path}" fill="#FFFFFF"/>
</svg>
'''

    # Save SVG files
    svg_targets = [
        'public/pwa-512x512.svg',
        'public/pwa-192x192.svg',
        'public/logo-nicora.svg',
        'public/favicon.svg'
    ]
    for target in svg_targets:
        with open(target, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print(f"Generated: {target}")

    # 6. Render high-res master PNG at 2048x2048 (4x supersampling)
    master_size = 2048
    s_factor = master_size / 512.0
    master_img = np.zeros((master_size, master_size, 3), dtype=np.uint8)
    master_img[:] = (0x64, 0x5F, 0x03) # BGR for #035F64

    pts_l = (s_leaf * s_factor).astype(np.int32)
    pts_w = (s_white * s_factor).astype(np.int32)

    cv2.fillPoly(master_img, [pts_l], (0x11, 0x53, 0xE1), lineType=cv2.LINE_AA)
    cv2.fillPoly(master_img, [pts_w], (255, 255, 255), lineType=cv2.LINE_AA)

    # Convert to PIL Image for high-quality Lanczos downsampling
    rgb_master = cv2.cvtColor(master_img, cv2.COLOR_BGR2RGB)
    pil_master = Image.fromarray(rgb_master)

    # 7. Generate PNG assets
    png_specs = [
        ('public/icon-512.png', (512, 512)),
        ('public/icon-192.png', (192, 192)),
        ('public/apple-touch-icon.png', (180, 180)),
        ('public/favicon-32x32.png', (32, 32)),
        ('public/favicon-16x16.png', (16, 16)),
    ]

    for path, (w, h) in png_specs:
        resized = pil_master.resize((w, h), Image.Resampling.LANCZOS)
        resized.save(path, format='PNG', optimize=True)
        print(f"Generated: {path} ({w}x{h})")

    # 8. Generate multi-size favicon.ico (16, 32, 48)
    ico_img_16 = pil_master.resize((16, 16), Image.Resampling.LANCZOS)
    ico_img_32 = pil_master.resize((32, 32), Image.Resampling.LANCZOS)
    ico_img_48 = pil_master.resize((48, 48), Image.Resampling.LANCZOS)
    ico_img_32.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print("Generated: public/favicon.ico")

if __name__ == '__main__':
    generate_icons()
