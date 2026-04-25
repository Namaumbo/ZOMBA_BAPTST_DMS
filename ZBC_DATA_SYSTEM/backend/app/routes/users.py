from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app import db
from app.models.user import User
from app.utils.decorators import roles_required

users_bp = Blueprint("users", __name__)


@users_bp.get("")
@roles_required("admin")
def list_users():
    users = User.query.order_by(User.username).all()
    return jsonify([u.to_dict() for u in users]), 200


@users_bp.post("")
@roles_required("admin")
def create_user():
    data = request.get_json(silent=True) or {}
    for field in ("username", "email", "password", "role"):
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    if data["role"] not in ("admin", "data-entry", "viewer"):
        return jsonify({"error": "Invalid role"}), 400

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already taken"}), 409

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        username=data["username"].strip(),
        email=data["email"].strip(),
        role=data["role"],
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@users_bp.get("/<int:user_id>")
@roles_required("admin")
def get_user(user_id):
    user = db.get_or_404(User, user_id)
    return jsonify(user.to_dict()), 200


@users_bp.put("/<int:user_id>")
@roles_required("admin")
def update_user(user_id):
    user = db.get_or_404(User, user_id)
    data = request.get_json(silent=True) or {}

    if "email" in data:
        user.email = data["email"].strip()
    if "role" in data:
        if data["role"] not in ("admin", "data-entry", "viewer"):
            return jsonify({"error": "Invalid role"}), 400
        user.role = data["role"]
    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    if "password" in data and data["password"]:
        user.set_password(data["password"])

    db.session.commit()
    return jsonify(user.to_dict()), 200


@users_bp.delete("/<int:user_id>")
@roles_required("admin")
def delete_user(user_id):
    current_id = int(get_jwt_identity())
    if current_id == user_id:
        return jsonify({"error": "Cannot delete your own account"}), 400
    user = db.get_or_404(User, user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200
