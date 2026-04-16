# SCI – Sistema de Comando de Incidentes · 6° BBM
**Corpo de Bombeiros Militar do Maranhão · CBMMA**

Aplicação web para gerenciamento do Sistema de Comando de Incidentes (SCI) conforme o organograma expandido do CBMDF/CBMSP.

---

## Funcionalidades
- Estrutura SCI expandida completa (34 postos)
- Designação de militares por função com opção "Outro"
- Gestão de incidentes, missões e recursos
- Viaturas: ABT-14, AR-78
- Embarcação: Escaler (Motor 30HP)
- 21 militares do 6° BBM pré-cadastrados
- Log operacional em tempo real
- Exportação ICS-201
- **Sincronização em tempo real via Firebase Realtime Database**

---

## Estrutura do projeto
```
sci-6bbm/
├── index.html          ← aplicação principal
├── firebase.js         ← configuração Firebase (preencher suas chaves)
├── firebaseService.js  ← camada de serviço (leitura/escrita no DB)
├── README.md
└── .gitignore
```

---

## Configuração — passo a passo

### 1. Criar repositório no GitHub
```bash
git init
git add .
git commit -m "SCI 6BBM — versão inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/sci-6bbm.git
git push -u origin main
```

### 2. Configurar Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** → nome: `sci-6bbm`
3. No menu lateral: **Build → Realtime Database → Criar banco de dados**
   - Região: `us-central1`
   - Modo: **Iniciar no modo de teste** (muda depois)
4. No menu lateral: **Configurações do projeto (⚙) → Seus apps → Web (</>)**
   - Registre o app com o nome `sci-6bbm-web`
   - Copie o objeto `firebaseConfig` que aparecer

5. Cole suas chaves no arquivo `firebase.js` (veja comentários no arquivo)

### 3. Regras de segurança do Realtime Database
No Firebase Console → Realtime Database → Regras, cole:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
> ⚠️ Para produção, adicionar autenticação e restringir as regras.

### 4. Deploy no Firebase Hosting (opcional — acesso via URL pública)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Selecione o projeto sci-6bbm
# Public directory: . (ponto)
# Single-page app: Yes
firebase deploy
```
Após o deploy, o sistema fica disponível em:
`https://sci-6bbm.web.app`

---

## Uso sem Firebase
O sistema funciona 100% offline (dados em memória). Para ativar o Firebase,
preencha as chaves em `firebase.js` e descomente a linha `initFirebase()`
no final do `index.html`.

---

## Tecnologias
- HTML5 / CSS3 / JavaScript puro (sem frameworks)
- Firebase Realtime Database (sincronização em tempo real)
- Firebase Hosting (hospedagem)

---

*Desenvolvido para o 6° Batalhão de Bombeiros Militar – CBMMA*
