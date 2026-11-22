from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.course import Course, CourseEnrollment
from app.models.user import User
from app.services.auth_service import get_current_user, require_admin

router = APIRouter(prefix="/api/courses", tags=["Courses"])


class CourseCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    price: float = 0.0
    duration_hours: Optional[float] = None
    level: str = "beginner"
    category: Optional[str] = None
    is_active: bool = True


class CourseUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    price: Optional[float] = None
    duration_hours: Optional[float] = None
    level: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


def course_to_dict(course: Course, enrollment_count: int = 0) -> dict:
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "thumbnail_url": course.thumbnail_url,
        "price": course.price,
        "duration_hours": course.duration_hours,
        "level": course.level,
        "category": course.category,
        "is_active": course.is_active,
        "created_at": course.created_at.isoformat() if course.created_at else None,
        "enrollment_count": enrollment_count
    }


@router.get("")
def list_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.is_active == True).all()
    result = []
    for c in courses:
        count = db.query(CourseEnrollment).filter(CourseEnrollment.course_id == c.id).count()
        result.append(course_to_dict(c, count))
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
def create_course(
    req: CourseCreateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = Course(
        title=req.title,
        description=req.description,
        thumbnail_url=req.thumbnail_url,
        price=req.price,
        duration_hours=req.duration_hours,
        level=req.level,
        category=req.category,
        is_active=req.is_active
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course_to_dict(course)


@router.put("/{course_id}")
def update_course(
    course_id: int,
    req: CourseUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if req.title is not None:
        course.title = req.title
    if req.description is not None:
        course.description = req.description
    if req.thumbnail_url is not None:
        course.thumbnail_url = req.thumbnail_url
    if req.price is not None:
        course.price = req.price
    if req.duration_hours is not None:
        course.duration_hours = req.duration_hours
    if req.level is not None:
        course.level = req.level
    if req.category is not None:
        course.category = req.category
    if req.is_active is not None:
        course.is_active = req.is_active

    db.commit()
    db.refresh(course)
    return course_to_dict(course)


@router.post("/{course_id}/enroll", status_code=status.HTTP_201_CREATED)
def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can enroll in courses")

    course = db.query(Course).filter(Course.id == course_id, Course.is_active == True).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if already enrolled
    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id,
        CourseEnrollment.course_id == course_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")

    enrollment = CourseEnrollment(
        student_id=current_user.id,
        course_id=course_id,
        payment_status="free" if course.price == 0 else "pending"
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return {
        "message": "Enrolled successfully",
        "enrollment_id": enrollment.id,
        "payment_status": enrollment.payment_status,
        "course": course_to_dict(course)
    }
