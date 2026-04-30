from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import datetime

app = Flask(__name__)
CORS(app) # Allow frontend to communicate with backend
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///organicbite.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    token = db.Column(db.String(200), unique=True, nullable=True) # Simple token auth for MVP
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Profile fields
    height = db.Column(db.String(20))
    weight = db.Column(db.String(20))
    allergies = db.Column(db.String(200))
    address = db.Column(db.Text)
    delivery_time = db.Column(db.String(50))
    
    subscriptions = db.relationship('Subscription', backref='user', lazy=True)

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    plan_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='Active')
    start_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    goal = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class MealPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    badge = db.Column(db.String(50))
    description = db.Column(db.Text, nullable=False)
    features = db.Column(db.Text) # comma separated
    price = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(255))

class Blog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    excerpt = db.Column(db.Text)
    content = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    image_url = db.Column(db.String(255))

class PromoCode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    discount_percent = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Integer, nullable=False) # 1 to 5
    comment = db.Column(db.Text, nullable=False)
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Ingredient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False) # 'protein', 'carb', 'veggie'
    calories = db.Column(db.Integer, default=0)
    protein = db.Column(db.Integer, default=0)
    carbs = db.Column(db.Integer, default=0)
    fat = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(255))

class CustomOrder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    protein_id = db.Column(db.Integer, db.ForeignKey('ingredient.id'))
    carb_id = db.Column(db.Integer, db.ForeignKey('ingredient.id'))
    veggie_id = db.Column(db.Integer, db.ForeignKey('ingredient.id'))
    status = db.Column(db.String(20), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# Utility for getting current user
def get_current_user():
    token = request.headers.get('Authorization')
    if token:
        token = token.replace('Bearer ', '')
        return User.query.filter_by(token=token).first()
    return None

# API Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'error': 'Missing data'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    import re
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({'error': 'Invalid email format'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400

    hashed_pw = generate_password_hash(password)
    
    # Auto-assign admin if email matches
    is_admin = True if email == 'admin@organicbite.pk' else False
    
    new_user = User(name=name, email=email, password_hash=hashed_pw, is_admin=is_admin)
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate simple session token
    user.token = str(uuid.uuid4())
    db.session.commit()
    
    return jsonify({
        'token': user.token,
        'user': {'id': user.id, 'name': user.name, 'email': user.email, 'is_admin': user.is_admin}
    }), 200

@app.route('/api/auth/me', methods=['GET'])
def get_me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify({'user': {'id': user.id, 'name': user.name, 'email': user.email, 'is_admin': user.is_admin}})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    user = get_current_user()
    if user:
        user.token = None
        db.session.commit()
    return jsonify({'message': 'Logged out successfully'}), 200

# --- PROTECTED ROUTES ---
@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401
    
    return jsonify({
        'name': user.name,
        'email': user.email,
        'height': user.height or '',
        'weight': user.weight or '',
        'allergies': user.allergies or '',
        'address': user.address or '',
        'delivery_time': user.delivery_time or ''
    })

@app.route('/api/user/profile', methods=['PUT'])
def update_user_profile():
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    user.name = data.get('name', user.name)
    user.height = data.get('height', user.height)
    user.weight = data.get('weight', user.weight)
    user.allergies = data.get('allergies', user.allergies)
    user.address = data.get('address', user.address)
    user.delivery_time = data.get('delivery_time', user.delivery_time)
    
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'})

@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized. Please login first.'}), 401
        
    data = request.get_json()
    plan_name = data.get('plan_name')
    
    if not plan_name:
        return jsonify({'error': 'Missing plan name'}), 400
        
    # Check if user already has an active subscription for this plan
    existing = Subscription.query.filter_by(user_id=user.id, plan_name=plan_name, status='Active').first()
    if existing:
        return jsonify({'error': f'You are already subscribed to {plan_name}'}), 400

    new_sub = Subscription(user_id=user.id, plan_name=plan_name)
    db.session.add(new_sub)
    db.session.commit()
    
    return jsonify({'message': f'Successfully subscribed to {plan_name}'}), 201

@app.route('/api/subscriptions', methods=['GET'])
def get_subscriptions():
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401
    subs = Subscription.query.filter_by(user_id=user.id).all()
    return jsonify([{'id': s.id, 'plan_name': s.plan_name, 'status': s.status, 'start_date': s.start_date.strftime('%Y-%m-%d')} for s in subs])

@app.route('/api/subscriptions/<int:id>/action', methods=['POST'])
def user_subscription_action(id):
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401
    
    sub = Subscription.query.get(id)
    if not sub or sub.user_id != user.id:
        return jsonify({'error': 'Subscription not found'}), 404
        
    data = request.get_json()
    action = data.get('action')
    
    if action == 'cancel' and sub.status == 'Active':
        sub.status = 'Cancelled'
    elif action == 'refund' and sub.status in ['Active', 'Cancelled']:
        sub.status = 'Refund Requested'
    else:
        return jsonify({'error': 'Invalid action or state'}), 400
        
    db.session.commit()
    return jsonify({'message': f'Subscription {action} successful', 'status': sub.status})

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    goal = data.get('goal')
    message = data.get('message')
    
    if not all([name, email, goal, message]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    new_contact = Contact(name=name, email=email, goal=goal, message=message)
    db.session.add(new_contact)
    db.session.commit()
    
    return jsonify({'message': 'Message sent successfully. We will get back to you soon!'}), 201

# --- PUBLIC CMS ROUTES ---
@app.route('/api/mealplans', methods=['GET'])
def get_mealplans():
    plans = MealPlan.query.all()
    return jsonify([{'id': p.id, 'name': p.name, 'badge': p.badge, 'description': p.description, 'features': p.features.split(',') if p.features else [], 'price': p.price, 'image_url': p.image_url} for p in plans])

@app.route('/api/ingredients', methods=['GET'])
def get_ingredients():
    ingredients = Ingredient.query.all()
    return jsonify([
        {
            'id': i.id, 
            'name': i.name, 
            'category': i.category, 
            'calories': i.calories, 
            'protein': i.protein, 
            'carbs': i.carbs, 
            'fat': i.fat,
            'image_url': i.image_url
        } for i in ingredients
    ])

@app.route('/api/custom-order', methods=['POST'])
def create_custom_order():
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    protein_id = data.get('protein_id')
    carb_id = data.get('carb_id')
    veggie_id = data.get('veggie_id')
    
    new_order = CustomOrder(
        user_id=user.id,
        protein_id=protein_id,
        carb_id=carb_id,
        veggie_id=veggie_id
    )
    db.session.add(new_order)
    db.session.commit()
    
    return jsonify({'message': 'Custom meal ordered successfully', 'id': new_order.id}), 201

@app.route('/api/blogs', methods=['GET'])
def get_blogs():
    blogs = Blog.query.order_by(Blog.created_at.desc()).all()
    return jsonify([{'id': b.id, 'title': b.title, 'excerpt': b.excerpt, 'content': b.content, 'author': b.author, 'created_at': b.created_at.strftime('%B %d, %Y'), 'image_url': b.image_url} for b in blogs])

@app.route('/api/blogs/<int:id>', methods=['GET'])
def get_single_blog(id):
    b = Blog.query.get(id)
    if not b: return jsonify({'error': 'Blog not found'}), 404
    return jsonify({'id': b.id, 'title': b.title, 'excerpt': b.excerpt, 'content': b.content, 'author': b.author, 'created_at': b.created_at.strftime('%B %d, %Y'), 'image_url': b.image_url})

@app.route('/api/promo/validate', methods=['GET'])
def validate_promo():
    code = request.args.get('code', '').upper()
    promo = PromoCode.query.filter_by(code=code, is_active=True).first()
    if not promo:
        return jsonify({'error': 'Invalid or expired promo code'}), 404
    return jsonify({'discount_percent': promo.discount_percent, 'code': promo.code})

@app.route('/api/reviews', methods=['GET'])
def get_featured_reviews():
    reviews = Review.query.filter_by(is_featured=True).order_by(Review.created_at.desc()).limit(3).all()
    return jsonify([{'id': r.id, 'name': r.name, 'rating': r.rating, 'comment': r.comment, 'created_at': r.created_at.strftime('%Y-%m-%d')} for r in reviews])

@app.route('/api/reviews', methods=['POST'])
def submit_review():
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    rating = data.get('rating')
    comment = data.get('comment')
    if not rating or not comment: return jsonify({'error': 'Rating and comment required'}), 400
    
    review = Review(user_id=user.id, name=user.name, rating=rating, comment=comment)
    db.session.add(review)
    db.session.commit()
    return jsonify({'message': 'Review submitted for moderation'}), 201

# --- ADMIN ROUTES ---
def admin_required():
    user = get_current_user()
    if not user or not user.is_admin:
        return None
    return user

@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    users = User.query.all()
    return jsonify({'users': [{'id': u.id, 'name': u.name, 'email': u.email, 'is_admin': u.is_admin, 'created_at': u.created_at.strftime('%Y-%m-%d')} for u in users]})

@app.route('/api/admin/subscriptions', methods=['GET'])
def admin_subscriptions():
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    subs = Subscription.query.all()
    result = []
    for s in subs:
        u = User.query.get(s.user_id)
        result.append({
            'id': s.id,
            'user_name': u.name if u else 'Unknown',
            'plan_name': s.plan_name,
            'status': s.status,
            'start_date': s.start_date.strftime('%Y-%m-%d')
        })
    return jsonify(result)

@app.route('/api/admin/subscriptions/<int:id>/action', methods=['POST'])
def admin_subscription_action(id):
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    
    sub = Subscription.query.get(id)
    if not sub: return jsonify({'error': 'Subscription not found'}), 404
    
    data = request.get_json()
    action = data.get('action')
    
    if action == 'cancel' and sub.status != 'Cancelled':
        sub.status = 'Cancelled'
    elif action == 'refund' and sub.status == 'Refund Requested':
        sub.status = 'Refunded'
    else:
        return jsonify({'error': 'Invalid action or state'}), 400
        
    db.session.commit()
    return jsonify({'message': f'Action {action} applied successfully', 'status': sub.status})

@app.route('/api/admin/subscriptions/<int:sub_id>', methods=['PUT', 'DELETE'])
def admin_manage_subscription(sub_id):
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    sub = Subscription.query.get(sub_id)
    if not sub: return jsonify({'error': 'Subscription not found'}), 404
    
    if request.method == 'DELETE':
        db.session.delete(sub)
        db.session.commit()
        return jsonify({'message': 'Subscription deleted'})
    elif request.method == 'PUT':
        data = request.get_json()
        if 'status' in data:
            sub.status = data['status']
            db.session.commit()
            return jsonify({'message': 'Status updated'})
    return jsonify({'error': 'Invalid request'}), 400

@app.route('/api/admin/contacts', methods=['GET'])
def admin_get_contacts():
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    msgs = Contact.query.all()
    return jsonify({'messages': [{'id': m.id, 'name': m.name, 'email': m.email, 'goal': m.goal, 'message': m.message, 'created_at': m.created_at.strftime('%Y-%m-%d')} for m in msgs]})

@app.route('/api/admin/contacts/<int:msg_id>', methods=['DELETE'])
def admin_delete_contact(msg_id):
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    msg = Contact.query.get(msg_id)
    if not msg: return jsonify({'error': 'Message not found'}), 404
    db.session.delete(msg)
    db.session.commit()
    return jsonify({'message': 'Message deleted'})

# --- ADMIN CMS & INSIGHTS ROUTES ---
@app.route('/api/admin/insights', methods=['GET'])
def admin_insights():
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    
    total_users = User.query.count()
    active_subs = Subscription.query.filter_by(status='Active').all()
    total_active_subs = len(active_subs)
    
    # Calculate mock revenue
    total_revenue = 0
    for sub in active_subs:
        plan = MealPlan.query.filter_by(name=sub.plan_name).first()
        if plan: total_revenue += plan.price

    new_messages = Contact.query.count()
    
    return jsonify({
        'total_users': total_users,
        'active_subscriptions': total_active_subs,
        'monthly_revenue': total_revenue,
        'unread_messages': new_messages
    })

@app.route('/api/admin/mealplans', methods=['POST'])
def admin_add_mealplan():
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    new_plan = MealPlan(name=data['name'], badge=data['badge'], description=data['description'], features=data['features'], price=int(data['price']), image_url=data['image_url'])
    db.session.add(new_plan)
    db.session.commit()
    return jsonify({'message': 'Plan created'})

@app.route('/api/admin/mealplans/<int:id>', methods=['DELETE'])
def admin_delete_mealplan(id):
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    plan = MealPlan.query.get(id)
    if plan:
        db.session.delete(plan)
        db.session.commit()
    return jsonify({'message': 'Plan deleted'})

@app.route('/api/admin/mealplans/<int:id>', methods=['PUT'])
def admin_update_mealplan(id):
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    plan = MealPlan.query.get(id)
    if not plan: return jsonify({'error': 'Plan not found'}), 404
    data = request.get_json()
    plan.name = data.get('name', plan.name)
    plan.badge = data.get('badge', plan.badge)
    plan.description = data.get('description', plan.description)
    plan.features = data.get('features', plan.features)
    plan.price = int(data.get('price', plan.price))
    plan.image_url = data.get('image_url', plan.image_url)
    db.session.commit()
    return jsonify({'message': 'Plan updated'})

@app.route('/api/admin/blogs', methods=['POST'])
def admin_add_blog():
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    new_blog = Blog(title=data['title'], excerpt=data['excerpt'], content=data['content'], author='Admin', image_url=data['image_url'])
    db.session.add(new_blog)
    db.session.commit()
    return jsonify({'message': 'Blog created'})

@app.route('/api/admin/blogs/<int:id>', methods=['DELETE'])
def admin_delete_blog(id):
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    blog = Blog.query.get(id)
    if blog:
        db.session.delete(blog)
        db.session.commit()
    return jsonify({'message': 'Blog deleted'})

@app.route('/api/admin/blogs/<int:id>', methods=['PUT'])
def admin_update_blog(id):
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    blog = Blog.query.get(id)
    if not blog: return jsonify({'error': 'Blog not found'}), 404
    data = request.get_json()
    blog.title = data.get('title', blog.title)
    blog.excerpt = data.get('excerpt', blog.excerpt)
    blog.content = data.get('content', blog.content)
    blog.image_url = data.get('image_url', blog.image_url)
    db.session.commit()
    return jsonify({'message': 'Blog updated'})

@app.route('/api/admin/promos', methods=['GET', 'POST'])
def admin_promos():
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    if request.method == 'POST':
        data = request.get_json()
        code = data.get('code', '').upper()
        discount = data.get('discount_percent')
        if not code or not discount: return jsonify({'error': 'Missing fields'}), 400
        new_promo = PromoCode(code=code, discount_percent=discount)
        db.session.add(new_promo)
        db.session.commit()
        return jsonify({'message': 'Promo code created'})
    
    promos = PromoCode.query.all()
    return jsonify([{'id': p.id, 'code': p.code, 'discount_percent': p.discount_percent, 'is_active': p.is_active} for p in promos])

@app.route('/api/admin/promos/<int:id>', methods=['DELETE'])
def admin_delete_promo(id):
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    promo = PromoCode.query.get(id)
    if promo:
        db.session.delete(promo)
        db.session.commit()
    return jsonify({'message': 'Promo deleted'})

@app.route('/api/admin/reviews', methods=['GET'])
def admin_get_reviews():
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    return jsonify([{'id': r.id, 'name': r.name, 'rating': r.rating, 'comment': r.comment, 'is_featured': r.is_featured, 'created_at': r.created_at.strftime('%Y-%m-%d')} for r in reviews])

@app.route('/api/admin/reviews/<int:id>', methods=['PUT', 'DELETE'])
def admin_manage_review(id):
    if not admin_required(): return jsonify({'error': 'Admin access required'}), 403
    review = Review.query.get(id)
    if not review: return jsonify({'error': 'Review not found'}), 404
    
    if request.method == 'DELETE':
        db.session.delete(review)
        db.session.commit()
        return jsonify({'message': 'Review deleted'})
    elif request.method == 'PUT':
        data = request.get_json()
        if 'is_featured' in data:
            review.is_featured = data['is_featured']
        db.session.commit()
        return jsonify({'message': 'Review updated'})


# Initialize database and seed data (runs on import for gunicorn compatibility)
with app.app_context():
    db.create_all()
    
    # Create initial admin account if not exists
    if not User.query.filter_by(email='admin@organicbite.pk').first():
        hashed_pw = generate_password_hash('admin123')
        admin = User(name='Admin User', email='admin@organicbite.pk', password_hash=hashed_pw, is_admin=True)
        db.session.add(admin)
        
        # Seed Initial Meal Plans
        p1 = MealPlan(name='Cutting Plan', badge='Fat Loss', description='Low calorie, high protein meals designed to preserve muscle while shedding fat. Portion controlled for extreme precision.', features='~350-450 kcal per meal,Complex low-GI carbs,High satiety ingredients', price=9500, image_url='assets/cutting.png')
        p2 = MealPlan(name='Lean Performance Plan', badge='Maintenance', description='Perfectly balanced macronutrients for working professionals, athletes, and those maintaining a healthy lifestyle.', features='~500-600 kcal per meal,Balanced 40/30/30 Macros,Optimized for daily energy', price=10500, image_url='assets/lean.png')
        p3 = MealPlan(name='Bulking Plan', badge='Muscle Gain', description='High calorie, dense meals to fuel intense workouts and maximize muscle hypertrophy without the dirty bulk.', features='~700-900 kcal per meal,Extra protein & clean carbs,Muscle recovery focus', price=12000, image_url='assets/bulking.png')
        db.session.add_all([p1, p2, p3])
        
        # Seed Initial Blogs
        b1 = Blog(title='Why Organic Food is Essential for Athletes', excerpt='Discover the hidden benefits of removing pesticides from your diet and how it boosts recovery.', content='Full content goes here...', author='Dr. Sadia', image_url='assets/hero.png')
        b2 = Blog(title='The Ultimate Guide to Macro Tracking', excerpt='Stop guessing. Learn exactly how to calibrate your meals for muscle gain or fat loss.', content='Full content goes here...', author='Ahmed', image_url='assets/lean.png')
        b3 = Blog(title='How Cold-Chain Logistics Preserves Nutrients', excerpt='Our delivery system ensures your food stays fresh and nutritionally intact until you eat it.', content='Full content goes here...', author='Marwah', image_url='assets/cutting.png')
        db.session.add_all([b1, b2, b3])
        
        # Seed Promo Code
        if not PromoCode.query.first():
            p_code = PromoCode(code='SUMMER20', discount_percent=20)
            db.session.add(p_code)
            
        # Seed Reviews
        if not Review.query.first():
            r1 = Review(user_id=1, name='Sarah M.', rating=5, comment='The Lean Performance Plan completely changed my work week. The food is always fresh and perfectly portioned.', is_featured=True)
            r2 = Review(user_id=1, name='Hassan K.', rating=5, comment='Finally, a meal prep service in Lahore that understands macros. Highly recommended for anyone taking fitness seriously.', is_featured=True)
            r3 = Review(user_id=1, name='Fatima Z.', rating=5, comment='Delicious! The ingredients taste so organic and I have lost 3kg on the Cutting plan already.', is_featured=True)
            db.session.add_all([r1, r2, r3])
        
        db.session.commit()
        print("Initial admin account and CMS data seeded.")

    # Seed ingredients if not present
    if not Ingredient.query.first():
        from seed_ingredients import seed_ingredients
        seed_ingredients()
        print("Ingredients seeded.")

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

