from __future__ import annotations

import argparse
import fnmatch
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dependency_map import APPS, INFRA_PATHS


def matches_any(path: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatch(path, pattern) for pattern in patterns)


def parse_changed_files(args: argparse.Namespace) -> list[str]:
    if args.changed_files_json:
        return json.loads(args.changed_files_json)
    return args.changed_file


def compute_selection(changed_files: list[str]) -> dict[str, object]:
    infra_changed = any(matches_any(path, INFRA_PATHS) for path in changed_files)

    affected_apps = []
    for app_name, app in APPS.items():
        app_changed = any(matches_any(path, app["paths"]) for path in changed_files)
        app_ci_changed = any(matches_any(path, app.get("ci_paths", [])) for path in changed_files)
        if app_changed or app_ci_changed:
            affected_apps.append(app_name)

    return {
        "changed_files": changed_files,
        "infra": infra_changed,
        "web": "web" in affected_apps,
        "worker": "worker" in affected_apps,
        "frontend": "frontend" in affected_apps,
    }


def write_github_outputs(output_path: str, selection: dict[str, object]) -> None:
    output_lines = [
        f"infra={str(selection['infra']).lower()}",
        f"web={str(selection['web']).lower()}",
        f"worker={str(selection['worker']).lower()}",
        f"frontend={str(selection['frontend']).lower()}",
    ]
    Path(output_path).write_text("\n".join(output_lines) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--changed-file", action="append", default=[])
    parser.add_argument("--changed-files-json")
    parser.add_argument("--github-output")
    args = parser.parse_args()

    changed_files = parse_changed_files(args)
    selection = compute_selection(changed_files)

    if args.github_output:
        write_github_outputs(args.github_output, selection)

    print(json.dumps(selection))


if __name__ == "__main__":
    main()
