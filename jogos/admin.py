from django.contrib import admin

# Importar as classes
from .models import Pais, Jogo, Horario

# Register your models here.
admin.site.register(Pais)
admin.site.register(Jogo)
admin.site.register(Horario)
