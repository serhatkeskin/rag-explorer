from django.db import models


class Document(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    indexed_at = models.DateTimeField(null=True, blank=True)
    chunk_count = models.IntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
