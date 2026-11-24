import json
import re
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.database import get_db
from app.models.gig import Gig
from app.models.order import Order
from app.models.user import User
from app.services.auth_service import get_current_user_optional

router = APIRouter(prefix="/api/gigs", tags=["Gigs & Recommendations"])


def parse_natural_language_query(query: str):
    """
    Parses natural language searches like:
    - 'Python tutoring under ₹500'
    - 'Machine learning project guidance'
    - 'Java programming mentor'
    - 'Resume review with delivery within two days'
    Extracts constraints like max_price, max_days, and cleans the search keywords.
    """
    clean_q = query.strip()
    extracted_max_price = None
    extracted_max_days = None

    # Price pattern: under/below/less than ₹/rs 500, under 500, <= 500
    price_match = re.search(r'(?:under|below|less than|within|max|<=)\s*(?:₹|rs\.?|inr)?\s*(\d+)', clean_q, re.IGNORECASE)
    if price_match:
        try:
            extracted_max_price = float(price_match.group(1))
            clean_q = re.sub(r'(?:under|below|less than|within|max|<=)\s*(?:₹|rs\.?|inr)?\s*\d+', '', clean_q, flags=re.IGNORECASE).strip()
        except ValueError:
            pass

    # Delivery time pattern: within two days, in 2 days, under 48 hours
    word_to_num = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "seven": 7}
    days_match = re.search(r'(?:within|in|under|delivery in)\s*(\d+|one|two|three|four|five|seven)\s*(?:days?|hours?)', clean_q, re.IGNORECASE)
    if days_match:
        val = days_match.group(1).lower()
        num_days = word_to_num.get(val, int(val) if val.isdigit() else None)
        if "hour" in days_match.group(0).lower() and num_days:
            num_days = max(1, num_days // 24)
        if num_days:
            extracted_max_days = num_days
            clean_q = re.sub(r'(?:within|in|under|delivery in)\s*(\d+|one|two|three|four|five|seven)\s*(?:days?|hours?)', '', clean_q, flags=re.IGNORECASE).strip()

    # Clean leftover prepositions
    clean_q = re.sub(r'\b(with|for|at|under|in)\b', '', clean_q, flags=re.IGNORECASE).strip()
    clean_q = re.sub(r'\s+', ' ', clean_q)

    return {
        "original": query,
        "clean_keyword": clean_q,
        "max_price": extracted_max_price,
        "max_days": extracted_max_days
    }


@router.get("")
def get_gigs(
    q: Optional[str] = Query(None, description="Natural language search query"),
    category: Optional[str] = Query(None, description="Filter by category_key"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    max_delivery_days: Optional[int] = Query(None),
    skills: Optional[str] = Query(None, description="Comma-separated skill tags"),
    sort_by: str = Query("relevance", description="relevance, price_asc, price_desc, popularity, rating, newest"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Gig).filter(Gig.is_active == True)
    parsed_info = None

    # Handle string extraction if Query object passed during unit testing
    q_str = str(q) if q is not None and not hasattr(q, 'default') else None
    cat_str = str(category) if category is not None and not hasattr(category, 'default') else None
    dom_str = str(domain) if domain is not None and not hasattr(domain, 'default') else None
    skills_str = str(skills) if skills is not None and not hasattr(skills, 'default') else None
    min_p = float(min_price) if min_price is not None and not hasattr(min_price, 'default') else None
    max_p = float(max_price) if max_price is not None and not hasattr(max_price, 'default') else None
    min_r = float(min_rating) if min_rating is not None and not hasattr(min_rating, 'default') else None
    max_d = int(max_delivery_days) if max_delivery_days is not None and not hasattr(max_delivery_days, 'default') else None
    sort_str = str(sort_by) if sort_by is not None and not hasattr(sort_by, 'default') else "relevance"
    lim = int(limit) if limit is not None and not hasattr(limit, 'default') else 20
    off = int(offset) if offset is not None and not hasattr(offset, 'default') else 0

    # Natural Language Query Parsing
    if q_str and q_str.strip():
        parsed = parse_natural_language_query(q_str)
        parsed_info = parsed
        keyword = parsed["clean_keyword"]

        # Apply NLP-extracted price if user didn't explicitly override
        if parsed["max_price"] is not None and max_p is None:
            max_p = parsed["max_price"]

        # Apply NLP-extracted delivery time if user didn't explicitly override
        if parsed["max_days"] is not None and max_d is None:
            max_d = parsed["max_days"]

        if keyword:
            words = [w.strip() for w in keyword.split() if len(w.strip()) > 1]
            if words:
                conditions = []
                for w in words:
                    term = f"%{w}%"
                    conditions.append(or_(
                        Gig.title.ilike(term),
                        Gig.description.ilike(term),
                        Gig.tags_json.ilike(term),
                        Gig.mentor_name.ilike(term),
                        Gig.category_name.ilike(term),
                        Gig.domain.ilike(term)
                    ))
                query = query.filter(or_(*conditions))

    # Explicit Filters
    if cat_str and cat_str != "all":
        query = query.filter(Gig.category_key == cat_str)

    if dom_str and dom_str != "all":
        query = query.filter(Gig.domain == dom_str)

    if min_p is not None:
        query = query.filter(Gig.starting_price >= min_p)

    if max_p is not None:
        query = query.filter(Gig.starting_price <= max_p)

    if min_r is not None:
        query = query.filter(Gig.rating >= min_r)

    if max_d is not None:
        query = query.filter(Gig.delivery_days <= max_d)

    if skills_str:
        skill_list = [s.strip() for s in skills_str.split(",") if s.strip()]
        for s in skill_list:
            query = query.filter(Gig.tags_json.ilike(f"%{s}%"))

    # Sorting
    if sort_str == "price_asc":
        query = query.order_by(asc(Gig.starting_price))
    elif sort_str == "price_desc":
        query = query.order_by(desc(Gig.starting_price))
    elif sort_str == "popularity":
        query = query.order_by(desc(Gig.orders_count), desc(Gig.reviews_count))
    elif sort_str == "rating":
        query = query.order_by(desc(Gig.rating), desc(Gig.reviews_count))
    elif sort_str == "newest":
        query = query.order_by(desc(Gig.created_at))
    else:  # relevance
        query = query.order_by(desc(Gig.rating), desc(Gig.orders_count))

    total = query.count()
    gigs_data = query.offset(off).limit(lim).all()

    formatted_gigs = []
    for g in gigs_data:
        try:
            tags = json.loads(g.tags_json) if g.tags_json else []
        except Exception:
            tags = []
        formatted_gigs.append({
            "id": g.id,
            "category_key": g.category_key,
            "category_name": g.category_name,
            "domain": g.domain,
            "title": g.title,
            "description": g.description,
            "thumbnail": g.thumbnail,
            "starting_price": g.starting_price,
            "delivery_days": g.delivery_days,
            "delivery_time": g.delivery_time,
            "rating": g.rating,
            "reviews_count": g.reviews_count,
            "orders_count": g.orders_count,
            "views_count": g.views_count,
            "mentor": {
                "name": g.mentor_name,
                "avatar": g.mentor_avatar,
                "role": g.mentor_role,
                "verified": g.mentor_verified,
            },
            "tags": tags
        })

    return {
        "gigs": formatted_gigs,
        "total": total,
        "parsed_query": parsed_info
    }


@router.get("/suggestions")
def get_search_suggestions(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """
    Returns real-time autocomplete suggestions for search terms, skills, and gig titles.
    """
    term = f"%{q.strip()}%"
    gigs = db.query(Gig).filter(
        Gig.is_active == True,
        or_(
            Gig.title.ilike(term),
            Gig.tags_json.ilike(term),
            Gig.category_name.ilike(term)
        )
    ).limit(8).all()

    suggestions = set()
    for g in gigs:
        suggestions.add(g.title)
        try:
            tags = json.loads(g.tags_json) if g.tags_json else []
            for t in tags:
                if q.lower() in t.lower():
                    suggestions.add(t)
        except Exception:
            pass

    # Also add standard query templates if matching
    templates = [
        "Python tutoring under ₹500",
        "Machine learning project guidance",
        "Java programming mentor",
        "Resume review with delivery within two days",
        "Class 10th Mathematics notes",
        "React and Full-Stack web dev",
        "Generative AI & RAG capstone"
    ]
    for tmpl in templates:
        if q.lower() in tmpl.lower():
            suggestions.add(tmpl)

    return {"suggestions": list(suggestions)[:8]}


@router.get("/recommendations")
def get_ai_recommendations(
    current_gig_id: Optional[str] = Query(None),
    recent_searches: Optional[str] = Query(None),
    recent_views: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Personalized AI recommendation engine based on:
    - Student branch, student_type, and academic profile
    - Past order categories and domains
    - Recently viewed gigs and recent search queries
    - Active database gigs only (no fake gigs)
    - Fallback to trending/popular for new or anonymous users
    """
    all_active_gigs = db.query(Gig).filter(Gig.is_active == True).all()

    def format_gig(g: Gig):
        try:
            tags = json.loads(g.tags_json) if g.tags_json else []
        except Exception:
            tags = []
        return {
            "id": g.id,
            "category_key": g.category_key,
            "category_name": g.category_name,
            "domain": g.domain,
            "title": g.title,
            "description": g.description,
            "thumbnail": g.thumbnail,
            "starting_price": g.starting_price,
            "delivery_days": g.delivery_days,
            "delivery_time": g.delivery_time,
            "rating": g.rating,
            "reviews_count": g.reviews_count,
            "orders_count": g.orders_count,
            "mentor": {
                "name": g.mentor_name,
                "avatar": g.mentor_avatar,
                "role": g.mentor_role,
                "verified": g.mentor_verified,
            },
            "tags": tags
        }

    # Check if current_user is actual User instance or FastAPI Depends during direct call
    user_obj = current_user if isinstance(current_user, User) else None
    cur_gig_id = str(current_gig_id) if current_gig_id is not None and not hasattr(current_gig_id, 'default') else None
    searches_str = str(recent_searches) if recent_searches is not None and not hasattr(recent_searches, 'default') else None
    views_str = str(recent_views) if recent_views is not None and not hasattr(recent_views, 'default') else None

    # 1. Trending Gigs (Ranked by orders_count * 2 + reviews_count + rating)
    trending_sorted = sorted(
        all_active_gigs,
        key=lambda g: (g.orders_count or 0) * 2 + (g.reviews_count or 0) + ((g.rating or 0) * 10),
        reverse=True
    )
    trending_gigs = [format_gig(g) for g in trending_sorted[:4]]

    # 2. Recommended for You (Branch & Profile Aligned)
    student_branch = (user_obj.college_branch or "").lower() if user_obj else ""
    student_type = (user_obj.student_type or "college").lower() if user_obj else "college"
    past_order_cats = set()
    if user_obj:
        past_orders = db.query(Order.category_key).filter(Order.student_id == user_obj.id).all()
        past_order_cats = {o[0] for o in past_orders if o[0]}

    recommended = []
    for g in all_active_gigs:
        score = 0
        cat = g.category_key.lower()
        dom = g.domain.lower()

        # Branch matches
        if student_branch:
            if any(k in student_branch for k in ["computer", "cs", "it", "software"]):
                if cat in ["college_ml", "college_genai", "college_agentic", "college_fullstack"]:
                    score += 5
            elif "data" in student_branch or "ai" in student_branch:
                if cat in ["college_ds", "college_ml", "college_genai"]:
                    score += 6
            elif "mech" in student_branch or "civil" in student_branch:
                if cat in ["college_other", "college_ds"]:
                    score += 4

        # School student preference
        if student_type == "school" and "school" in dom:
            score += 10
        elif student_type == "college" and "college" in dom:
            score += 3

        # Past orders preference
        if g.category_key in past_order_cats:
            score += 4

        # General quality score
        score += (g.rating or 4.5) * 2

        recommended.append((score, g))

    recommended.sort(key=lambda x: x[0], reverse=True)
    recommended_gigs = [format_gig(g) for _, g in recommended[:4]]

    # 3. Based on Your Interests (Parsed from recent_searches or viewed tags)
    interests_gigs = []
    interest_keywords = []
    if searches_str:
        interest_keywords.extend([s.strip().lower() for s in searches_str.split(",") if s.strip()])
    if views_str:
        viewed_ids = [v.strip() for v in views_str.split(",") if v.strip()]
        for g in all_active_gigs:
            if g.id in viewed_ids:
                try:
                    interest_keywords.extend([t.lower() for t in json.loads(g.tags_json)])
                except Exception:
                    pass

    if interest_keywords:
        matching_interests = []
        for g in all_active_gigs:
            match_score = 0
            g_text = f"{g.title} {g.description} {g.tags_json} {g.category_name}".lower()
            for kw in interest_keywords:
                if kw in g_text:
                    match_score += 2
            if match_score > 0:
                matching_interests.append((match_score, g))
        matching_interests.sort(key=lambda x: x[0], reverse=True)
        interests_gigs = [format_gig(g) for _, g in matching_interests[:4]]

    # Fallback for interests if empty
    if not interests_gigs:
        interests_gigs = [format_gig(g) for g in all_active_gigs if g.id not in [r["id"] for r in recommended_gigs]][:4]

    # 4. Similar Gigs (If current_gig_id is passed)
    similar_gigs = []
    if cur_gig_id:
        target_gig = db.query(Gig).filter(Gig.id == cur_gig_id).first()
        if target_gig:
            sim_list = db.query(Gig).filter(
                Gig.is_active == True,
                Gig.id != current_gig_id,
                or_(
                    Gig.category_key == target_gig.category_key,
                    Gig.domain == target_gig.domain
                )
            ).order_by(desc(Gig.rating)).limit(4).all()
            similar_gigs = [format_gig(g) for g in sim_list]

    reasoning = "Curated based on your academic profile, verified mentor reviews, and campus trends."
    if student_branch and user_obj:
        reasoning = f"Tailored for your {user_obj.college_branch} curriculum and capstone defense requirements."
    elif student_type == "school":
        reasoning = "Handcrafted for Class 1–10th board prep, theorem proofs, and textbook assignment scoring."

    return {
        "recommended_for_you": recommended_gigs,
        "based_on_interests": interests_gigs,
        "trending_gigs": trending_gigs,
        "similar_gigs": similar_gigs,
        "ai_reasoning": reasoning
    }


@router.get("/{gig_id}")
def get_gig_detail(gig_id: str, db: Session = Depends(get_db)):
    gig = db.query(Gig).filter(Gig.id == gig_id, Gig.is_active == True).first()
    if not gig:
        raise HTTPException(status_code=404, detail="Gig not found")

    # Increment view count
    gig.views_count = (gig.views_count or 0) + 1
    db.commit()

    try:
        tags = json.loads(gig.tags_json) if gig.tags_json else []
    except Exception:
        tags = []

    return {
        "id": gig.id,
        "category_key": gig.category_key,
        "category_name": gig.category_name,
        "domain": gig.domain,
        "title": gig.title,
        "description": gig.description,
        "thumbnail": gig.thumbnail,
        "starting_price": gig.starting_price,
        "delivery_days": gig.delivery_days,
        "delivery_time": gig.delivery_time,
        "rating": gig.rating,
        "reviews_count": gig.reviews_count,
        "orders_count": gig.orders_count,
        "views_count": gig.views_count,
        "mentor": {
            "name": gig.mentor_name,
            "avatar": gig.mentor_avatar,
            "role": gig.mentor_role,
            "verified": gig.mentor_verified,
        },
        "tags": tags
    }
