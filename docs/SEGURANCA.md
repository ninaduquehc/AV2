# Arquitetura de segurança — greencode

## Criptografia de dados (AES-256-GCM)
Todos os arquivos de persistência (`*.enc`) são criptografados com AES-256 no modo
GCM, que além de cifrar autentica o conteúdo (gera uma "tag" verificada na leitura).
Isso significa que qualquer alteração no arquivo fora do sistema — não só torná-lo
ilegível, mas também qualquer adulteração de bytes — é detectada na descriptografia,
que falha com erro em vez de devolver dado incorreto silenciosamente. A chave de
256 bits é gerada com `crypto.randomBytes(32)` no provisionamento e fica salva em
`config.json`.

## Hash de senhas (SHA-256 + salt)
Senhas nunca são armazenadas nem circulam em texto puro após o cadastro. Cada
usuário recebe um salt aleatório de 16 bytes; o hash gravado é
`SHA-256(salt + senha)`. O salt individual impede que duas senhas iguais gerem o
mesmo hash (evita ataques de rainbow table). A comparação no login usa
`crypto.timingSafeEqual`, em tempo constante, para não vazar informação por
diferença de tempo de resposta.

## Expiração de sessão
A sessão expira após 30 minutos de inatividade. Cada comando digitado (via
`lerComando`) reseta o cronômetro; a checagem acontece a cada leitura, lançando
`SessaoExpiradaError` se o limite foi ultrapassado — o usuário precisa autenticar
novamente.

## Escrita atômica
Toda gravação em disco (`escreverAtomico`) grava primeiro em um arquivo temporário
e só then renomeia para o nome final. Como o rename é uma operação quase
instantânea do sistema operacional, uma interrupção do processo durante a escrita
nunca deixa o arquivo original corrompido.

## Journal como log de auditoria imutável
Cada transação relevante é registrada no `journal.log` **antes** de o dado ser
efetivamente alterado, em uma cadeia de hashes (cada registro guarda o hash do
anterior). Isso permite:
- Verificar a integridade retroativa de toda a cadeia (`verificarIntegridadeJournal`).
- Detectar exatamente em qual registro uma adulteração ocorreu.
- Cumprir a retenção mínima de 180 dias e a rotação automática ao atingir 10 MB,
  arquivando o journal ativo em `journal.log.<timestamp>.bak`.

## Cenários de falha testados
| Cenário | Comportamento esperado |
|---|---|
| Senha incorreta no login | Acesso negado, sem detalhar se o usuário existe |
| CNPJ inválido ou duplicado | Cadastro rejeitado antes de tocar o disco |
| Data de lote futura ou > 90 dias | Cadastro rejeitado |
| Desmonte sem triagem completa | `RegraDeNegocioError`, nada é alterado |
| Queda de 2+ categorias sem justificativa | `RegraDeNegocioError`, nada é alterado |
| Interrupção durante escrita de arquivo | Arquivo original preservado (escrita atômica) |
| Arquivo `.enc` adulterado externamente | Falha na tag do GCM ao descriptografar |
| Journal adulterado | Cadeia de hashes quebra no ponto exato da alteração |
| Sessão parada por 30+ minutos | Próximo comando exige novo login |