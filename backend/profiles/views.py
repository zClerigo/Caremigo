from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from .models import Profile, MedicalRecord, Todo
from .serializers import ProfileSerializer, MedicalRecordSerializer, TodoSerializer

# Create your views here.

class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer

    def get_queryset(self):
        return Profile.objects.all()

    def perform_create(self, serializer):
        serializer.save()

class MedicalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalRecordSerializer

    def get_queryset(self):
        return MedicalRecord.objects.all()

    def perform_create(self, serializer):
        profile_id = self.kwargs.get('profile_pk')
        profile = Profile.objects.get(id=profile_id)
        serializer.save(profile=profile)

class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer

    def get_queryset(self):
        profile_id = self.kwargs.get('profile_pk')
        return Todo.objects.filter(profile_id=profile_id)

    def perform_create(self, serializer):
        profile_id = self.kwargs.get('profile_pk')
        profile = Profile.objects.get(id=profile_id)
        serializer.save(profile=profile)
