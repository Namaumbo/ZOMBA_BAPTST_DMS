"""Run once to seed the database with an admin user and sample departments."""
from app import create_app, db
from app.models.user import User
from app.models.department import Department

app = create_app()

with app.app_context():
    db.create_all()

    if not User.query.filter_by(username="admin").first():
        admin = User(username="admin", email="admin@church.org", role="admin")
        admin.set_password("admin123")
        db.session.add(admin)
        print("Created admin user (password: admin123)")

    default_departments = [
        ("Choir", "Worship and music ministry"),
        ("Ushers", "Hospitality and ushering"),
        ("Youth", "Youth ministry"),
        ("Women's Guild", "Women's fellowship"),
        ("Men's Fellowship", "Men's fellowship"),
        ("Children", "Children's ministry"),
        ("Prayer Team", "Intercessory prayer team"),
    ]

    for name, desc in default_departments:
        if not Department.query.filter_by(name=name).first():
            db.session.add(Department(name=name, description=desc))
            print(f"Created department: {name}")

    db.session.commit()
    print("Seed complete.")
