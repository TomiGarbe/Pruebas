"""
Utility script to render a dotenv-style file from environment variables.

Usage (example):
    python render_env_file.py \\
        --output ../src/env.config.test \\
        --keys DATABASE_URL FRONTEND_URL

Keys are read from process env and written as KEY=value pairs. Multiline
values are preserved.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render environment file from variables.")
    parser.add_argument(
        "--output",
        "-o",
        default="env.config",
        help="Relative or absolute path to the output env file.",
    )
    parser.add_argument(
        "--keys",
        "-k",
        nargs="+",
        required=True,
        help="Environment variable names to include in the output file.",
    )
    parser.add_argument(
        "--append",
        "-a",
        nargs="*",
        default=[],
        help="Additional KEY=VALUE pairs to append literally.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    lines = []
    for key in args.keys:
        value = os.getenv(key)
        if value is None:
            raise RuntimeError(f"No se encontró el valor para la variable requerida '{key}'.")
        lines.append(f"{key}={value}")

    for literal in args.append:
        if "=" not in literal:
            raise ValueError(f"La opción --append debe tener formato KEY=VALUE. Recibido: {literal}")
        lines.append(literal)

    content = "\n".join(lines) + "\n"
    output_path.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    main()
