import base64
import io
from PIL import Image, ImageDraw

# 1. Load source images
logo_black = Image.open('public/ClientEcho_logo.png').convert('RGBA')
logo_white = Image.open('public/ClientEcho_logo_white.png').convert('RGBA')
w, h = logo_black.size

# 2. Build High-DPI Obsidian Squircle Icons (Optimized for Google Search 48x48 multiples, Chrome, & Apple Touch)
def create_squircle_favicon(size, output_path):
    scale = 4
    hr_size = size * scale
    bg = Image.new('RGBA', (hr_size, hr_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bg)
    radius = int(hr_size * 0.225)
    
    # Modern dark obsidian tile (#111116)
    draw.rounded_rectangle([(0, 0), (hr_size - 1, hr_size - 1)], radius=radius, fill=(17, 17, 22, 255))
    
    # White logo glyph with ~15% optical margin
    glyph_size = int(hr_size * 0.70)
    glyph = logo_white.resize((glyph_size, glyph_size), Image.Resampling.LANCZOS)
    offset = (hr_size - glyph_size) // 2
    bg.paste(glyph, (offset, offset), glyph)
    
    final_img = bg.resize((size, size), Image.Resampling.LANCZOS)
    final_img.save(output_path, 'PNG', optimize=True)
    print(f'Created {output_path} ({size}x{size})')
    return final_img

# Google Search multiples of 48px + standard web sizes
create_squircle_favicon(48, 'public/favicon-48x48.png')
create_squircle_favicon(96, 'public/favicon-96x96.png')
create_squircle_favicon(144, 'public/favicon-144x144.png')
create_squircle_favicon(192, 'public/favicon-192x192.png')
create_squircle_favicon(512, 'public/favicon-512x512.png')
ico_source = create_squircle_favicon(180, 'public/apple-touch-icon.png')

# Generate multi-resolution .ico for Googlebot & standard browser root
ico_source.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
print('Created public/favicon.ico (16/32/48)')

# 3. Create Adaptive SVG favicon for modern browsers
buf_black = io.BytesIO()
logo_black.save(buf_black, format='PNG')
b64_black = base64.b64encode(buf_black.getvalue()).decode('utf-8')

buf_white = io.BytesIO()
logo_white.save(buf_white, format='PNG')
b64_white = base64.b64encode(buf_white.getvalue()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <style>
    .icon-light {{ display: block; }}
    .icon-dark {{ display: none; }}
    @media (prefers-color-scheme: dark) {{
      .icon-light {{ display: none; }}
      .icon-dark {{ display: block; }}
    }}
  </style>
  <image class="icon-light" href="data:image/png;base64,{b64_black}" width="{w}" height="{h}" />
  <image class="icon-dark" href="data:image/png;base64,{b64_white}" width="{w}" height="{h}" />
</svg>'''

with open('public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)
print('Created public/favicon.svg (Adaptive SVG)')
