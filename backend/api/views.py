from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Profile, MedicalRecord
from .serializers import ProfileSerializer, MedicalRecordSerializer

# Create your views here.

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class MedicalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalRecordSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        profile_id = self.kwargs.get('profile_id')
        return MedicalRecord.objects.filter(profile_id=profile_id)

    def create(self, request, *args, **kwargs):
        profile_id = self.kwargs.get('profile_id')
        try:
            profile = Profile.objects.get(id=profile_id)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(profile=profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
