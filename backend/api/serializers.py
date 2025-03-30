from rest_framework import serializers
from .models import Profile, MedicalRecord, Task

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['id', 'title', 'date', 'description', 'image', 'image_data', 
                 'analysis_summary', 'analysis_actions', 'analysis_recommendations', 
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.image:
            representation['image'] = instance.image.url
        return representation

class ProfileSerializer(serializers.ModelSerializer):
    records = MedicalRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'name', 'relationship', 'records', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class TaskSerializer(serializers.ModelSerializer):
    profile_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Task
        fields = ['id', 'profile', 'profile_id', 'title', 'description', 'status', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'profile', 'created_at', 'updated_at'] # Profile is set based on URL
    
    def validate(self, data):
        """
        Ensure that status is one of the allowed choices.
        """
        status = data.get('status')
        if status and status not in dict(Task.STATUS_CHOICES):
            raise serializers.ValidationError({'status': f"Status '{status}' is not a valid choice."})
        return data 