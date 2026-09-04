# Vistoria do projeto — Memória de Reunião

Última atualização: 4 de setembro de 2026

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
- [x] Schema inicial de reuniões, participantes, decisões e tarefas
- [x] RLS inicial para isolamento por usuário
- [ ] Projeto Supabase provisionado e conectado
- [ ] Migração aplicada em ambiente remoto
- [ ] Bucket privado `meeting-audios` criado
- [ ] Políticas RLS do Storage criadas e verificadas
- [ ] Callback e renovação de sessão configurados
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

- [ ] `GROQ_API_KEY` configurada no ambiente
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
