from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///worktrak.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define the Activity model
class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    minutes = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'minutes': self.minutes,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat()
        }

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/log', methods=['POST'])
def log_work():
    try:
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
            date=date
        )
        
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Activity logged successfully',
            'activity': activity.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/logs', methods=['GET'])
def get_logs():
    try:
        category = request.args.get('category')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Activity.query
        
        if category and category != 'All':
            query = query.filter_by(category=category)
            
        if start_date:
            query = query.filter(Activity.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
            
        if end_date:
            query = query.filter(Activity.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
            
        activities = query.order_by(Activity.date.desc()).all()
        
        return jsonify({
            'logs': [activity.to_dict() for activity in activities]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stats/weekly', methods=['GET'])
def get_weekly_stats():
    try:
        category = request.args.get('category')
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        query = Activity.query.filter(
            Activity.date >= week_start,
            Activity.date <= week_end
        )
        
        if category and category != 'All':
            query = query.filter_by(category=category)
            
        activities = query.all()
        
        # Group activities by date and category
        daily_stats = {}
        for activity in activities:
            date_str = activity.date.isoformat()
            if date_str not in daily_stats:
                daily_stats[date_str] = {}
            if activity.category not in daily_stats[date_str]:
                daily_stats[date_str][activity.category] = 0
            daily_stats[date_str][activity.category] += activity.minutes
            
        # Calculate totals
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
