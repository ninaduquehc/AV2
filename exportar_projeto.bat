
@echo off
cd /d C:\Users\Marina\AV2

set "SAIDA=projeto_completo.txt"
if exist "%SAIDA%" del "%SAIDA%"

echo ===== ESTRUTURA DO PROJETO ===== > "%SAIDA%"
tree src /F /A >> "%SAIDA%"
tree prisma /F /A >> "%SAIDA%"
tree docs /F /A >> "%SAIDA%"

echo. >> "%SAIDA%"
echo ===== ARQUIVOS DE CONFIGURACAO ===== >> "%SAIDA%"

for %%F in (package.json tsconfig.json .gitignore README.md prisma.config.ts) do (
    if exist "%%F" (
        echo. >> "%SAIDA%"
        echo ===== ARQUIVO: %%F ===== >> "%SAIDA%"
        type "%%F" >> "%SAIDA%"
    )
)

echo. >> "%SAIDA%"
echo ===== CODIGO TYPESCRIPT ===== >> "%SAIDA%"

for /R src %%F in (*.ts) do (
    echo. >> "%SAIDA%"
    echo ===== ARQUIVO: %%F ===== >> "%SAIDA%"
    type "%%F" >> "%SAIDA%"
)

echo. >> "%SAIDA%"
echo ===== ARQUIVOS PRISMA ===== >> "%SAIDA%"

for /R prisma %%F in (*.prisma *.ts *.sql) do (
    echo. >> "%SAIDA%"
    echo ===== ARQUIVO: %%F ===== >> "%SAIDA%"
    type "%%F" >> "%SAIDA%"
)

echo Exportacao concluida: %CD%\%SAIDA%
