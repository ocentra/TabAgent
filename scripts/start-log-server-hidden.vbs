Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c npm run logs", 0, False
Set WshShell = Nothing

