#!/usr/bin/env python3
"""Area gate: secrets — no literal secrets in tracked files."""
import re
import subprocess
import sys
files = subprocess.run(["git", "grep", "-I", "-l", "-E",
    "sk_live|ghp_|BEGIN (RSA )?PRIVATE KEY|mongodb\\+srv://[^ ]*@",
    "--", "."], capture_output=True, text=True).stdout.split()
# allow docs that name the pattern only, plus this gate's own pattern list
deny = [f for f in files if not f.endswith(".md") and "check-secret-literals" not in f]
if deny:
    print("FAIL: possible secret literals in:", deny)
    sys.exit(1)
print("OK: no secret literals in tracked code")
