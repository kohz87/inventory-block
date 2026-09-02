from pathlib import Path

p = Path('scripts/v033_transform.py')
text = p.read_text()
old = "replace_once('README.md', 'Plain numeric Quantity values use `adjust_item`; amounts or states stored in Remark use `edit_item`.', 'Plain numeric Quantity values use `adjust_item`; single numeric balances stored in Remark use backend-enforced `adjust_resource`; semantic Remark states such as Full/Half full/Empty use `edit_item`.')"
new = "replace_once('README.md', 'Plain numeric Quantity values use `adjust_item`; a single numeric amount stored in Remark uses `adjust_resource`; non-numeric semantic states stored in Remark use `edit_item`.', 'Plain numeric Quantity values use `adjust_item`; single numeric balances stored in Remark use backend-enforced `adjust_resource`; semantic Remark states such as Full/Half full/Empty use `edit_item`.')"
if text.count(old) != 1:
    raise SystemExit(f'expected one README transform guard, found {text.count(old)}')
text = text.replace(old, new, 1)
p.write_text(text)
exec(compile(text, str(p), 'exec'), {'__name__': '__main__', '__file__': str(p)})
