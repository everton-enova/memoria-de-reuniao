# Vistoria do projeto — Memória de Reunião

Última atualização: 4 de setembro de 2026

## Resumo executivo

| Área | Estado | Próxima ação |
| --- | --- | --- |
| Código-base | Concluído | Evoluir o dashboard demonstrativo para o fluxo real |
| GitHub | Concluído | Manter `main` sincronizada a cada sessão |
| Groq local | Configurado | Implementar e testar o cliente de transcrição |
| Groq produção | Pendente | Adicionar `GROQ_API_KEY` na Vercel |
| Supabase | Conectado localmente | Aplicar schema e configurar Storage |
| Vercel | Pendente | Criar/importar projeto e configurar variáveis |
| Áudio e transcrição | Não iniciado | Implementar depois das integrações |

## Fluxo dos ambientes e das chaves

O GitHub guarda somente o código e o arquivo `.env.example`, que contém nomes de variáveis sem valores. Segredos nunca vão para o GitHub.

### Desenvolvimento local

Arquivo usado: `.env.local`.

- Fica apenas na máquina de desenvolvimento.
- É carregado automaticamente pelo Next.js ao executar `pnpm dev`.
- Está protegido pelo `.gitignore`.
- Atualmente contém `GROQ_API_KEY` para os testes locais.
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` estão configuradas.

### Preview e produção

Local usado: **Vercel → projeto → Settings → Environment Variables**.

Cadastrar estas três variáveis na Vercel:

| Variável | É segredo? | Ambientes | Origem |
| --- | --- | --- | --- |
| `GROQ_API_KEY` | Sim | Development, Preview e Production | Groq Console |
| `NEXT_PUBLIC_SUPABASE_URL` | Não | Development, Preview e Production | Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública com RLS | Development, Preview e Production | Supabase Project Settings → API |

Regras:

- `GROQ_API_KEY` nunca recebe o prefixo `NEXT_PUBLIC_` e só pode ser lida pelo backend.
- A chave Groq colocada em `.env.local` não chega automaticamente à Vercel; é necessário cadastrá-la também no painel da Vercel.
- Depois de alterar uma variável na Vercel, é necessário fazer um novo deploy para a mudança entrar em produção.
- Preview e Production podem começar com o mesmo projeto Supabase no MVP. Antes de crescer, separar banco de testes e banco de produção.
- Não usar nem expor `SUPABASE_SERVICE_ROLE_KEY` neste MVP. As operações devem respeitar o usuário autenticado e as políticas RLS.

### Fluxo completo de configuração

1. Criar o projeto no Supabase.
2. Executar `supabase/schema.sql` no SQL Editor.
3. Criar o bucket privado `meeting-audios`.
4. Copiar URL e anon key do Supabase para `.env.local`.
5. Importar o repositório do GitHub na Vercel.
6. Cadastrar as três variáveis no painel da Vercel.
7. Fazer o primeiro deploy.
8. Copiar o endereço do deploy para as URLs permitidas do Supabase Auth.
9. Testar cadastro, login, upload, transcrição e persistência.

### Responsabilidades

**Everton:** criar/administrar as contas Supabase, Groq e Vercel e cadastrar os segredos diretamente nos painéis.

**Codex:** implementar o código, atualizar esta vistoria, verificar lint/build, sincronizar Git e orientar os testes. Segredos não serão incluídos em commits.

## Objetivo do produto

Aplicação web que permite gravar uma reunião pelo navegador ou enviar um arquivo de áudio. O sistema transcreve o áudio em nuvem, cria uma memória estruturada com resumo, tópicos, decisões e tarefas, e permite ao usuário revisar, editar e exportar o resultado.

## Stack decidida

- [x] Next.js com TypeScript e App Router
- [x] Hospedagem planejada na Vercel
- [x] Supabase para autenticação, banco de dados e armazenamento privado
- [x] Groq API como serviço em nuvem para transcrição e organização da memória
- [x] Sem Python ou modelo de IA executado na infraestrutura do projeto

## Estado atual

### Fundação

- [x] Repositório e projeto Next.js inicializados
- [x] Tailwind CSS configurado
- [x] Layout responsivo inicial
- [x] Metadados e idioma `pt-BR`
- [x] `.env.example` criado
- [x] README com instruções iniciais
- [x] Lint aprovado
- [x] Build de produção aprovado

### Interface

- [x] Dashboard demonstrativo de reuniões
- [x] Cards demonstrativos de métricas
- [x] Lista demonstrativa de reuniões
- [x] Lista demonstrativa de tarefas
- [x] Tela de login e cadastro
- [ ] Dashboard conectado aos dados reais do Supabase
- [ ] Estados de carregamento, vazio e erro
- [ ] Navegação mobile completa

### Supabase

- [x] Clientes Supabase para navegador e servidor
- [x] Actions de login e cadastro por e-mail
- [x] URL e publishable key configuradas no ambiente local
- [x] Proxy de renovação da sessão configurado para Next.js 16
- [x] Schema inicial de reuniões, participantes, decisões e tarefas
- [x] RLS inicial para isolamento por usuário
- [x] Projeto Supabase provisionado e conectado localmente
- [ ] Migração aplicada em ambiente remoto
- [ ] Bucket privado `meeting-audios` criado
- [ ] Políticas RLS do Storage criadas e verificadas
- [x] Renovação de sessão configurada
- [ ] Callback de confirmação de e-mail configurado
- [ ] Logout implementado

### Áudio

- [ ] Gravação pelo microfone com `MediaRecorder`
- [ ] Pausar, continuar, encerrar e descartar gravação
- [ ] Prévia do áudio antes do envio
- [ ] Upload de MP3, M4A, WAV, WebM e OGG
- [ ] Validação de formato, tamanho e duração
- [ ] Upload direto para o Supabase Storage
- [ ] Player para ouvir o áudio salvo
- [ ] Exclusão segura do áudio

### Groq e processamento

- [x] `GROQ_API_KEY` configurada no ambiente local
- [ ] `GROQ_API_KEY` configurada na Vercel para Preview e Production
- [ ] Cliente Groq somente no servidor
- [ ] Transcrição do áudio em nuvem
- [ ] Geração de título e resumo
- [ ] Extração estruturada de tópicos e decisões
- [ ] Extração de tarefas, responsáveis e prazos
- [ ] Status `uploaded`, `transcribing`, `organizing`, `completed` e `failed`
- [ ] Registro seguro de erros e opção de tentar novamente
- [ ] Estratégia assíncrona para reuniões longas
- [ ] Limites de uso e proteção contra abuso

### Memória da reunião

- [ ] Página de detalhe da reunião
- [ ] Editor da transcrição
- [ ] Editor do resumo
- [ ] CRUD de decisões
- [ ] CRUD de tarefas
- [ ] CRUD de participantes
- [ ] Marcação de tarefas concluídas
- [ ] Busca no histórico
- [ ] Exportação para Markdown
- [ ] Exportação para PDF

### Segurança e privacidade

- [x] Chave da Groq planejada apenas no servidor
- [x] Bucket de áudio definido como privado na arquitetura
- [ ] Termos de uso e política de privacidade
- [ ] Exclusão de conta e dados
- [ ] Política de retenção dos áudios
- [ ] Auditoria completa das políticas RLS
- [ ] Proteção e rate limiting das rotas de processamento

### Deploy e operação

- [ ] Projeto criado na Vercel
- [ ] Variáveis configuradas em Development, Preview e Production
- [ ] Primeiro deploy publicado
- [ ] URLs de autenticação configuradas no Supabase
- [ ] Fluxo completo testado em produção
- [ ] Monitoramento de erros
- [ ] Domínio personalizado

## Ações necessárias do proprietário

- [x] Criar o projeto no Supabase
- [x] Adicionar URL e publishable key do Supabase ao `.env.local`
- [ ] Criar o bucket privado `meeting-audios`
- [ ] Aplicar o schema no Supabase
- [ ] Criar ou importar o projeto na Vercel
- [ ] Adicionar as três variáveis à Vercel
- [ ] Informar quando Supabase e Vercel estiverem configurados para o teste ponta a ponta

## Próximo marco — MVP funcional

1. Provisionar e conectar Supabase e Groq.
2. Atualizar o schema para arquivos de áudio e estados de processamento.
3. Implementar gravação e upload privado.
4. Implementar transcrição Groq.
5. Gerar e persistir a memória estruturada.
6. Criar a página de revisão e edição.
7. Publicar na Vercel e validar o fluxo de ponta a ponta.

## Critério de conclusão do MVP

O MVP estará concluído quando um usuário puder criar uma conta, gravar ou enviar um áudio, aguardar o processamento, revisar a transcrição e a memória estruturada, editar tarefas e decisões e reencontrar a reunião após um novo login.

## Registro de verificações

| Data | Verificação | Resultado |
| --- | --- | --- |
| 04/09/2026 | `pnpm lint` | Aprovado |
| 04/09/2026 | `pnpm build` | Aprovado — rotas `/` e `/login` |
