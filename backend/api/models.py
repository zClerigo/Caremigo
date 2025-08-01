from django.db import models

# Create your models here.

class Profile(models.Model):
    name = models.CharField(max_length=100)
    relationship = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class MedicalRecord(models.Model):
    profile = models.ForeignKey(Profile, related_name='records', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    date = models.DateField()
    description = models.TextField()
    image = models.ImageField(upload_to='medical_records/')
    image_data = models.TextField(blank=True, null=True)
    analysis_summary = models.TextField(blank=True, null=True)
    analysis_actions = models.TextField(blank=True, null=True)
    analysis_recommendations = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} - {self.profile.name}"

class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('inprogress', 'In Progress'),
        ('done', 'Done'),
    ]
    
    profile = models.ForeignKey(Profile, related_name='tasks', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    order = models.PositiveIntegerField(default=0) # Order within a status column for a profile
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order'] # Default ordering by the 'order' field

    def __str__(self):
        return f"{self.title} ({self.get_status_display()}) - {self.profile.name}"
