from django.shortcuts import render
from typing import Any
from django.shortcuts import render
from django.views.generic import TemplateView
from django.utils.safestring import mark_safe
import json

# Create your views here.
# def main_view(request):
#     context = {}
#     return render(request, 'main.html', context=context)

def webrtc_view(request):
    return render(request, 'main.html')

class IndexView(TemplateView):
    template_name = 'index.html'

class SalaView(TemplateView):
    template_name = 'main.html'

    def get_context_data(self, **kwargs):
        context = super(SalaView, self).get_context_data(**kwargs)
        context['nome_sala_json'] = mark_safe(
            json.dumps(self.kwargs['nome_sala'])
        )
        return context