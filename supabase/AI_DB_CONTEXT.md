# AI DB Context — Catálogo de Peças Ubiqua

Este sistema **não é um projeto Supabase separado**. Ele usa o mesmo projeto central `vcvcwzmbiftcawncibke` do resto do ecossistema Lucenera. Migrations novas para as tabelas abaixo nascem em `supabase/db/migrations/` do **repositório central** (`ADAPTA-PASS-Lucenera`), nunca dentro da pasta `04-Sistemas/catalogo-pecas-ubiqua-e6fa0/supabase/migrations/` deste submodule — essa pasta local é histórico técnico de ~30 migrations aplicadas diretamente no passado, por fora do fluxo central, e não deve mais ser tratada como fonte de verdade. A fonte de verdade de schema é `supabase/db/current/` no repo central.

Ver `03-Projeto/Planos de Ação/SPECs/SPEC-036_Catalogo_Ubiqua_Marca_Isolamento_Clientes_e_Cores.md` para o histórico da última mudança estrutural relevante (isolamento de clientes por representante).

## Domínio de dados — 6 tabelas principais

- **`empresa_ubiqua`** — dados da representação/empresa do representante: nome fantasia, razão social, CNPJ, cidade, estado. Preenchida no onboarding.
- **`usuarios_ubiqua`** — perfil do representante. `id` é FK para `auth.users(id)` (mesmo pool de autenticação Supabase do resto do ecossistema). Tem `nivel_acesso` (enum `nivel_acesso_tipo`: `'revendedor' | 'interno' | 'admin'`, default `'revendedor'`) e `empresa_id` (FK para `empresa_ubiqua`).
- **`revenda_ubiqua`** — catálogo de produtos revendidos. Tem `cor`, `valor_revenda`, `disponivel`. É alimentada por até 3 planilhas de origem, com colunas `fonte_planilha1`/`fonte_planilha2`/`fonte_planilha3` indicando de qual fonte veio cada registro.
- **`informacoes_cliente_ubiqua`** — cadastro de cliente do representante. `cpf_cnpj` aceita CPF (pessoa física) ou CNPJ (pessoa jurídica) — decisão revista em 2026-07-20, substituindo a regra anterior da SPEC-036 de "sempre CNPJ, nunca CPF"; o formulário detecta automaticamente qual dos dois pelo número de dígitos digitados (`formatCPFOuCNPJ`/`isValidCPFOuCNPJ` em `src/lib/utils.ts`). Sem campo de data de nascimento. Tem `cadastrado_por_usuario_id` (FK para `usuarios_ubiqua.id`, adicionada pela SPEC-036) para isolamento por representante — RLS restringe SELECT/INSERT/UPDATE/DELETE ao dono do cadastro (`cadastrado_por_usuario_id = auth.uid()`) ou a `usuarios_ubiqua.nivel_acesso IN ('admin','interno')`. A policy pré-existente `"Permitir leitura admin_gerente"` (staff Lucenera central, `usuarios.role IN ('admin','gerente')`) continua valendo e não foi alterada. Clientes cadastrados antes da SPEC-036 ficam com `cadastrado_por_usuario_id = NULL` (sem backfill automático) — visíveis apenas para staff/admin/interno até decisão futura de atribuição manual.
- **`orcamentos_revenda_ubiqua`** — orçamento do representante. `cliente_id` é `NOT NULL`, ou seja, não é possível montar orçamento sem cliente selecionado antes. Tem `prazo_entrega text` (livre, pré-existente) — desde a SPEC-037, `NewQuote.tsx` preenche automaticamente com um aviso de prazo de importação quando o orçamento contém item sem estoque.
- **`itens_orcamento_ubiqua`** — itens de cada orçamento (produto, quantidade, cor, preço). Desde a SPEC-037, tem `sem_estoque_no_pedido boolean` (default `false`) — snapshot de se `revenda_ubiqua.disponivel` da variante era `<= 0` no momento do pedido; não é recalculado depois. Toda a marca Ubiqua é importada pela empresa do usuário, então "sem estoque" = "aguardando importação", não uma exceção.

## Necessidade de importação (SPEC-037)

Como toda peça Ubiqua sem estoque é importada, o catálogo permite adicionar ao orçamento uma peça com `disponivel <= 0` mediante aviso ao cliente (prazo estimado de até 3 meses) — não bloqueia mais a ação. A view `vw_necessidade_importacao_ubiqua` agrega, por produto (`revenda_ubiqua.id`), a demanda pendente de importação a partir de `itens_orcamento_ubiqua.sem_estoque_no_pedido = true` em orçamentos ativos (não cancelados/rejeitados) — segue o mesmo padrão de "necessidade de compra agregada por produto, não por cliente" já usado no domínio Estoque/Compras central (`supabase/db/domains/estoque_compras.md`), mas é uma view própria do domínio Ubiqua, não deve ser fundida com `vw_necessidade_compra` do fluxo Lucenera central. Só reflete demanda a partir da migration `20260719_053` em diante — sem backfill de pedidos antigos.

## Observação sobre dados de `revenda_ubiqua`

- A coluna `desc_produto` às vezes contém o nome da cor embutido no texto livre (ex.: `"... - CORTEN"`), além de existir a coluna `cor` dedicada.
- Os dados vêm de até 3 planilhas de origem (`fonte_planilha1/2/3`) que podem ter descrições e/ou preços conflitantes para o que deveria ser o "mesmo" produto físico. Isso é uma **característica conhecida dos dados**, não um bug de schema — não tentar "corrigir" isso só no código sem antes decidir qual fonte de planilha é autoritativa (ver Pendências da SPEC-036).

## Cuidados

- Não reintroduzir policies abertas (`USING (true)`) em `informacoes_cliente_ubiqua` — a RLS atual depende de `cadastrado_por_usuario_id` e `usuarios_ubiqua.nivel_acesso`.
- Ao criar cliente novo no frontend, sempre preencher `cadastrado_por_usuario_id` com `auth.uid()` do representante logado (não preencher/alterar no update, para não trocar o dono de um cliente existente).
- Não mexer em `groupCatalogItems()` (`src/hooks/use-parts.ts`) sem antes decidir, com o Vinicius, qual fonte de planilha é autoritativa quando há conflito de preço/descrição entre `fonte_planilha1/2/3` para a mesma descrição de produto.
- Atualizar este contexto se novas tabelas ou colunas de isolamento forem adicionadas ao domínio Ubiqua.
