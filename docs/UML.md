# Diagrama de Classes UML & Entidades (AV2)

```mermaid
classDiagram
    class Usuario {
        +UUID id
        +String nome
        +String email
        +Role role
        +String senha
        +DateTime createdAt
    }

    class Organizacao {
        +UUID id
        +String nome
        +String cnpj
        +TipoOrganizacao tipo
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Contrato {
        +UUID id
        +String numeroContrato
        +Json clausulas
        +DateTime vigenciaInicio
        +DateTime vigenciaFim
        +UUID organizacaoId
        +DateTime createdAt
    }

    class Lote {
        +UUID id
        +String codigo
        +StatusLote status
        +DateTime dataRecebimento
        +UUID organizacaoId
        +DateTime createdAt
    }

    class Equipamento {
        +UUID id
        +String codigoBarrasInterno
        +String tipo
        +StatusEquipamento status
        +Int version
        +UUID loteId
        +DateTime createdAt
        +DateTime updatedAt
    }

    class MovimentacaoEquipamento {
        +UUID id
        +DateTime dataHora
        +UUID equipamentoId
        +UUID usuarioId
        +StatusEquipamento statusAnterior
        +StatusEquipamento statusNovo
        +String observacao
    }

    Organizacao "1" -- "0..1" Contrato : possui
    Organizacao "1" -- "0..*" Lote : gera
    Lote "1" -- "0..*" Equipamento : contem
    Equipamento "1" -- "0..*" MovimentacaoEquipamento : possui
    Usuario "1" -- "0..*" MovimentacaoEquipamento : registra