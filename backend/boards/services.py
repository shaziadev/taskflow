"""Business logic kept out of the views so it is easy to test on its own."""
from django.db import transaction

from .models import Board, Column, Membership, Task

DEFAULT_COLUMNS = ("To Do", "In Progress", "Done")


@transaction.atomic
def create_board(*, owner, name: str, description: str = "") -> Board:
    """Create a board, make the creator an admin and add the default columns."""
    board = Board.objects.create(owner=owner, name=name, description=description)
    Membership.objects.create(board=board, user=owner, role=Membership.Role.ADMIN)
    Column.objects.bulk_create(
        Column(board=board, title=title, position=index)
        for index, title in enumerate(DEFAULT_COLUMNS)
    )
    return board


def _renumber(tasks):
    """Rewrite positions as 0..n-1 in the given order."""
    for index, task in enumerate(tasks):
        task.position = index
    Task.objects.bulk_update(tasks, ["position"])


@transaction.atomic
def move_task(task: Task, to_column: Column, position: int) -> Task:
    """
    Move a task to `position` inside `to_column` (same or different column).

    We lock the affected rows (select_for_update) so two people dragging cards
    at the same time cannot corrupt the ordering.
    """
    if to_column.board_id != task.column.board_id:
        raise ValueError("Tasks can only be moved within the same board.")

    from_column_id = task.column_id

    # Remove the task from its current column and close the gap.
    source = list(
        Task.objects.select_for_update()
        .filter(column_id=from_column_id)
        .exclude(pk=task.pk)
        .order_by("position", "id")
    )
    if from_column_id != to_column.id:
        _renumber(source)
        target = list(
            Task.objects.select_for_update()
            .filter(column=to_column)
            .order_by("position", "id")
        )
    else:
        target = source

    # Insert at the requested index (clamped to the end of the list).
    position = min(position, len(target))
    task.column = to_column
    target.insert(position, task)
    task.save(update_fields=["column"])
    _renumber(target)
    task.refresh_from_db()
    return task
