from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.http.response import HttpResponse, HttpResponseRedirect
from django.contrib.auth import authenticate
from django.contrib.auth import login as login_django
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.contrib.auth import update_session_auth_hash
from django.contrib import messages


def register(request):
    if request.method == "GET":
        return render(request, 'register.html')
    else:
        username = request.POST.get('username')
        email = request.POST.get('email')
        senha = request.POST.get('senha')        
    
        user = User.objects.filter(username=username).first()

        if user:
            return HttpResponse('Já existe um usuário com esse username')
        
        user = User.objects.create_user(username=username, email=email, password=senha)
        user.save()
        
        return HttpResponse('Usuário cadastrado com sucesso')
def login(request):
    if request.method == "GET":
        return render(request, 'login.html')
    else:
        username = request.POST.get('username')
        senha = request.POST.get('senha')

        user = authenticate(username=username, password=senha)

        if user:
            login_django(request, user)
            return redirect('listar-jogos')
        else:
            return HttpResponse('Dados invalidos')

def user_logout(request):
    """
    View para fazer logout do usuário e redirecionar para a página inicial.
    """
    logout(request)  # Realiza o logout do usuário
    return render(request, 'login_normal.html')  # Redireciona para a página de login

@login_required
def trocar_senha(request):
    if request.method == "GET":
        return render(request, 'trocar_senha.html')
    else:
        senha_atual = request.POST.get('senha_atual')
        nova_senha = request.POST.get('nova_senha')
        confirmar_senha = request.POST.get('confirmar_senha')

        # Verifica se as senhas novas coincidem
        if nova_senha != confirmar_senha:
            return HttpResponse('As senhas novas não coincidem.')

        # Verifica se a senha atual está correta
        if not request.user.check_password(senha_atual):
            return HttpResponse('A senha atual está incorreta.')

        # Altera a senha do usuário
        user = request.user
        user.set_password(nova_senha)
        user.save()

        # Atualiza a sessão para evitar logout
        update_session_auth_hash(request, user)

        return render('login.html')

@login_required(login_url='login')        
def plataforma(request):   
    return HttpResponse('Plataforma')



