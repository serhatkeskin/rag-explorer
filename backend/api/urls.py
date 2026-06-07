from django.urls import path
from . import views

urlpatterns = [
    path("documents/", views.documents),
    path("documents/upload/", views.upload_document),
    path("chunks/", views.chunks),
    path("query/", views.query),
]
