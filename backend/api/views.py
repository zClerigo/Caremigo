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
        try:
            profile_id = self.kwargs.get('profile_id')
            return MedicalRecord.objects.filter(profile_id=profile_id)
        except Exception as e:
            print(f"Error in get_queryset: {str(e)}")
            return MedicalRecord.objects.none()

    def create(self, request, profile_id=None):
        print(f"Creating record for profile_id: {profile_id}")
        print(f"Request data: {request.data}")
        try:
            profile = Profile.objects.get(id=profile_id)
            print(f"Found profile: {profile.name}")
        except Profile.DoesNotExist:
            print(f"Profile with id {profile_id} not found")
            return Response(
                {"error": "Profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                serializer.save(profile=profile)
                print("Record created successfully")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error in create: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error in update: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
