from django.urls import path
# from .views import main_view
from .views import IndexView, SalaView

urlpatterns = [
    # path('', main_view, name='main_view'),
    path('index_chat/', IndexView.as_view(), name='index_chat'),
    path('chat/<str:nome_sala>/',SalaView.as_view(), name='sala'),     
        # This maps the root URL to the main_view function
]