# Guia de Publicação de Releases

Este documento explica como publicar novas versões do ZenTask no GitHub para que os usuários recebam atualizações automáticas.

## Pré-requisitos

1. **GitHub Personal Access Token**
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token" → "Generate new token (classic)"
   - Nome: `ZenTask Release Token`
   - Selecione o escopo: `repo` (acesso completo ao repositório)
   - Clique em "Generate token"
   - **IMPORTANTE**: Copie o token e guarde em local seguro (você não poderá vê-lo novamente)

2. **Configurar Token no Sistema**
   - Windows: Adicione variável de ambiente `GH_TOKEN` com o valor do token
   - Ou crie arquivo `.env` na raiz do projeto:
     ```
     GH_TOKEN=seu_token_aqui
     ```

## Processo de Release

### 1. Atualizar Versão

Edite `package.json` e incremente a versão:
```json
{
  "version": "0.2.1"  // Exemplo: de 0.2.0 para 0.2.1
}
```

### 2. Build da Aplicação

```bash
npm run build
npm run electron:build
```

Isso irá:
- Compilar o código React
- Criar o instalador em `release/`
- Gerar arquivos necessários para publicação

### 3. Criar Release no GitHub

#### Opção A: Via GitHub CLI (Recomendado)

```bash
# Instalar GitHub CLI se não tiver
# https://cli.github.com/

# Criar release
gh release create v0.2.1 \
  --title "ZenTask v0.2.1" \
  --notes "Descrição das mudanças nesta versão" \
  release/ZenTask-Setup-0.2.1.exe
```

#### Opção B: Via Interface Web

1. Acesse: https://github.com/maikmano/zentask/releases/new
2. Tag version: `v0.2.1` (deve começar com 'v')
3. Release title: `ZenTask v0.2.1`
4. Descrição: Liste as mudanças desta versão
5. Anexe o arquivo `release/ZenTask-Setup-0.2.1.exe`
6. Clique em "Publish release"

### 4. Verificar Auto-Update

1. Usuários com versão anterior instalada
2. Ao abrir o app, após 5 segundos verão notificação de atualização
3. Clicar em "Baixar" → "Instalar e Reiniciar"
4. App fecha, instala nova versão e reabre

## Versionamento Semântico

- **Patch** (0.2.0 → 0.2.1): Correções de bugs
- **Minor** (0.2.1 → 0.3.0): Novas funcionalidades
- **Major** (0.3.0 → 1.0.0): Mudanças que quebram compatibilidade

## Troubleshooting

### Token não funciona
- Verifique se o token tem permissão `repo`
- Certifique-se que está configurado como variável de ambiente `GH_TOKEN`

### Build falha
- Execute `npm install` novamente
- Verifique se todas as dependências estão instaladas
- Certifique-se que `npm run build` funciona antes de `electron:build`

### Usuários não recebem atualização
- Verifique se a release foi publicada (não draft)
- Confirme que o arquivo .exe está anexado à release
- Tag deve começar com 'v' (exemplo: v0.2.1)
