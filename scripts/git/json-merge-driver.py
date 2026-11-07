#!/usr/bin/env python3
# Git merge driver for the translation files (src/locales/*/*.json, sameAsEnglish.json), see .gitattributes.
# Both main and dune append new texts at the end of the same files, so a line-based merge conflicts almost every
# time although the entries never clash (AK1 then ran the plain dune branch, Jens, 7 Nov 2026). Merged here as
# data instead: objects key by key, lists of texts as sets; only a key changed differently on both sides conflicts.
# Call (git): json-merge-driver.py %O %A %B -> result in %A, exit 1 on a real conflict.
import collections
import json
import sys

MISSING = object()


def load(path):
    try:
        with open(path, encoding='utf-8') as handle:
            return json.load(handle, object_pairs_hook=collections.OrderedDict)
    except (OSError, ValueError):
        return MISSING


def merge(base, ours, theirs, path, conflicts):
    if ours == theirs:
        return ours
    if theirs == base:
        return ours
    if ours == base:
        return theirs
    if isinstance(ours, dict) and isinstance(theirs, dict):
        base = base if isinstance(base, dict) else {}
        result = collections.OrderedDict()
        # Order: ours first, then keys only the other side added (new texts stay at the end)
        for key in list(ours.keys()) + [key for key in theirs.keys() if key not in ours]:
            value = merge(base.get(key, MISSING), ours.get(key, MISSING), theirs.get(key, MISSING), path + [key], conflicts)
            if value is not MISSING:
                result[key] = value
        return result
    if isinstance(ours, list) and isinstance(theirs, list) and all(isinstance(item, str) for item in ours + theirs):
        base_items = set(base) if isinstance(base, list) else set()
        # Removed on one side stays removed, added on either side is kept
        removed = (base_items - set(ours)) | (base_items - set(theirs))
        items = [item for item in dict.fromkeys(ours + theirs) if item not in removed]
        return sorted(items) if ours == sorted(ours) and theirs == sorted(theirs) else items
    conflicts.append('/'.join(str(part) for part in path))
    return ours


def main():
    base_path, ours_path, theirs_path = sys.argv[1:4]
    base, ours, theirs = load(base_path), load(ours_path), load(theirs_path)
    if ours is MISSING or theirs is MISSING:
        return 1
    conflicts = []
    result = merge(base if base is not MISSING else MISSING, ours, theirs, [], conflicts)
    if conflicts:
        sys.stderr.write('JSON conflict in: ' + ', '.join(conflicts) + '\n')
        return 1
    with open(ours_path, 'w', encoding='utf-8') as handle:
        handle.write(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
