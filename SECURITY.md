# 🔒 Política de Segurança

## Versões Suportadas

Apenas a versão mais recente recebe atualizações de segurança.

| Versão | Suportada |
| ------ | :-------: |
| 3.x.x  |    ✅     |
| < 3.0  |    ❌     |

## Reportando uma Vulnerabilidade

-   Descrição da vulnerabilidade
-   Passos para reproduzir
-   Impacto potencial
-   Sugestão de correção (se tiver)

## Escopo

Aceitamos relatos de:

-   Bypass de autenticação / autorização
-   Injeção (SQL, XSS, CSRF, path traversal)
-   Exposição de dados sensíveis
-   Bypass de rate limiting
-   Falhas em JWT
-   Vulnerabilidades em dependências (com PoC)

**Fora do escopo:**

-   Self-XSS
-   Ataques que exigem acesso físico ao servidor
-   Spam / engenharia social
-   Vulnerabilidades já conhecidas em dependências sem impacto real

## Boas Práticas no Projeto

Este projeto já implementa:

-   ✅ JWT com issuer + access/refresh separados
-   ✅ 2FA (TOTP)
-   ✅ Account lockout
-   ✅ Política de senha forte
-   ✅ Rate limiting global + por rota
-   ✅ Helmet (CSP, HSTS, X-Frame-Options)
-   ✅ Validação com Zod
-   ✅ Backup criptografado (AES-256-GCM)
-   ✅ Logs de auditoria (`SEC_*`)

## Créditos

Pesquisadores que reportarem vulnerabilidades válidas serão creditados no `CHANGELOG.md` (se desejarem).
