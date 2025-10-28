"""
Utilities to load the appropriate environment configuration file.

Priority order:
1. Absolute/relative path provided in ENV_CONFIG_FILE.
2. Named mode via APP_ENV / ENVIRONMENT (e.g. "test" -> env.config.test).
3. Default env.config file.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Iterable

from dotenv import load_dotenv

# Known suffixes for specific modes. Fallback will try env.config.<mode>.
ENV_MODE_FILE_MAP = {
    "test": "env.config.test",
    "qa": "env.config",
    "staging": "env.config",
    "prod": "env.config.prod",
    "production": "env.config.prod",
    "development": "env.config",
    "dev": "env.config",
}

DEFAULT_ENV_FILE = "env.config"


def _resolve_candidates(base_dir: Path) -> Iterable[Path]:
    """Yield possible env file locations following the priority rules."""
    override = os.getenv("ENV_CONFIG_FILE")
    env_mode = os.getenv("APP_ENV") or os.getenv("ENVIRONMENT") or ""
    env_mode = env_mode.strip().lower()

    if override:
        override_path = Path(override)
        if not override_path.is_absolute():
            override_path = base_dir / override_path
        yield override_path

    if env_mode:
        mapped = ENV_MODE_FILE_MAP.get(env_mode)
        if mapped:
            yield base_dir / mapped
        yield base_dir / f"env.config.{env_mode}"

    yield base_dir / DEFAULT_ENV_FILE


@lru_cache(maxsize=1)
def load_environment() -> Path:
    """
    Load environment variables from the first existing candidate file.

    Returns the resolved Path that was successfully loaded.
    Raises FileNotFoundError if none of the candidates exist.
    """
    base_dir = Path(__file__).resolve().parent.parent
    env_mode = (os.getenv("APP_ENV") or os.getenv("ENVIRONMENT") or "").strip().lower()
    tried_paths = []

    for candidate in _resolve_candidates(base_dir):
        candidate = candidate.resolve()
        if candidate in tried_paths:
            continue
        tried_paths.append(candidate)
        if candidate.exists():
            load_dotenv(dotenv_path=candidate, override=True)
            os.environ["ENV_CONFIG_PATH"] = str(candidate)
            # Default to the basename when APP_ENV wasn't set already.
            os.environ.setdefault("APP_ENV", env_mode or "default")
            return candidate

    searched = "\n - ".join(str(path) for path in tried_paths)
    raise FileNotFoundError(
        "No se encontró un archivo de configuración de entorno válido. "
        f"Rutas buscadas:\n - {searched}"
    )
