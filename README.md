# Minhas Tarefas — Agenda diária

Aplicação independente reconstruída a partir das capturas de tela de referência do projeto feito no Atoms. **Não é a exportação do código-fonte original do Atoms.**

## Funcionalidades
- Login, criação de conta e recuperação de senha com Supabase Auth
- Agenda diária com navegação por data e progresso
- Criar, editar, concluir e excluir tarefas, com descrição, horário, categoria e prazo
- Tarefas repetidas diariamente, em dias úteis, semanalmente ou mensalmente, com status independente por ocorrência
- Relatórios mensais e semanais, com métricas e exportação DOCX e XLSX
- Tema claro/escuro e cinco paletas de cores salvas neste navegador
- Dados privados por usuário com Row Level Security (RLS)
- Interface responsiva para computador e celular

## Hospedagem
Site Netlify: https://minhas-tarefas-nicolas.netlify.app/
Configuração em \`netlify.toml\`, com deploy automático da branch \`main\`.
Não requer comando de build: HTML, CSS e JavaScript são publicados como arquivos estáticos.

## Banco de dados
Projeto Supabase: \`dbzgcydwevpjsfindwcx\`
Tabelas dedicadas:
- \`public.agenda_tarefas\`
- \`public.agenda_categorias\`

Ambas estão com RLS e políticas de acesso por \`auth.uid()\`. A chave do frontend é a **publishable key** (não uma chave secreta). As tabelas antigas de listas não são utilizadas.

## Observações
- As tarefas originais do Atoms não foram importadas: as capturas não fornecem os dados completos nem o acesso ao banco original.
- Uma ocorrência editada de uma série recorrente é independente; novas datas são geradas conforme o período é acessado.
- Ao excluir uma ocorrência recorrente, ela fica marcada como excluída para não ser recriada.
- Alterações simultâneas de uma mesma conta em dispositivos diferentes podem exigir recarregar a página.
- Exportação Word usa JSZip e Excel usa SheetJS via CDN. É necessária conexão com a internet.
- A versão depende de bibliotecas externas via CDN (Supabase, XLSX e JSZip).
- A configuração de Auth pode exigir ajuste das URLs permitidas (Netlify) no painel Supabase.
- Por segurança, configure proteção contra senhas comprometidas no Supabase Auth e use senha forte.

## Arquivos
- \`index.html\` — interface e scripts externos
- \`styles.css\` — estilos e temas
- \`app.js\` — lógica do aplicativo e Supabase
- \`netlify.toml\` — configuração de hospedagem
