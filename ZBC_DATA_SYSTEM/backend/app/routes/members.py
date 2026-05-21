from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from app import db
from app.models.member import Member
from app.models.department import Department
from app.utils.decorators import roles_required
from app.utils.image import allowed_file, save_member_photo, delete_member_photo
from app.utils.member_number import generate_member_number
from datetime import date

members_bp = Blueprint("members", __name__)


def parse_date(value):
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


@members_bp.get("/cards")
@jwt_required()
def get_cards():
    from_id = request.args.get("from_id", type=int)
    to_id = request.args.get("to_id", type=int)
    if from_id is None or to_id is None:
        return jsonify({"error": "from_id and to_id are required"}), 400
    if to_id < from_id:
        return jsonify({"error": "to_id must be >= from_id"}), 400
    members = (
        Member.query
        .filter(Member.id >= from_id, Member.id <= to_id)
        .order_by(Member.id)
        .all()
    )
    return jsonify([m.to_dict() for m in members]), 200


@members_bp.get("")
@jwt_required()
def list_members():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    department_id = request.args.get("department_id", type=int)

    query = Member.query

    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Member.first_name.ilike(like),
                Member.last_name.ilike(like),
                Member.member_number.ilike(like),
                Member.phone.ilike(like),
                Member.email.ilike(like),
            )
        )
    if status:
        query = query.filter(Member.status == status)
    if department_id:
        query = query.filter(Member.departments.any(Department.id == department_id))

    pagination = query.order_by(Member.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "members": [m.to_dict(include_departments=False) for m in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page,
        "per_page": per_page,
    }), 200


@members_bp.post("")
@roles_required("admin", "data-entry")
def create_member():
    data = request.get_json(silent=True) or {}

    required = ["first_name", "last_name"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    last = Member.query.order_by(Member.id.desc()).first()
    last_id = last.id if last else 0
    member_number = generate_member_number(last_id)

    member = Member(
        member_number=member_number,
        first_name=data["first_name"].strip(),
        last_name=data["last_name"].strip(),
        dob=parse_date(data.get("dob")),
        gender=data.get("gender"),
        phone=data.get("phone", "").strip() or None,
        email=data.get("email", "").strip() or None,
        address=data.get("address", "").strip() or None,
        join_date=parse_date(data.get("join_date")),
        status=data.get("status", "active"),
        membership_type=data.get("membership_type", "full"),
        nationality_current=data.get("nationality_current", "").strip() or None,
        nationality_at_birth=data.get("nationality_at_birth", "").strip() or None,
        household_zbc_members_12plus=data.get("household_zbc_members_12plus") or [],
        household_non_zbc_members_12plus=data.get("household_non_zbc_members_12plus") or [],
        children_nurtured_by_zbc=data.get("children_nurtured_by_zbc") or [],
        children_nurtured_parents_not_zbc=data.get("children_nurtured_parents_not_zbc") or [],
    )

    department_ids = data.get("department_ids", [])
    if department_ids:
        depts = Department.query.filter(Department.id.in_(department_ids)).all()
        member.departments = depts

    db.session.add(member)
    db.session.commit()
    return jsonify(member.to_dict()), 201


@members_bp.get("/<int:member_id>")
@jwt_required()
def get_member(member_id):
    member = db.get_or_404(Member, member_id)
    return jsonify(member.to_dict()), 200


@members_bp.put("/<int:member_id>")
@roles_required("admin", "data-entry")
def update_member(member_id):
    member = db.get_or_404(Member, member_id)
    data = request.get_json(silent=True) or {}

    for field in ("first_name", "last_name", "gender", "phone", "email", "address", "status",
                  "membership_type", "nationality_current", "nationality_at_birth"):
        if field in data:
            setattr(member, field, data[field].strip() if isinstance(data[field], str) else data[field])

    for list_field in ("household_zbc_members_12plus", "household_non_zbc_members_12plus",
                       "children_nurtured_by_zbc", "children_nurtured_parents_not_zbc"):
        if list_field in data:
            setattr(member, list_field, data[list_field] or [])

    if "dob" in data:
        member.dob = parse_date(data["dob"])
    if "join_date" in data:
        member.join_date = parse_date(data["join_date"])

    if "department_ids" in data:
        depts = Department.query.filter(Department.id.in_(data["department_ids"])).all()
        member.departments = depts

    db.session.commit()
    return jsonify(member.to_dict()), 200


@members_bp.delete("/<int:member_id>")
@roles_required("admin")
def delete_member(member_id):
    member = db.get_or_404(Member, member_id)
    delete_member_photo(member.photo_path)
    db.session.delete(member)
    db.session.commit()
    return jsonify({"message": "Member deleted"}), 200


@members_bp.post("/<int:member_id>/photo")
@roles_required("admin", "data-entry")
def upload_photo(member_id):
    member = db.get_or_404(Member, member_id)

    if "photo" not in request.files:
        return jsonify({"error": "No photo file provided"}), 400

    file = request.files["photo"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    # Remove old photo
    delete_member_photo(member.photo_path)

    filename = save_member_photo(file)
    member.photo_path = filename
    db.session.commit()

    return jsonify({"photo_url": f"/uploads/{filename}"}), 200
