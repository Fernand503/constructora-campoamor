"""Comprobaciones estáticas: python tests/check_site.py (sin dependencias)."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.tags, self.stack, self.errors = path, [], [], []
        self.feed(path.read_text())
        if self.stack:
            self.errors.append(f'Etiquetas sin cerrar: {self.stack}')

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1] != tag:
            self.errors.append(f'Cierre fuera de orden: {tag}')
        else:
            self.stack.pop()

pages = {p: Page(p) for p in ROOT.rglob('*.html') if '.git' not in p.parts}
errors = []
for path, page in pages.items():
    local_errors = list(page.errors)
    ids = [a['id'] for _, a in page.tags if 'id' in a]
    local_errors += [f'ID duplicado: {id_}' for id_, count in Counter(ids).items() if count > 1]
    scripts = [a['src'] for tag, a in page.tags if tag == 'script' and 'src' in a]
    if len(scripts) != len(set(scripts)):
        local_errors.append('Scripts duplicados')
    redirect = any(a.get('http-equiv') == 'refresh' for _, a in page.tags)
    if not redirect:
        for id_ in ['menuBtn', 'mainNav', 'contenido']:
            if id_ not in ids:
                local_errors.append(f'Falta {id_}')
        if scripts.count('/JS/app.js') != 1:
            local_errors.append('Falta el controlador único del menú')
        if sum(tag == 'main' for tag, _ in page.tags) != 1:
            local_errors.append('Debe existir un único main')
    for tag, attrs in page.tags:
        if tag == 'img' and any(key not in attrs for key in ['alt', 'width', 'height']):
            local_errors.append('Imagen sin alt o dimensiones')
        if tag == 'iframe' and not attrs.get('title'):
            local_errors.append('Iframe sin título')
        if tag == 'a' and attrs.get('target') == '_blank' and 'noopener' not in attrs.get('rel', ''):
            local_errors.append('Enlace externo sin noopener')
        for key in ['aria-labelledby', 'aria-describedby', 'aria-controls', 'for']:
            for id_ in attrs.get(key, '').split():
                if id_ not in ids:
                    local_errors.append(f'{key} apunta a un ID ausente: {id_}')
        for key in ['src', 'href', 'data-src', 'data-bs-target']:
            url = attrs.get(key)
            if not url:
                continue
            parts = urlsplit(url)
            if parts.scheme or parts.netloc:
                continue
            relative = unquote(parts.path)
            target = ((ROOT / relative.lstrip('/')) if relative.startswith('/') else (path.parent / relative)) if relative else path
            if target.is_dir():
                target /= 'index.html'
            if not target.is_file():
                local_errors.append(f'Recurso ausente: {url}')
            elif parts.fragment and target.suffix == '.html':
                target_ids = [a.get('id') for _, a in pages[target.resolve()].tags]
                if parts.fragment not in target_ids:
                    local_errors.append(f'Ancla ausente: {url}')
    errors += [f'{path.relative_to(ROOT)}: {message}' for message in local_errors]

bv = pages[ROOT/'Buenaventura/buenaventura.html']
slides = [a for _, a in bv.tags if 'carousel-item' in a.get('class', '').split()]
indicators = [int(a['data-bs-slide-to']) for _, a in bv.tags if 'data-bs-slide-to' in a]
if indicators != list(range(len(slides))) or sum('active' in a.get('class', '').split() for a in slides) != 1:
    errors.append('La galería debe tener un indicador por imagen y una sola imagen activa')
frame = next(a for _, a in bv.tags if a.get('id') == 'brochureFrame')
if 'src' in frame or not frame.get('data-src'):
    errors.append('El brochure debe cargarse a demanda')
for path in (ROOT/'JS').glob('*.js'):
    result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
    if result.returncode:
        errors.append(result.stderr)
    for ref in re.findall(r'from\s+[\'"]([^\'"]+)', path.read_text()):
        if ref.startswith('.') and not (path.parent / ref).is_file():
            errors.append(f'{path.name}: importación ausente {ref}')
json.loads((ROOT/'site.webmanifest.json').read_text())
if errors:
    raise SystemExit('\n'.join(errors))
print(f'OK: {len(pages)} páginas; rutas, anclas, IDs, scripts, accesibilidad básica y 4 indicadores de galería.')
