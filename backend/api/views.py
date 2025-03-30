from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Profile, MedicalRecord, Task
from .serializers import ProfileSerializer, MedicalRecordSerializer, TaskSerializer
from django.db import models
from rest_framework import serializers

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

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.all() # Start with all tasks
        
        # Check if accessing via nested profile route
        profile_id = self.kwargs.get('profile_id')
        if profile_id:
            try:
                profile = Profile.objects.get(id=profile_id)
                # Filter by profile if accessed via /profiles/../tasks/
                return queryset.filter(profile=profile).order_by('order')
            except Profile.DoesNotExist:
                # Return empty if the profile in the URL doesn't exist for nested route
                return Task.objects.none()
        
        # Handle direct access to individual task endpoint
        if self.action == 'retrieve' or self.action == 'update' or self.action == 'partial_update' or self.action == 'destroy':
            # Allow accessing individual tasks directly
            return queryset
        
        # For all other cases, return all tasks ordered sensibly
        return queryset.order_by('profile', 'order')

    def perform_create(self, serializer):
        # Automatically set the profile based on the URL
        profile_id = self.kwargs.get('profile_id')
        # If profile_id is not in the URL, check if it was provided in the data
        if not profile_id and serializer.validated_data.get('profile_id'):
            profile_id = serializer.validated_data.get('profile_id')
            
        print(f"Creating task with profile_id: {profile_id}, data: {serializer.validated_data}")
        
        if not profile_id:
             # This should not happen if URL conf is correct, but added as a safeguard
             error_msg = "Cannot create task without a profile context."
             print(f"Error: {error_msg}")
             raise serializers.ValidationError(error_msg)
             
        try:
            profile = Profile.objects.get(id=profile_id)
            print(f"Found profile: {profile.name}")
            
            # Get the title and status from validated data (for duplicate checking)
            title = serializer.validated_data.get('title')
            status = serializer.validated_data.get('status', 'todo')
            print(f"Task title: {title}, status: {status}")
            
            # Check if a task with the same title already exists for this profile
            existing_task = Task.objects.filter(
                profile=profile, 
                title__iexact=title  # Case insensitive match
            ).first()
            
            if existing_task:
                print(f"Task with title '{title}' already exists (id: {existing_task.id})")
                # Return the existing task instead of creating a new one
                return existing_task
            
            # Assign the highest order number + 1 for the new task within its status column
            max_order = Task.objects.filter(profile=profile, status=status).aggregate(models.Max('order'))['order__max']
            order = (max_order or 0) + 1
            print(f"Calculated order: {order}")
            
            # Save the task with the proper profile and order
            task = serializer.save(profile=profile, order=order)
            print(f"Task created successfully: {task.id} - {task.title}")
            return task
        except Profile.DoesNotExist:
            # Handle error: Profile not found
            error_msg = f"Profile not found for the provided ID: {profile_id}"
            print(f"Error: {error_msg}")
            raise serializers.ValidationError(error_msg)
        except Exception as e:
            # Handle potential errors during order calculation or saving
            error_msg = f"Could not save task: {str(e)}"
            print(f"Error: {error_msg}")
            print(f"Exception details: {type(e).__name__}, {str(e)}")
            raise serializers.ValidationError(error_msg)
            
    # Add methods to handle updates, particularly for status and order changes from drag-and-drop
    # A dedicated endpoint/action might be better for bulk order/status updates
    # For now, the default update (PUT/PATCH to /api/tasks/<task_id>/) will work for individual task changes
