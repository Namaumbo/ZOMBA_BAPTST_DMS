import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from config import config_map

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(env: str = None) -> Flask:
    env = env or os.environ.get("FLASK_ENV", "development")
    if env == "production" and not os.environ.get("DATABASE_URL"):
        raise RuntimeError(
            "DATABASE_URL is required when FLASK_ENV=production. "
            "Pass it at runtime, e.g. "
            "docker run -e DATABASE_URL=postgresql://user:pass@host:5432/church_dms ..."
        )
    app = Flask(__name__, static_folder="../uploads", static_url_path="/uploads")
    app.config.from_object(config_map.get(env, config_map["default"]))

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors_origins = [
        origin.strip()
        for origin in str(app.config.get("CORS_ORIGINS", "")).split(",")
        if origin.strip()
    ]
    CORS(app, resources={r"/api/*": {"origins": cors_origins or "*"}})

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.members import members_bp
    from app.routes.departments import departments_bp
    from app.routes.reports import reports_bp
    from app.routes.users import users_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(members_bp, url_prefix="/api/v1/members")
    app.register_blueprint(departments_bp, url_prefix="/api/v1/departments")
    app.register_blueprint(reports_bp, url_prefix="/api/v1/reports")
    app.register_blueprint(users_bp, url_prefix="/api/v1/users")

    @app.get("/api/v1/health")
    def health_check():
        return {"status": "ok"}, 200

    return app
