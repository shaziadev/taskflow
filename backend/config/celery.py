"""Celery application used for background jobs (e.g. due-date reminder emails)."""
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("taskflow")
# Read every setting that starts with CELERY_ from Django settings.
app.config_from_object("django.conf:settings", namespace="CELERY")
# Find tasks.py modules inside installed apps.
app.autodiscover_tasks()
