# Diagrama de classes — greencode

```mermaid
classDiagram
    class Entidade {
        <<abstract>>
        +string id
        +string criadoEm
        +regras() string[]
        +resumo() string
    }

    class Validavel {
        <<interface>>
        +validar() boolean
    }

    class Organizacao {
        +string razosocial
        +string cnpj
        +TipoOrganizacao tipo
        +nome() string
        +validar() boolean
        +regras() string[]
        +resumo() string
        +deJSON(dados) Organizacao$
    }

    class Contrato {
        +string organizacaoId
        +string dataInicio
        +string dataFim
        +string termos
        +validar() boolean
        +regras() string[]
        +resumo() string
        +deJSON(dados) Contrato$
    }

    class Lote {
        +string organizacaoId
        +string notaFiscal
        +string transportadora
        +string dataEntrada
        +validar() boolean
        +regras() string[]
        +resumo() string
        +deJSON(dados) Lote$
    }

    class Equipamento {
        +string loteId
        +string tipo
        +string modelo
        +EstadoFisico estadoFisico
        +StatusEquipamento status
        +boolean triagemConcluida
        +validar() boolean
        +regras() string[]
        +resumo() string
        +deJSON(dados) Equipamento$
    }

    class Movimentacao {
        +string equipamentoId
        +string usuario
        +StatusEquipamento statusAnterior
        +StatusEquipamento statusNovo
        +EstadoFisico estadoAnterior
        +EstadoFisico estadoNovo
        +string justificativa
        +regras() string[]
        +resumo() string
        +deJSON(dados) Movimentacao$
    }

    class FabricaEntidades {
        <<factory>>
        +criarOrganizacao(razosocial, cnpj, tipo)$ Organizacao
        +criarContrato(organizacaoId, inicio, fim, termos)$ Contrato
        +criarLote(organizacaoId, nf, transp, dataEntrada)$ Lote
        +criarEquipamento(id, loteId, tipo, modelo, estado)$ Equipamento
    }

    class RegraDeNegocioError {
        <<error>>
    }

    class Repositorio~T~ {
        -string caminhoArquivo
        +carregar() T[]
        +salvar(dados) void
    }

    Entidade <|-- Organizacao
    Entidade <|-- Contrato
    Entidade <|-- Lote
    Entidade <|-- Equipamento
    Entidade <|-- Movimentacao

    Validavel <|.. Organizacao
    Validavel <|.. Contrato
    Validavel <|.. Lote
    Validavel <|.. Equipamento

    FabricaEntidades ..> Organizacao : cria
    FabricaEntidades ..> Contrato : cria
    FabricaEntidades ..> Lote : cria
    FabricaEntidades ..> Equipamento : cria

    Organizacao "1" --> "many" Contrato : possui
    Organizacao "1" --> "many" Lote : possui
    Lote "1" --> "many" Equipamento : contém
    Equipamento "1" --> "many" Movimentacao : gera

    Organizacao ..> RegraDeNegocioError : lança
    Contrato ..> RegraDeNegocioError : lança
    Lote ..> RegraDeNegocioError : lança
    Equipamento ..> RegraDeNegocioError : lança

    Repositorio ..> Entidade : persiste
```

## Onde aparece cada conceito exigido pelo PDF
- **Herança**: `Entidade` (abstrata) → `Organizacao`, `Contrato`, `Lote`, `Equipamento`, `Movimentacao`.
- **Interface**: `Validavel`, implementada por `Organizacao`, `Contrato`, `Lote`, `Equipamento`.
- **Polimorfismo**: cada subclasse implementa `regras()`, `resumo()` e (quando aplicável) `validar()` de forma própria.
- **Classe abstrata de validação**: `Entidade` define o contrato que toda entidade concreta deve preencher.
- **Fábrica**: `FabricaEntidades`, responsável por gerar IDs e montar os objetos compostos.