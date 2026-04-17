@echo off
echo Starting ngrok tunnels for LM Studio and n8n...
echo.
echo Make sure the following are running before continuing:
echo   - LM Studio on port 1234
echo   - n8n on port 5678
echo.
ngrok start --all --config=ngrok.yml
pause
