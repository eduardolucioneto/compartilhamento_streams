from django.urls import path
from .views import JogoCreate, JogoList, JogoDelete, JogoUpdate

urlpatterns = [    
    path('cadastrar/jogo/', JogoCreate.as_view(), name="cadastrar-jogo"),    
    path('', JogoList.as_view(), name="listar-jogos"),
    path('deletar/jogo/<int:pk>/', JogoDelete.as_view(), name="deletar-jogo"),
    path('atualizar/jogo/<int:pk>/', JogoUpdate.as_view(), name="atualizar-jogo"),  
]
