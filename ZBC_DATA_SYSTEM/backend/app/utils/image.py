import os
import uuid
from PIL import Image
from flask import current_app


THUMBNAIL_SIZE = (400, 400)


def allowed_file(filename: str) -> bool:
    allowed = current_app.config.get("ALLOWED_EXTENSIONS", {"png", "jpg", "jpeg", "webp"})
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed


def save_member_photo(file_storage) -> str:
    """Save uploaded photo, resize to thumbnail, return relative filename."""
    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    filepath = os.path.join(upload_folder, filename)

    img = Image.open(file_storage)
    img = img.convert("RGB")
    img.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
    img.save(filepath, optimize=True, quality=85)

    return filename


def delete_member_photo(photo_path: str) -> None:
    if not photo_path:
        return
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    filepath = os.path.join(upload_folder, photo_path)
    if os.path.exists(filepath):
        os.remove(filepath)
