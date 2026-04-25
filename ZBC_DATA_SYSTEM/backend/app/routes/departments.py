from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.department import Department
from app.utils.decorators import roles_required

departments_bp = Blueprint("departments", __name__)


@departments_bp.get("")
@jwt_required()
def list_departments():
    departments = Department.query.order_by(Department.name).all()
    return jsonify([d.to_dict() for d in departments]), 200


@departments_bp.post("")
@roles_required("admin")
def create_department():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    if Department.query.filter_by(name=name).first():
        return jsonify({"error": "Department already exists"}), 409

    dept = Department(name=name, description=data.get("description", "").strip() or None)
    db.session.add(dept)
    db.session.commit()
    return jsonify(dept.to_dict()), 201


@departments_bp.get("/<int:dept_id>")
@jwt_required()
def get_department(dept_id):
    dept = db.get_or_404(Department, dept_id)
    return jsonify(dept.to_dict()), 200


@departments_bp.put("/<int:dept_id>")
@roles_required("admin")
def update_department(dept_id):
    dept = db.get_or_404(Department, dept_id)
    data = request.get_json(silent=True) or {}
    if "name" in data:
        dept.name = data["name"].strip()
    if "description" in data:
        dept.description = data["description"].strip() or None
    db.session.commit()
    return jsonify(dept.to_dict()), 200


@departments_bp.delete("/<int:dept_id>")
@roles_required("admin")
def delete_department(dept_id):
    dept = db.get_or_404(Department, dept_id)
    db.session.delete(dept)
    db.session.commit()
    return jsonify({"message": "Department deleted"}), 200
