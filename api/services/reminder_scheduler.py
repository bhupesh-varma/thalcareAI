from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date
from databases import SessionLocal
from models import ThalassemiaProfile, User
from services.email_service import send_email
from services.sms_service import send_sms

def check_reminders():
    db = SessionLocal()
    today = date.today()

    patients = db.query(ThalassemiaProfile).all()

    for patient in patients:
        days_left = (patient.next_due_date - today).days

        if days_left <= 2:
            user = db.query(User).filter(User.id == patient.user_id).first()

            message = f"""
            Hi {patient.full_name},
            Your blood transfusion is due on {patient.next_due_date}.
            Please schedule your hospital visit.
            """

            send_email(user.email, "ThalCare Reminder", message)
            send_sms(user.phone, message)

    db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(check_reminders, "interval", hours=24)