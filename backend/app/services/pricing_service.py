import json
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.pricing import PricingConfig


def calculate_order_price(
    category_key: str,
    deliverables_list: List[str],
    urgency: str,
    page_count: Optional[int],
    db: Session
) -> dict:
    """
    Calculate the total price for an order based on category, deliverables, and urgency.
    Returns: {base_price, addons_breakdown, urgency_fee, total, advance, balance}
    """
    config = db.query(PricingConfig).filter(
        PricingConfig.category_key == category_key,
        PricingConfig.is_active == True
    ).first()

    if not config:
        raise ValueError(f"Pricing config not found for category: {category_key}")

    # Parse add-ons
    add_ons = {}
    if config.add_ons_json:
        try:
            add_ons = json.loads(config.add_ons_json)
        except json.JSONDecodeError:
            add_ons = {}

    # Base price calculation
    base_price = config.base_price

    # For school assignments, multiply by page count
    if category_key == "school_assignment" and page_count:
        actual_pages = max(page_count, 10)  # minimum 10 pages
        base_price = config.base_price * actual_pages

    # Calculate add-ons
    addons_breakdown = {}
    addons_total = 0.0

    # Filter out "code" from add-ons (it's always included in base)
    paid_deliverables = [d for d in deliverables_list if d != "code"]

    for deliverable in paid_deliverables:
        if deliverable in add_ons:
            price = add_ons[deliverable]
            addons_breakdown[deliverable] = price
            addons_total += price

    # Urgency fee
    urgency_fee = 0.0
    express_base = add_ons.get("express", 0)
    if urgency == "express":
        urgency_fee = express_base
    elif urgency == "super_express":
        urgency_fee = express_base * 1.5  # 1.5x express rate for super express

    # Total calculation
    total = base_price + addons_total + urgency_fee
    advance = round(total * 0.30, 2)
    balance = round(total * 0.70, 2)

    return {
        "base_price": round(base_price, 2),
        "addons_breakdown": addons_breakdown,
        "addons_total": round(addons_total, 2),
        "urgency_fee": round(urgency_fee, 2),
        "total": round(total, 2),
        "advance": advance,
        "balance": balance,
        "category_name": config.category_name,
        "unit_description": config.unit_description or "Per Project"
    }
