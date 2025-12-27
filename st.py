import os
import datetime

# =============================================================
# CONFIG
# =============================================================
OUTPUT_NAME = None
TREE_OUTPUT_NAME = "PROJECT_TREE.txt"

SELF_FILE = os.path.basename(__file__)  # ví dụ: st.py

ALLOWED_EXTENSIONS = [
    ".ts", ".tsx",
    ".js", ".jsx",
    ".mjs",
    ".json", ".md", ".sql",
    ".css",
    ".jpg", ".png", ".svg", ".ico",
    ".env", ".env.example",
    ".gitignore",
    ".dockerignore"
]

TEXT_EXTENSIONS = [
    ".ts", ".tsx",
    ".js", ".jsx",
    ".mjs",
    ".json", ".md", ".sql",
    ".css",
    ".env", ".env.example"
]

# =============================================================
# EXIST-ONLY RULES
# =============================================================
EXIST_ONLY_DIRS = {
    "node_modules",
    ".github"
}

EXIST_ONLY_FILES = {
    "package.json",
    "package-lock.json",
    ".gitignore",
    ".dockerignore"
}

# =============================================================
# BANNER
# =============================================================
def make_banner(module_name):
    return f"""
################################################################################
#                      {module_name.upper():<50}#
#                   SOURCE CODE DOCUMENTATION GENERATOR                    #
#        Version 2.8.0 - JS / JSX SUPPORT + SELF EXCLUDE MODE              #
################################################################################
"""

# =============================================================
# FILE FILTER
# =============================================================
def is_allowed_file(filename):
    if filename == SELF_FILE:
        return False
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)

# =============================================================
# SCAN FILES
# =============================================================
def scan_files(root):
    results = []

    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in EXIST_ONLY_DIRS]

        dirs.sort()
        files.sort()

        for f in files:
            if f == SELF_FILE:
                continue

            rel = os.path.relpath(os.path.join(base, f), root).replace("\\", "/")

            if f in EXIST_ONLY_FILES:
                results.append(rel)
                continue

            if is_allowed_file(f):
                results.append(rel)

    return results

# =============================================================
# BUILD DIRECTORY TREE
# =============================================================
def build_tree(root):
    lines = []

    def walk(path, prefix=""):
        entries = sorted(os.listdir(path))
        total = len(entries)

        for i, name in enumerate(entries):
            if name == SELF_FILE:
                continue

            full = os.path.join(path, name)
            connector = "└── " if i == total - 1 else "├── "
            lines.append(prefix + connector + name)

            if os.path.isdir(full):
                if name in EXIST_ONLY_DIRS:
                    continue
                new_prefix = prefix + ("    " if i == total - 1 else "│   ")
                walk(full, new_prefix)

    lines.append(os.path.basename(root))
    walk(root)
    return "\n".join(lines)

# =============================================================
# READ FILE CONTENT
# =============================================================
def read_file(fullpath):
    name = os.path.basename(fullpath)

    if name == SELF_FILE:
        return ""

    if name in EXIST_ONLY_FILES:
        return "[File tồn tại – không đọc nội dung theo cấu hình]"

    if any(fullpath.lower().endswith(ext) for ext in TEXT_EXTENSIONS):
        try:
            with open(fullpath, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            return f"[Không đọc được nội dung file – lỗi encoding: {e}]"

    return "[File binary / asset – không hiển thị nội dung]"

# =============================================================
# FILE LIST
# =============================================================
def generate_file_list(files):
    lines = []
    lines.append("================================================================================")
    lines.append(f"                        DANH SÁCH FILE - {len(files)} FILES")
    lines.append("================================================================================\n")

    for i, f in enumerate(files, 1):
        lines.append(f"{i:>3}. {f}")

    lines.append("\n")
    return "\n".join(lines)

# =============================================================
# FILE CONTENTS
# =============================================================
def generate_file_contents(files, root):
    lines = []
    lines.append("================================================================================")
    lines.append("                          NỘI DUNG CHI TIẾT FILE")
    lines.append("================================================================================\n")

    for i, f in enumerate(files, 1):
        fullpath = os.path.join(root, f)

        lines.append("################################################################################")
        lines.append(f"## FILE {i}: {os.path.basename(f)}")
        lines.append(f"## Path: {f}")
        lines.append("################################################################################\n")

        lines.append(read_file(fullpath))
        lines.append("\n\n")

    return "\n".join(lines)

# =============================================================
# MAIN
# =============================================================
def main():
    root = os.path.dirname(os.path.abspath(__file__))
    module_name = os.path.basename(root)

    now = datetime.datetime.now().strftime("%Y-%m-%d_%Hh%M")
    output_file = OUTPUT_NAME or f"{module_name}_DOCUMENTATION_{now}.txt"

    files = sorted(scan_files(root))
    tree_view = build_tree(root)

    # TREE FILE
    with open(TREE_OUTPUT_NAME, "w", encoding="utf-8") as f:
        f.write(tree_view)

    # MAIN DOCUMENT
    output = []
    output.append(make_banner(module_name))
    output.append(generate_file_list(files))
    output.append(generate_file_contents(files, root))

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(output))

    print(f"DONE: {output_file}")
    print(f"TREE: {TREE_OUTPUT_NAME}")

if __name__ == "__main__":
    main()
