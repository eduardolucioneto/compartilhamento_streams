# Generated by Django 5.1.3 on 2024-11-15 22:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jogos', '0003_remove_jogo_torneio_delete_torneio'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pais',
            name='pais',
            field=models.CharField(max_length=50, verbose_name='País'),
        ),
    ]
