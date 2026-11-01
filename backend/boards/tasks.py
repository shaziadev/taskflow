"""Celery background jobs."""
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import Task


@shared_task
def send_due_task_reminders() -> int:
    """
    Email assignees about tasks due in the next 24 hours.

    Scheduled hourly by Celery beat (see CELERY_BEAT_SCHEDULE). Each task is only
    reminded once thanks to the `reminder_sent` flag. Returns the number of emails sent.
    """
    now = timezone.now()
    due_soon = (
        Task.objects.select_related("assignee", "column__board")
        .filter(
            reminder_sent=False,
            due_date__gt=now,
            due_date__lte=now + timedelta(hours=24),
            assignee__isnull=False,
        )
        .exclude(assignee__email="")
    )

    sent = 0
    for task in due_soon:
        send_mail(
            subject=f"[TaskFlow] Reminder: '{task.title}' is due soon",
            message=(
                f"Hi {task.assignee.first_name or task.assignee.username},\n\n"
                f"Your task '{task.title}' on board '{task.column.board.name}' "
                f"is due on {task.due_date:%Y-%m-%d %H:%M} UTC.\n\n— TaskFlow"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[task.assignee.email],
        )
        task.reminder_sent = True
        task.save(update_fields=["reminder_sent"])
        sent += 1
    return sent
