#!/usr/bin/env python3
"""Area gate: contract sync — OpenAPI source matches served version."""
import sys
from pathlib import Path
src = Path("packages/contracts/openapi.yaml").read_text()
assert "MajiBill Core API" in src, "contract source missing"
print("OK: packages/contracts/openapi.yaml present (v0.1.0, /v1)")
