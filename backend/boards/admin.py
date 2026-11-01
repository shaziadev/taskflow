from django.contrib import admin

from .models import Board, Column, Membership, Task


class MembershipInline(admin.TabularInline):
    model = Membership
    extra = 0


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "created_at")
    inlines = [MembershipInline]


@admin.register(Column)
class ColumnAdmin(admin.ModelAdmin):
    list_display = ("title", "board", "position")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "column", "assignee", "priority", "due_date", "reminder_sent")
    list_filter = ("priority", "reminder_sent")
