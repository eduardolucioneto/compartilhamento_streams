from django.shortcuts import render
from django.views.generic import TemplateView

# Create your views here.
class PaginaInicial(TemplateView):
    template_name = 'index.html'

class StreamsView(TemplateView):
    template_name = 'main.html'

class SobreView(TemplateView):
    template_name = 'sobre.html'

class LadderView(TemplateView):
    template_name = 'ladder.html'

class ParafalharView(TemplateView):
    template_name = 'parafalhar.html'

class CorrectscoreView(TemplateView):
    template_name = 'correctscore.html'

class DesempenhoView(TemplateView):
    template_name = 'desempenho.html'

class ContatoView(TemplateView):
    template_name = 'contato.html'


