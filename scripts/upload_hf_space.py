#!/usr/bin/env python3
"""Create (if needed) and upload a staged folder to a Hugging Face Docker Space.

Usage: HF_TOKEN=... HF_SPACE_ID=<user>/<space> scripts/upload_hf_space.py [FOLDER]
Requires: pip install huggingface_hub
"""
import os
import sys

from huggingface_hub import HfApi

folder = sys.argv[1] if len(sys.argv) > 1 else "build/hf-space"
space_id = os.environ.get("HF_SPACE_ID", "").strip()
token = os.environ.get("HF_TOKEN", "").strip()

if not space_id or "/" not in space_id:
    sys.exit("HF_SPACE_ID must be '<hf-user>/<space-name>'")
if not token:
    sys.exit("HF_TOKEN is not set")

api = HfApi(token=token)
api.create_repo(repo_id=space_id, repo_type="space", space_sdk="docker", exist_ok=True)
api.upload_folder(
    folder_path=folder,
    repo_id=space_id,
    repo_type="space",
    commit_message="Deploy from GitHub Actions",
)
print(f"Uploaded {folder} to https://huggingface.co/spaces/{space_id}")
