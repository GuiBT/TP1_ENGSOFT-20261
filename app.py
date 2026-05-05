from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate

from config import Config
from database import db
from routes import main_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app)
    db.init_app(app)
    Migrate(app, db)
    app.register_blueprint(main_bp)
    return app


app = create_app()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
