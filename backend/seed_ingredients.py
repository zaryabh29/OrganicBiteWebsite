from app import app, db, Ingredient

def seed_ingredients():
    with app.app_context():
        # Clear existing ingredients
        # db.session.query(Ingredient).delete()
        
        ingredients = [
            # Proteins
            Ingredient(name="Grilled Chicken Breast", category="protein", calories=165, protein=31, carbs=0, fat=4, image_url="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=200"),
            Ingredient(name="Organic Grass-Fed Beef", category="protein", calories=250, protein=26, carbs=0, fat=15, image_url="https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=200"),
            Ingredient(name="Seared Atlantic Salmon", category="protein", calories=208, protein=20, carbs=0, fat=13, image_url="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=200"),
            Ingredient(name="Tofu Steaks", category="protein", calories=80, protein=8, carbs=2, fat=5, image_url="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200"),
            
            # Carbs
            Ingredient(name="Quinoa Mix", category="carb", calories=120, protein=4, carbs=21, fat=2, image_url="https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=200"),
            Ingredient(name="Sweet Potato Mash", category="carb", calories=86, protein=1.6, carbs=20, fat=0.1, image_url="https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?auto=format&fit=crop&q=80&w=200"),
            Ingredient(name="Brown Basmati Rice", category="carb", calories=111, protein=2.6, carbs=23, fat=0.9, image_url="https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200"),
            Ingredient(name="Roasted Baby Potatoes", category="carb", calories=77, protein=2, carbs=17, fat=0.1, image_url="https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?auto=format&fit=crop&q=80&w=200"),
            
            # Veggies
            Ingredient(name="Steamed Broccoli", category="veggie", calories=34, protein=2.8, carbs=7, fat=0.4, image_url="https://images.unsplash.com/photo-1452960962994-acf4fd70b632?auto=format&fit=crop&q=80&w=200"),
            Ingredient(name="Sautéed Kale & Garlic", category="veggie", calories=49, protein=4, carbs=9, fat=1, image_url="https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&q=80&w=200"),
            Ingredient(name="Grilled Asparagus", category="veggie", calories=20, protein=2.2, carbs=3.7, fat=0.1, image_url="https://images.unsplash.com/photo-1515471204579-2e6b7ed03b42?auto=format&fit=crop&q=80&w=200"),
            Ingredient(name="Rainbow Roasted Carrots", category="veggie", calories=41, protein=0.9, carbs=10, fat=0.2, image_url="https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=200"),
        ]
        
        for ing in ingredients:
            if not Ingredient.query.filter_by(name=ing.name).first():
                db.session.add(ing)
        
        db.session.commit()
        print("Ingredients seeded successfully!")

if __name__ == "__main__":
    seed_ingredients()
