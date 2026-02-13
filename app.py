from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here_change_in_production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///diet_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    diet_data = db.relationship('DietData', backref='user', lazy=True, cascade='all, delete-orphan')
    feedback_data = db.relationship('Feedback', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class DietData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    data = db.Column(db.JSON, nullable=False)  # Store all form data as JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'data': self.data,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    helpfulness = db.Column(db.String(50), nullable=False)
    suggestions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'helpfulness': self.helpfulness,
            'suggestions': self.suggestions,
            'created_at': self.created_at.isoformat()
        }

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            return redirect(url_for('dashboard'))
        else:
            return render_template('auth.html', error='Invalid email or password', mode='login')
    
    return render_template('auth.html', mode='login')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if not all([name, email, password, confirm_password]):
            return render_template('auth.html', error='All fields are required', mode='register')
        
        if password != confirm_password:
            return render_template('auth.html', error='Passwords do not match', mode='register')
        
        if User.query.filter_by(email=email).first():
            return render_template('auth.html', error='Email already registered', mode='register')
        
        user = User(name=name, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        session['user_id'] = user.id
        session['user_name'] = user.name
        return redirect(url_for('dashboard'))
    
    return render_template('auth.html', mode='register')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    diet_data = DietData.query.filter_by(user_id=session['user_id']).first()
    
    return render_template('app.html', user=user, diet_data=diet_data.data if diet_data else None)

@app.route('/api/save-diet-data', methods=['POST'])
def save_diet_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        user_id = session['user_id']
        
        # Check if user has existing data
        existing_data = DietData.query.filter_by(user_id=user_id).first()
        
        if existing_data:
            existing_data.data = data
            existing_data.updated_at = datetime.utcnow()
        else:
            new_data = DietData(user_id=user_id, data=data)
            db.session.add(new_data)
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Data saved successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-diet-data', methods=['GET'])
def get_diet_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        diet_data = DietData.query.filter_by(user_id=session['user_id']).first()
        if diet_data:
            return jsonify(diet_data.to_dict())
        else:
            return jsonify({'data': None})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/save-feedback', methods=['POST'])
def save_feedback():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        feedback = Feedback(
            user_id=session['user_id'],
            helpfulness=data.get('helpfulness'),
            suggestions=data.get('suggestions')
        )
        db.session.add(feedback)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Feedback saved'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='127.0.0.1', port=5000)
