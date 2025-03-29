from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import Profile, MedicalRecord
from .serializers import ProfileSerializer, MedicalRecordSerializer

# Create your views here.

class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MedicalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MedicalRecord.objects.filter(profile__user=self.request.user)

    def perform_create(self, serializer):
        profile_id = self.kwargs.get('profile_pk')
        profile = Profile.objects.get(id=profile_id, user=self.request.user)
        serializer.save(profile=profile)
