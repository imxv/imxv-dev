"""Sync blog posts from S3 (Obsidian Remote Save) to local content directory."""

import os
import boto3

POSTS_DIR = "src/content/posts"
S3_PREFIX = "blog/"

s3 = boto3.client(
    "s3",
    endpoint_url=os.environ["S3_ENDPOINT"],
    region_name=os.environ["S3_REGION"],
    aws_access_key_id=os.environ["S3_ACCESS_KEY"],
    aws_secret_access_key=os.environ["S3_SECRET_KEY"],
)
bucket = os.environ["S3_BUCKET"]

os.makedirs(POSTS_DIR, exist_ok=True)

# List all files in S3 blog/ prefix
s3_files = set()
paginator = s3.get_paginator("list_objects_v2")
for page in paginator.paginate(Bucket=bucket, Prefix=S3_PREFIX):
    for obj in page.get("Contents", []):
        key = obj["Key"]
        # Skip the directory marker and non-markdown files
        rel = key[len(S3_PREFIX):]
        if not rel or not rel.endswith((".md", ".mdx")):
            continue
        s3_files.add(rel)

        local_path = os.path.join(POSTS_DIR, rel)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        # Download file
        s3.download_file(bucket, key, local_path)
        print(f"Downloaded: {key} -> {local_path}")

# Remove local files that no longer exist in S3
for fname in os.listdir(POSTS_DIR):
    if fname.endswith((".md", ".mdx")) and fname not in s3_files:
        path = os.path.join(POSTS_DIR, fname)
        os.remove(path)
        print(f"Removed: {path}")

print(f"Sync complete. {len(s3_files)} files.")
