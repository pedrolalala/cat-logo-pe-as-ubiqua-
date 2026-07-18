# AI DB Context — Catálogo de Peças Ubiqua

Este sistema **não é um projeto Supabase separado**. Ele usa o mesmo projeto central `vcvcwzmbiftcawncibke` do resto do ecossistema Lucenera. Migrations novas para as tabelas abaixo nascem em `supabase/db/migrations/` do **repositório central** (`ADAPTA-PASS-Lucenera`), nunca dentro da pasta `04-Sistemas/catalogo-pecas-ubiqua-e6fa0/supabase/migrations/` deste submodule — essa pasta local é histórico técnico de ~30 migrations aplicadas diretamente no passado, por fora do fluxo central, e não deve mais ser tratada como fonte de verdade. A fonte de verdade de schema é `supabase/db/current/` no repo central.

Ver `03-Projeto/Planos de Ação/SPECs/SPEC-036_Catalogo_Ubiqua_Marca_Isolamento_Clientes_e_Cores.md` para o histórico da última mudança estrutural relevante (isolamento de clientes por representante).

## Domínio de dados — 6 tabelas principais

- **`empresa_ubiqua`** — dados da representação/empresa do representante: nome fantasia, razão social, CNPJ, cidade, estado. Preenchida no onboarding.
- **`usuarios_ubiqua`** — perfil do representante. `id` é FK para `auth.users(id)` (mesmo pool de autenticação Supabase do resto do ecossistema). Tem `nivel_acesso` (enum `nivel_acesso_tipo`: `'revendedor' | 'interno' | 'admin'`, default `'revendedor'`) e `empresa_id` (FK para `empresa_ubiqua`).
- **`revenda_ubiqua`** — catálogo de produtos revendidos. Tem `cor`, `valor_revenda`, `disponivel`. É alimentada por até 3 planilhas de origem, com colunas `fonte_planilha1`/`fonte_planilha2`/`fonte_planilha3` indicando de qual fonte veio cada registro.
- **`informacoes_cliente_ubiqua`** — cadastro de cliente PJ do representante (sempre CNPJ, nunca CPF/data de nascimento). Tem `cadastrado_por_usuario_id` (FK para `usuarios_ubiqua.id`, adicionada pela SPEC-036) para isolamento por representante — RLS restringe SELECT/INSERT/UPDATE/DELETE ao dono do cadastro (`cadastrado_por_usuario_id = auth.uid()`) ou a `usuarios_ubiqua.nivel_acesso IN ('admin','interno')`. A policy pré-existente `"Permitir leitura admin_gerente"` (staff Lucenera central, `usuarios.role IN ('admin','gerente')`) continua valendo e não foi alterada. Clientes cadastrados antes da SPEC-036 ficam com `cadastrado_por_usuario_id = NULL` (sem backfill automático) — visíveis apenas para staff/admin/interno até decisão futura de atribuição manual.
- **`orcamentos_revenda_ubiqua`** — orçamento do representante. `cliente_id` é `NOT NULL`, ou seja, não é possível montar orçamento sem cliente selecionado antes.
- **`itens_orcamento_ubiqua`** — itens de cada orçamento (produto, quantidade, cor, preço).

## Observação sobre dados de `revenda_ubiqua`

- A coluna `desc_produto` às vezes contém o nome da cor embutido no texto livre (ex.: `"... - CORTEN"`), além de existir a coluna `cor` dedicada.
- Os dados vêm de até 3 planilhas de origem (`fonte_planilha1/2/3`) que podem ter descrições e/ou preços conflitantes para o que deveria ser o "mesmo" produto físico. Isso é uma **característica conhecida dos dados**, não um bug de schema — não tentar "corrigir" isso só no código sem antes decidir qual fonte de planilha é autoritativa (ver Pendências da SPEC-036).

## Cuidados

- Não reintroduzir policies abertas (`USING (true)`) em `informacoes_cliente_ubiqua` — a RLS atual depende de `cadastrado_por_usuario_id` e `usuarios_ubiqua.nivel_acesso`.
- Ao criar cliente novo no frontend, sempre preencher `cadastrado_por_usuario_id` com `auth.uid()` do representante logado (não preencher/alterar no update, para não trocar o dono de um cliente existente).
- Não mexer em `groupCatalogItems()` (`src/hooks/use-parts.ts`) sem antes decidir, com o Vinicius, qual fonte de planilha é autoritativa quando há conflito de preço/descrição entre `fonte_planilha1/2/3` para a mesma descrição de produto.
- Atualizar este contexto se novas tabelas ou colunas de isolamento forem adicionadas ao domínio Ubiqua.
