import smtplib
from email.mime.text import MIMEText
import os

def send_email(to_email, subject, message):

    msg = MIMEText(message)
    msg["Subject"] = subject
    msg["From"] = os.getenv("EMAIL_ADDRESS")
    msg["To"] = to_email

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(os.getenv("EMAIL_ADDRESS"), os.getenv("EMAIL_PASSWORD"))
    server.send_message(msg)
    server.quit()