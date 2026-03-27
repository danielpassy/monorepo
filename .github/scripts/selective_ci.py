from __future__ import annotations

import argparse
import fnmatch
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dependency_map import APPS, CI_CONFIG_PATHS, INFRA_PATHS, RUN_ALL_PATHS


def matches_any(path: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatch(path, pattern) for pattern in patterns)


def parse_changed_files(args: argparse.Namespace) -> list[str]:
    if args.changed_files_json:
        return json.loads(args.changed_files_json)
    return args.changed_file


def compute_selection(changed_files: list[str]) -> dict[str, object]:
    run_all = any(matches_any(path, RUN_ALL_PATHS) for path in changed_files)
    infra_changed = any(matches_any(path, INFRA_PATHS) for path in changed_files)
    ci_config_changed = any(matches_any(path, CI_CONFIG_PATHS) for path in changed_files)

    affected_apps = []
    for app_name, app in APPS.items():
        app_changed = any(matches_any(path, app["paths"]) for path in changed_files)
        if run_all or infra_changed or ci_config_changed or app_changed:
            affected_apps.append(app_name)

    return {
        "changed_files": changed_files,
        "run_all": run_all,
        "infra": run_all or infra_changed,
        "web": run_all or "web" in affected_apps,
        "worker": run_all or "worker" in affected_apps,
    }


def write_github_outputs(output_path: str, selection: dict[str, object]) -> None:
    output_lines = [
        f"run_all={str(selection['run_all']).lower()}",
        f"infra={str(selection['infra']).lower()}",
        f"web={str(selection['web']).lower()}",
        f"worker={str(selection['worker']).lower()}",
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
