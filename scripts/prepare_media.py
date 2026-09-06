from __future__ import annotations

import json
import re
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageOps


PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT.parent / "作品展示"
PUBLIC = PROJECT / "public" / "media"
CATALOG = PROJECT / "app" / "media-catalog.json"

VIDEO_SERIES = {
    "上合组织": ("上合组织国家优秀影视作品展映周", 0),
    "中秋晚会": ("央视中秋晚会", 1),
    "中国短视频大会": ("中国短视频大会 第二季", 2),
    "微短剧大会": ("CMG中国微短剧盛典", 3),
    "其他实习作品": ("实习作品", 4),
    "艺人视频": ("艺人短视频", 5),
    "其他校内作品": ("校园影像", 6),
    "AI作品": ("AI影像实验", 7),
}

DESIGN_SERIES = {
    "短视频封面": ("短视频封面", 0),
    "文创设计": ("白塔寺与石狮文创", 1),
    "海报": ("海报设计", 2),
    "艺人宣传": ("艺人视觉宣传", 3),
    "平面设计": ("澜 明信片", 4),
}


def clean_title(path: Path) -> str:
    title = path.stem
    for token in ["中国短视频大会-", "中秋晚会-", "-水印版", "-封面"]:
        title = title.replace(token, "")
    return re.sub(r"\s+", " ", title).strip()


def media_info(path: Path) -> dict:
    result = subprocess.run(
        ["/usr/bin/avmediainfo", str(path)],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    duration_match = re.search(r"^Duration:\s+([0-9.]+) seconds", result, re.M)
    size_match = re.search(r"^\s*Dimensions:\s+(\d+) x (\d+)", result, re.M)
    duration = float(duration_match.group(1)) if duration_match else 0
    width = int(size_match.group(1)) if size_match else 16
    height = int(size_match.group(2)) if size_match else 9
    return {"duration": duration, "width": width, "height": height}


def run_convert(source: Path, output: Path, preset: str, start=0.0, duration=None):
    if output.exists() and output.stat().st_size > 10_000:
        return
    args = [
        "/usr/bin/avconvert",
        "-s",
        str(source),
        "-p",
        preset,
        "-o",
        str(output),
        "--replace",
    ]
    if start:
        args.extend(["--start", f"{start:.2f}"])
    if duration:
        args.extend(["--duration", f"{duration:.2f}"])
    subprocess.run(args, check=True, capture_output=True, text=True)


def build_preview(job: tuple[Path, Path, Path, float]):
    source, preview, poster, duration = job
    start = min(max(duration * 0.12, 1.0), max(duration - 8.0, 0))
    clip_duration = min(8.0, max(duration - start, 1.0))
    run_convert(source, preview, "PresetAppleM4V480pSD", start, clip_duration)
    if not poster.exists():
        scratch = PUBLIC / "poster-scratch"
        scratch.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["/usr/bin/qlmanage", "-t", "-s", "960", "-o", str(scratch), str(source)],
            check=True,
            capture_output=True,
            text=True,
        )
        generated = scratch / f"{source.name}.png"
        if generated.exists():
            with Image.open(generated) as im:
                image = ImageOps.exif_transpose(im).convert("RGB")
                image.thumbnail((960, 960), Image.Resampling.LANCZOS)
                image.save(poster, "WEBP", quality=80, method=6)
            generated.unlink()


def build_full(job: tuple[Path, Path]):
    source, output = job
    run_convert(source, output, "PresetAppleM4V720pHD")


