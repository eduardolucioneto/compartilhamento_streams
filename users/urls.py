from django.urls import path
from . import views

# app_name = 'users'

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('plataforma/', views.plataforma, name="plataforma"),
    path('logout/', views.user_logout, name='logout'),
    path('trocar_senha/', views.trocar_senha, name='trocar_senha'),
]