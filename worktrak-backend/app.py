from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["https://goalmap-henna.vercel.app"])

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///worktrak.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'super-secret-key')
jwt = JWTManager(app)
db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    activities = db.relationship('Activity', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username
        }

# Activity model
class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    minutes = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'minutes': self.minutes,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'user_id': self.user_id
        }

# Create database tables
with app.app_context():
    db.create_all()

# Registration endpoint
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        access_token = create_access_token(identity=user.id)
        return jsonify({'access_token': access_token, 'user': user.to_dict()}), 200
    return jsonify({'error': 'Invalid username or password'}), 401

# Log work (protected)
@app.route('/log', methods=['POST'])
@jwt_required()
def log_work():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        title = data.get('title')
        category = data.get('category')
        minutes = int(data.get('minutes', 0))
        date_str = data.get('date')
        if not all([title, category, minutes, date_str]):
            return jsonify({'error': 'Missing required fields'}), 400
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        activity = Activity(
            title=title,
            category=category,
            minutes=minutes,
            date=date,
            user_id=user_id
        )
        db.session.add(activity)
        db.session.commit()
        return jsonify({'message': 'Activity logged successfully', 'activity': activity.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Get logs (protected)
@app.route('/logs', methods=['GET'])
@jwt_required()
def get_logs():
    try:
        user_id = get_jwt_identity()
        category = request.args.get('category')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        query = Activity.query.filter_by(user_id=user_id)
        if category and category != 'All':
            query = query.filter_by(category=category)
        if start_date:
            query = query.filter(Activity.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(Activity.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        activities = query.order_by(Activity.date.desc()).all()
        return jsonify({'logs': [activity.to_dict() for activity in activities]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Weekly stats (protected)
@app.route('/stats/weekly', methods=['GET'])
@jwt_required()
def get_weekly_stats():
    try:
        user_id = get_jwt_identity()
        category = request.args.get('category')
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        query = Activity.query.filter(
            Activity.user_id == user_id,
            Activity.date >= week_start,
            Activity.date <= week_end
        )
        if category and category != 'All':
            query = query.filter_by(category=category)
        activities = query.all()
        daily_stats = {}
        for activity in activities:
            date_str = activity.date.isoformat()
            if date_str not in daily_stats:
                daily_stats[date_str] = {}
            if activity.category not in daily_stats[date_str]:
                daily_stats[date_str][activity.category] = 0
            daily_stats[date_str][activity.category] += activity.minutes
        total_minutes = sum(activity.minutes for activity in activities)
        category_totals = {}
        for activity in activities:
            if activity.category not in category_totals:
                category_totals[activity.category] = 0
            category_totals[activity.category] += activity.minutes
        return jsonify({
            'daily_stats': daily_stats,
            'total_minutes': total_minutes,
            'category_totals': category_totals,
            'week_start': week_start.isoformat(),
            'week_end': week_end.isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
