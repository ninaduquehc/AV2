
# Diagrama de Classes e Arquitetura - GreenCode API

Este documento apresenta o diagrama de classes e a máquina de estados dos equipamentos da GreenCode API, sistema voltado à gestão de logística reversa e rastreabilidade de resíduos eletrônicos.

## 1. Diagrama de Classes

```mermaid
classDiagram
    class Usuario {
        +UUID id
        +String nome
        +String email
        +String senha
        +Role role
    }

    class Organizacao {
        +UUID id
        +String nome
        +String cnpj
        +TipoOrganizacao tipo
    }

    class Contrato {
        +UUID id
        +String numeroContrato
        +Json clausulas
        +DateTime vigenciaInicio
        +DateTime vigenciaFim
    }

    class Lote {
        +UUID id
        +String codigo
        +StatusLote status
        +DateTime dataRecebimento
    }

    class Equipamento {
        +UUID id
        +String codigoBarrasInterno
        +String tipo
        +StatusEquipamento status
        +Int version
    }

    class Movimentacao {
        +UUID id
        +DateTime dataHora
        +StatusEquipamento statusAnterior
        +StatusEquipamento statusNovo
        +String observacao
    }

    Organizacao "1" -- "0..1" Contrato : possui
    Organizacao "1" -- "0..*" Lote : recebe
    Lote "1" -- "1..*" Equipamento : contem
    Equipamento "1" -- "0..*" Movimentacao : rastreado
    Usuario "1" -- "0..*" Movimentacao : registra
```

## 2. Máquina de Estados Finita (FSM) dos Equipamentos

A máquina de estados representa as transições permitidas durante o ciclo de rastreabilidade dos equipamentos eletrônicos.

```mermaid
stateDiagram-v2
    [*] --> RECEBIDO
    RECEBIDO --> EM_TRIAGEM

    EM_TRIAGEM --> EM_DESMONTAGEM
    EM_TRIAGEM --> PRONTO_REUSO

    EM_DESMONTAGEM --> TESTE_COMPONENTES

    TESTE_COMPONENTES --> PRONTO_REUSO
    TESTE_COMPONENTES --> PRONTO_DESCARTE

    PRONTO_REUSO --> REUSO
    PRONTO_DESCARTE --> DESCARTE

    REUSO --> [*]
    DESCARTE --> [*]
```

## 3. Observações

- O diagrama de classes apresenta os principais atributos e relacionamentos do domínio.
- A máquina de estados descreve o fluxo esperado para o processamento dos equipamentos.
- As transições devem respeitar as regras de negócio implementadas na API.
- Tentativas de transição para estados não permitidos devem ser rejeitadas conforme as validações da aplicação.
- O atributo `version` do equipamento está relacionado ao controle otimista de concorrência, quando implementado na camada de persistência.
