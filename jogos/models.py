from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Pais(models.Model):
    pais = models.CharField(max_length=50, verbose_name="País")
    torneio = models.CharField(max_length=50)

    def __str__(self):
        return "{} - {}".format(self.pais, self.torneio)
    
# class Torneio(models.Model):
#     nome = models.CharField(max_length=100, verbose_name="Nome do Torneio")
#     pais = models.ForeignKey(Pais, on_delete=models.CASCADE, related_name="torneios")

#     def __str__(self):
#         return f"{self.nome} ({self.pais})"

class Jogo(models.Model):    
    # torneio = models.ForeignKey(Torneio, on_delete=models.PROTECT)
    timea = models.CharField(max_length=50, verbose_name='Time A')
    timeb = models.CharField(max_length=50, verbose_name='Time B')
    horario = models.DateTimeField()
    pais = models.CharField(max_length=50, verbose_name="País", null=True)
    observacoes = models.TextField(verbose_name="Observações", null=True)
    usuario = models.ForeignKey(User, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.timea} X {self.timeb} - dia {self.horario:%d/%m/%Y %H:%M}"

class Horario(models.Model):
    horario = models.DateTimeField(auto_now_add=False)

    def __str__(self):
        return "{}".format(self.horario)
