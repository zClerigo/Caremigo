from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Profile, MedicalRecord, Task
from .serializers import ProfileSerializer, MedicalRecordSerializer, TaskSerializer
from django.db import models, transaction
from django.db.models import F
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
            # Direct access to a specific record
            if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
                return MedicalRecord.objects.all()
                
            # Otherwise, filter by profile if profile_id is in the URL
            profile_id = self.kwargs.get('profile_id')
            if profile_id:
                return MedicalRecord.objects.filter(profile_id=profile_id)
                
            # Default case - return all records if not accessing via profile
            return MedicalRecord.objects.all()
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
        # Allow direct access for all standard actions if pk is provided
        if self.kwargs.get('pk') is not None:
             return queryset
        
        # For list view without profile_id, decide what to return (e.g., all tasks, or raise error)
        # For now, returning all tasks ordered, adjust if needed
        return queryset.order_by('profile', 'order')

    def perform_create(self, serializer):
        # Automatically set the profile based on the URL
        profile_id = self.kwargs.get('profile_id')
        # If profile_id is not in the URL, check if it was provided in the data
        # Note: Allowing profile_id in data might be less RESTful for nested routes
        # Consider removing if profile should *only* be set via URL
        if not profile_id and serializer.validated_data.get('profile_id'):
             profile_id = serializer.validated_data.get('profile_id')

        print(f"Creating task with profile_id: {profile_id}, data: {serializer.validated_data}")

        if not profile_id:
            error_msg = "Cannot create task without a profile context (profile_id missing)."
            print(f"Error: {error_msg}")
            # Use 400 Bad Request as it's a client error (missing data)
            raise serializers.ValidationError(error_msg, code='invalid')

        try:
            profile = Profile.objects.get(id=profile_id)
            print(f"Found profile: {profile.name}")

            # Get the title and status from validated data
            title = serializer.validated_data.get('title', '').strip()
            status = serializer.validated_data.get('status', Task.STATUS_CHOICES[0][0]) # Default to first status choice
            print(f"Task title: '{title}', status: {status}")

            if not title:
                error_msg = "Task title cannot be empty."
                print(f"Error: {error_msg}")
                raise serializers.ValidationError({"title": [error_msg]}) # DRF expects list of errors per field

            # Normalize the title for comparison
            normalized_title = title.lower().strip()

            # Check if a task with the same normalized title already exists for this profile
            # Using filter().first() is more efficient if only checking existence or getting one
            existing_task = Task.objects.filter(
                profile=profile, 
                title__iexact=normalized_title # Case-insensitive exact match is better
            ).first()

            if existing_task:
                print(f"Task with title '{title}' already exists (id: {existing_task.id})")
                # Instead of returning the existing task, raise a validation error
                # to prevent accidental duplicate creation attempts from succeeding silently.
                # The frontend should ideally handle this check first.
                raise serializers.ValidationError(
                    {"title": [f"A task with the title '{title}' already exists for this profile."]},
                    code='unique'
                )

            # Assign the highest order number + 1 for the new task within its status column
            max_order_result = Task.objects.filter(profile=profile, status=status).aggregate(models.Max('order'))
            # max_order can be None if no tasks exist in that status
            max_order = max_order_result['order__max']
            order = (max_order if max_order is not None else -1) + 1 # Start order from 0
            print(f"Calculated order: {order}")

            # Save the task with the proper profile and calculated order
            # The serializer's save method calls perform_create, so we return the result of serializer.save()
            # We pass profile and order explicitly to override any potential values in validated_data
            task = serializer.save(profile=profile, order=order)
            print(f"Task created successfully: {task.id} - {task.title}")
            # We don't need to return the task here; serializer.save() handles it.

        except Profile.DoesNotExist:
            error_msg = f"Profile not found for the provided ID: {profile_id}"
            print(f"Error: {error_msg}")
            raise serializers.ValidationError({"profile_id": [error_msg]}, code='invalid')
        except serializers.ValidationError:
             raise # Re-raise validation errors
        except Exception as e:
            error_msg = f"Could not save task due to an unexpected error: {str(e)}"
            print(f"Error: {error_msg}")
            print(f"Exception details: {type(e).__name__}, {str(e)}")
            # Use a generic server error for unexpected issues
            raise serializers.ValidationError(error_msg, code='error')

    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        """
        Handle PATCH requests, specifically managing order changes during drag-and-drop.
        The 'order' field in the request data is interpreted as the desired 0-based index
        in the target status list.
        """
        instance = self.get_object()
        target_status = request.data.get('status', instance.status)
        # Interpret 'order' from request as the target *index*
        target_index = request.data.get('order') 

        if target_index is not None:
            try:
                target_index = int(target_index)
                if target_index < 0:
                    raise ValueError("Target index cannot be negative.")
            except (ValueError, TypeError):
                 return Response(
                     {"order": ["Invalid target index provided."]},
                     status=status.HTTP_400_BAD_REQUEST
                 )

        status_changed = target_status != instance.status
        order_changed = target_index is not None # We only care if a target index was specified

        if not status_changed and not order_changed:
            # If neither status nor order intent changes, proceed with default update
             return super().partial_update(request, *args, **kwargs)

        print(f"Reordering task {instance.id}: Target Status='{target_status}', Target Index={target_index}")

        profile = instance.profile
        original_status = instance.status
        original_order = instance.order # This is the db order value, not index

        # --- Step 1: Adjust order in the original list (if task is actually moving out) ---
        # Only adjust if the task is truly moving (status change or different index in same status)
        # Tasks with order greater than the moved task's original order need their order decremented by 1
        Task.objects.filter(
            profile=profile,
            status=original_status,
            order__gt=original_order
        ).update(order=F('order') - 1)

        # --- Step 2: Adjust order in the target list ---
        # Tasks in the target list at or after the target index need their order incremented by 1
        # Note: target_index is the desired *position* (0-based index). We need to shift items
        # from that position onwards.
        Task.objects.filter(
            profile=profile,
            status=target_status,
            order__gte=target_index # Shift items at the target index and onwards
        ).update(order=F('order') + 1)

        # --- Step 3: Update the moved task ---
        # Set the task's new status and its new order (which is the target index)
        instance.status = target_status
        instance.order = target_index
        instance.save(update_fields=['status', 'order', 'updated_at']) # Save only changed fields

        # --- Step 4: Serialize and return the updated task ---
        # Re-fetch instance? Maybe not necessary if save() updates it.
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # Optional: Override update (PUT) similarly if needed, although PATCH is typical for drag-drop.
    # def update(self, request, *args, **kwargs):
    #     # Similar logic to partial_update but for PUT
    #     pass

    # The default destroy/retrieve/list should be fine.
