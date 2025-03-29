from django.db import models

# Create your models here.

class Patient(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class MedicalRecord(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='records')
    title = models.CharField(max_length=200)
    date = models.DateField()
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='medical_records/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.patient.name}"
