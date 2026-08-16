import base64
import io
from PIL import Image

logo_black = Image.open('public/ClientEcho_logo.png').convert('RGBA')
logo_white = Image.open('public/ClientEcho_logo_white.png').convert('RGBA')
w, h = logo_black.size

buf_black = io.BytesIO()
logo_black.save(buf_black, format='PNG')
b64_black = base64.b64encode(buf_black.getvalue()).decode('utf-8')

buf_white = io.BytesIO()
logo_white.save(buf_white, format='PNG')
b64_white = base64.b64encode(buf_white.getvalue()).decode('utf-8')

# Fully transparent background, dynamic adaptive color switching
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
print('Successfully generated adaptive public/favicon.svg (100% transparent, auto switches Black on Light / White on Dark)')
