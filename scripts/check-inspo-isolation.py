#!/usr/bin/env python3
"""Area gate: inspo isolation — product code never imports inspo/."""
import sys
from pathlib import Path
bad = []
for p in list(Path("apps").rglob("*.ts")) + list(Path("packages").rglob("*.ts")) + list(Path("ai/src").glob("*.ts") if Path("ai/src").exists() else []) + list(Path("mcp/src").glob("*.ts") if Path("mcp/src").exists() else []):
    try:
        t = p.read_text()
    except OSError:
        continue
    if "inspo/" in t or "from \"inspo" in t or "from 'inspo" in t:
        bad.append(str(p))
if bad:
    print("FAIL: inspo imports found:", bad)
    sys.exit(1)
print("OK: no product imports from inspo/")
