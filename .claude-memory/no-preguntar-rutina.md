---
name: no-preguntar-rutina
description: "No preguntar por acciones de rutina (abrir PowerShell, ejecutar comandos); el usuario siempre aprueba. Solo preguntar decisiones de diseño/negocio"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0d79d414-2e84-49ee-8766-cde06e6b878a
---

El usuario NO quiere que se le pregunte/consulte por acciones de rutina durante
el trabajo (abrir PowerShell, ejecutar comandos, -u, capturas, etc.): siempre
las aprueba. Solo se le deben hacer preguntas que sean **decisiones** reales
(diseño, negocio, flujo, alternativas).

**Why:** Las confirmaciones de rutina le hacen perder tiempo; quiere que avance
de corrido y solo le consulte lo que cambia el resultado.

**How to apply:** Proceder directamente con los pasos técnicos (editar, `-u`,
puppeteer, etc.) sin pedir permiso ni narrar "¿abro PowerShell?". Reservar las
preguntas (AskUserQuestion) para bifurcaciones de decisión. Las ventanas de
permiso del harness las aprueba él; si molestan, ofrecer añadir un allowlist en
.claude/settings.local.json (es una decisión de seguridad, así que esa sí se
consulta). Ver [[verificar-diseno-con-puppeteer]].
