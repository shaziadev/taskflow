from datetime import timedelta

import pytest
from django.core import mail
from django.utils import timezone

from boards.models import Task
from boards.tasks import send_due_task_reminders

pytestmark = pytest.mark.django_db


@pytest.fixture
def column(board):
    return board.columns.first()


def test_sends_reminder_for_task_due_within_24h(column, member_user):
    task = Task.objects.create(
        column=column,
        title="Ship release",
        assignee=member_user,
        due_date=timezone.now() + timedelta(hours=5),
    )

    assert send_due_task_reminders() == 1
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [member_user.email]
    assert "Ship release" in mail.outbox[0].subject

    task.refresh_from_db()
    assert task.reminder_sent is True


def test_reminder_is_only_sent_once(column, member_user):
    Task.objects.create(
        column=column, title="T", assignee=member_user,
        due_date=timezone.now() + timedelta(hours=2),
    )
    send_due_task_reminders()
    assert send_due_task_reminders() == 0
    assert len(mail.outbox) == 1


def test_skips_tasks_not_due_soon_or_unassigned(column, member_user):
    now = timezone.now()
    Task.objects.create(column=column, title="Later", assignee=member_user, due_date=now + timedelta(days=3))
    Task.objects.create(column=column, title="Overdue", assignee=member_user, due_date=now - timedelta(hours=1))
    Task.objects.create(column=column, title="Nobody", due_date=now + timedelta(hours=1))

    assert send_due_task_reminders() == 0
    assert mail.outbox == []
