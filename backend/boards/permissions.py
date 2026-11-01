"""
Object-level permissions.

* Any board member can read the board and create / edit / move tasks.
* Only board admins can rename or delete the board, manage columns and members.
"""
from rest_framework import permissions

from .models import Board, Column, Membership, Task


def get_board(obj) -> Board:
    if isinstance(obj, Board):
        return obj
    if isinstance(obj, Column):
        return obj.board
    if isinstance(obj, Task):
        return obj.column.board
    raise TypeError(f"Unsupported object: {obj!r}")


def get_role(user, board: Board):
    membership = Membership.objects.filter(board=board, user=user).only("role").first()
    return membership.role if membership else None


class IsBoardMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return get_role(request.user, get_board(obj)) is not None


class IsBoardAdminOrReadOnly(permissions.BasePermission):
    """Members may read; only admins may write."""

    def has_object_permission(self, request, view, obj):
        role = get_role(request.user, get_board(obj))
        if role is None:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return role == Membership.Role.ADMIN
