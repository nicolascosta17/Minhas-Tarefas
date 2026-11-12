# Minhas Tarefas — React + Supabase

Sistema de agenda de tarefas reconstruído a partir das telas enviadas, usando React 19, Vite, Supabase e Netlify. Código independente do Atoms, sem exportação original.

## Funcionalidades
- Interface responsiva para celular, tablet e computador, com temas claro/escuro e cinco paletas
- Login, cadastro, recuperação de senha e sessão persistente via Supabase Auth
- Tarefas com título, descrição, data, horário, prazo e conclusão com carimbo de data/hora
- Repetição diária, em dias úteis, semanal ou mensal; status independente em cada ocorrência
- **Departamentos:** cadastrar, editar, excluir, escolher cor e vincular a tarefas
- Categorias personalizadas
- Relatórios mensais e semanais, incluindo departamento, com download em Word e Excel
- Salvamento de tarefas, categorias, departamentos e preferências na conta do Supabase

## Banco de dados
Projeto: `dbzgcydwevpjsfindwcx`. Todas as tabelas abaixo têm Row Level Security (RLS), vinculadas a `auth.uid()`:
- `agenda_tarefas` — tarefas e vínculo `departamento_id`
- `agenda_departamentos` — departamentos da conta
- `agenda_categorias` — categorias da conta
- `agenda_preferencias` — modo claro/escuro e paleta de cada conta

Os 42 registros previamente importados para novembro de 2026 foram preservados, junto dos três departamentos identificados nos relatórios históricos. Dados de um usuário não são visíveis aos demais por meio da API pública.

## Executar
```bash
npm install
npm run dev
npm run build
```
O arquivo `.env.example` mostra as variáveis opcionais `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
A chave publishable é destinada ao navegador. Nunca use service_role ou secret keys no frontend.

## Hospedagem
Netlify: https://minhas-tarefas-nicolas.netlify.app

`netlify.toml` executa `npm run build` e publica `dist`. O deploy da branch `main` é automático.

## Limitações
- O código não é uma cópia literal do projeto original do Atoms.
- Repetições futuras são geradas quando o intervalo correspondente é aberto; cada ocorrência é individual.
- A atualização simultânea em vários dispositivos pode exigir atualização da página.
- Recomenda-se ativar a proteção contra senhas vazadas no Supabase Auth.
