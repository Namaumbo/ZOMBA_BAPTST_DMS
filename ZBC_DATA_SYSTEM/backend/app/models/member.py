from datetime import datetime, timezone
from app import db


class MemberDepartment(db.Model):
    __tablename__ = "member_departments"

    member_id = db.Column(db.Integer, db.ForeignKey("members.id", ondelete="CASCADE"), primary_key=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="CASCADE"), primary_key=True)


class Member(db.Model):
    __tablename__ = "members"

    id = db.Column(db.Integer, primary_key=True)
    member_number = db.Column(db.String(20), unique=True, nullable=False)

    # Personal info
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    dob = db.Column(db.Date, nullable=True)
    gender = db.Column(db.Enum("male", "female", "other", name="gender_enum"), nullable=True)
    phone = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    address = db.Column(db.Text, nullable=True)

    # Nationality
    nationality_current = db.Column(db.String(200), nullable=True)
    nationality_at_birth = db.Column(db.String(200), nullable=True)

    # Household members (stored as JSON lists of names)
    household_zbc_members_12plus = db.Column(db.JSON, nullable=True)
    household_non_zbc_members_12plus = db.Column(db.JSON, nullable=True)
    children_nurtured_by_zbc = db.Column(db.JSON, nullable=True)
    children_nurtured_parents_not_zbc = db.Column(db.JSON, nullable=True)

    # Church info
    join_date = db.Column(db.Date, nullable=True)
    status = db.Column(
        db.Enum("active", "inactive", "visitor", name="member_status"),
        nullable=False,
        default="active",
    )
    photo_path = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    departments = db.relationship(
        "Department",
        secondary="member_departments",
        back_populates="members",
        lazy="select",
    )

    def to_dict(self, include_departments: bool = True) -> dict:
        data = {
            "id": self.id,
            "member_number": self.member_number,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": f"{self.first_name} {self.last_name}",
            "dob": self.dob.isoformat() if self.dob else None,
            "gender": self.gender,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "nationality_current": self.nationality_current,
            "nationality_at_birth": self.nationality_at_birth,
            "household_zbc_members_12plus": self.household_zbc_members_12plus or [],
            "household_non_zbc_members_12plus": self.household_non_zbc_members_12plus or [],
            "children_nurtured_by_zbc": self.children_nurtured_by_zbc or [],
            "children_nurtured_parents_not_zbc": self.children_nurtured_parents_not_zbc or [],
            "join_date": self.join_date.isoformat() if self.join_date else None,
            "status": self.status,
            "photo_url": f"/uploads/{self.photo_path}" if self.photo_path else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_departments:
            data["departments"] = [
                {"id": d.id, "name": d.name} for d in self.departments
            ]
        return data
