from rest_framework import generics, permissions

from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — public sign-up endpoint."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    """GET /api/auth/me/ — the currently logged-in user."""

    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
