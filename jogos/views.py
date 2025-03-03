from django.db.models.query import QuerySet
from django.forms import BaseModelForm
from django.http import HttpResponse
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.views.generic.list import ListView
from django.urls import reverse_lazy
from .models import Pais, Jogo
from django.contrib.auth.decorators import login_required

# Create your views here.
class PaisCreate(CreateView):
    model = Pais
    fields = ['pais', 'torneio']
    template_name = 'jogos/form.html'
    success_url = reverse_lazy('listar-jogos')

class JogoCreate(CreateView):
    model = Jogo
    fields = ['pais', 'timea', 'timeb', 'horario', 'observacoes']
    template_name = 'jogos/form.html'
    success_url = reverse_lazy('cadastrar-jogo')

    def form_valid(self, form):

        # Antes do super não foi criado o objeto nem salvo no banco
        form.instance.usuario = self.request.user

        url = super().form_valid(form)

        # Depois do super o objeto está criado

        return url


# Update views

class PaisUpdate(UpdateView):
    model = Pais
    fields = ['pais', 'torneio']
    template_name = 'jogos/form.html'
    success_url = reverse_lazy('index')

class JogoUpdate(UpdateView):
    model = Jogo
    fields = ['pais', 'timea', 'timeb', 'horario', 'observacoes']
    template_name = 'jogos/form.html'
    success_url = reverse_lazy('index')


# Delete views

class PaisDelete(DeleteView):
    model = Pais
    template_name = 'jogos/form_excluir.html'
    success_url = reverse_lazy('index')

class JogoDelete(DeleteView):
    model = Jogo
    template_name = 'jogos/form_excluir.html'
    success_url = reverse_lazy('listar-jogos')


# Listar Views

class PaisList(ListView):
    model = Pais
    template_name = 'jogos/listas/pais.html'


class JogoList(ListView):
    model = Jogo
    template_name = 'jogos/listas/jogo.html'

    # def get_queryset(self):
    #     self.object_list = Jogo.objects.filter(usuario=self.request.user)
    #     return self.object_list