def main():
    for folder in ["images", "previews", "full", "posters", "documents"]:
        (PUBLIC / folder).mkdir(parents=True, exist_ok=True)

    videos = []
    preview_jobs = []
    full_jobs = []
    video_files = [
        path
        for path in SOURCE.rglob("*")
        if path.suffix.lower() in {".mp4", ".mov"}
    ]

    def video_key(path: Path):
        series_key = "AI作品" if "AI作品" in path.parts else path.parent.name
        return VIDEO_SERIES.get(series_key, (series_key, 99))[1], path.name

    for index, path in enumerate(sorted(video_files, key=video_key), 1):
        ident = f"video-{index:02d}"
        series_key = "AI作品" if "AI作品" in path.parts else path.parent.name
        series = VIDEO_SERIES.get(series_key, (series_key, 99))[0]
        info = media_info(path)
        orientation = "portrait" if info["height"] > info["width"] else "landscape"
        preview = PUBLIC / "previews" / f"{ident}.m4v"
        full = PUBLIC / "full" / f"{ident}.m4v"
        poster = PUBLIC / "posters" / f"{ident}.webp"
        preview_jobs.append((path, preview, poster, info["duration"]))
        full_jobs.append((path, full))
        videos.append(
            {
                "id": ident,
                "title": clean_title(path),
                "series": series,
                "kind": "video",
                "orientation": orientation,
                "duration": round(info["duration"]),
                "preview": f"/media/previews/{ident}.m4v",
                "full": f"/media/full/{ident}.m4v",
                "poster": f"/media/posters/{ident}.webp",
            }
        )

    images = []
    image_files = [
        path
        for path in SOURCE.rglob("*")
        if path.suffix.lower() in {".jpg", ".jpeg", ".png"}
    ]

    def image_key(path: Path):
        if "摄影作品" in path.parts:
            series_key = "人物摄影" if "人物摄影" in path.stem else "景物摄影"
            return 1, 0 if series_key == "人物摄影" else 1, path.name
        series_key = path.parent.name if path.parent.name != "平面设计" else "平面设计"
        return 0, DESIGN_SERIES.get(series_key, (series_key, 99))[1], path.name

    for index, path in enumerate(sorted(image_files, key=image_key), 1):
        ident = f"image-{index:02d}"
        if "摄影作品" in path.parts:
            category = "photography"
            series = "人物摄影" if "人物摄影" in path.stem else "景物摄影"
        else:
            category = "design"
            series_key = path.parent.name if path.parent.name != "平面设计" else "平面设计"
            series = DESIGN_SERIES.get(series_key, (series_key, 99))[0]
        output = PUBLIC / "images" / f"{ident}.webp"
        with Image.open(path) as source_image:
            image = ImageOps.exif_transpose(source_image).convert("RGB")
            width, height = image.size
            image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
            if not output.exists():
                image.save(output, "WEBP", quality=84, method=6)
        images.append(
            {
                "id": ident,
                "title": clean_title(path),
                "series": series,
                "kind": category,
                "orientation": "portrait" if height > width else "landscape",
                "src": f"/media/images/{ident}.webp",
            }
        )

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(build_preview, job) for job in preview_jobs]
        for future in as_completed(futures):
            future.result()

    report_source = SOURCE / "文字作品" / "35万字口述史报告.docx"
    report_thumb = PUBLIC / "documents" / "oral-history-cover.webp"
    if not report_thumb.exists():
        scratch = PUBLIC / "document-scratch"
        scratch.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["/usr/bin/qlmanage", "-t", "-s", "1400", "-o", str(scratch), str(report_source)],
            check=True,
            capture_output=True,
            text=True,
        )
        generated = scratch / f"{report_source.name}.png"
        with Image.open(generated) as im:
            image = ImageOps.exif_transpose(im).convert("RGB")
            image.thumbnail((1200, 1600), Image.Resampling.LANCZOS)
            image.save(report_thumb, "WEBP", quality=84, method=6)
        shutil.rmtree(scratch)

    CATALOG.write_text(
        json.dumps({"videos": videos, "images": images}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(build_full, job) for job in full_jobs]
        for future in as_completed(futures):
            future.result()

    scratch = PUBLIC / "poster-scratch"
    if scratch.exists():
        shutil.rmtree(scratch)


if __name__ == "__main__":
    main()
