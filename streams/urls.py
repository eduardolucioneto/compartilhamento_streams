from django.urls import path
from .views import StreamsView, PaginaInicial, SobreView, LadderView, ParafalharView, CorrectscoreView, DesempenhoView, ContatoView
urlpatterns = [
    # Todo path tem endereço, sua_view.as_view() e nome
    # path('', PaginaInicial.as_view(), name='index'),
    path('streams/<int:pk>', StreamsView.as_view(), name='streams'),        
    path('sobre/', SobreView.as_view(), name='sobre'),
    path('ladder/', LadderView.as_view(), name='ladder'),
    path('parafalhar/', ParafalharView.as_view(), name='parafalhar'),
    path('correctscore/', CorrectscoreView.as_view(), name='correctscore'),
    path('desempenho/', DesempenhoView.as_view(), name='desempenho'),
    path('contato/', ContatoView.as_view(), name='contato'),   
    
    
]