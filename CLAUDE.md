# remote-control

## Qué es
App móvil (Android) que funciona como control remoto de un Android TV a través
de WiFi. El celular es el control; el TV es el dispositivo controlado. No hay
backend: toda la comunicación es directa por red local (LAN).

Repositorio: https://github.com/Thibisay/remote-control.git — rama principal: `main`.
Estado: proyecto desde cero. Se empieza por la configuración de Expo/EAS.

## Stack
- Expo (React Native) + TypeScript
- expo-dev-client (NO Expo Go: se necesitan módulos nativos)
- EAS Build (genera el APK) y EAS Update (actualizaciones OTA de JS)
- GitHub Actions para CI/CD
- Protocolo Android TV Remote v2 (TLS + protobuf), descubrimiento por mDNS
- Almacenamiento local en el celular: certificado de emparejamiento y último TV
  (expo-secure-store / AsyncStorage)

## Arquitectura
- Sin servidor. Celular -> TV directamente por LAN.
- Capa de protocolo aislada de la UI (`src/tv/`): descubrimiento, emparejamiento,
  conexión, envío de teclas. La UI solo consume una interfaz simple
  (connect, sendKey, disconnect).
- Estados de conexión explícitos: buscando, emparejando, conectado,
  desconectado, error.
- Reconexión automática al último TV guardado.

## Funcionalidades objetivo (en orden)
1. Descubrir TVs en la red y emparejar con código
2. Navegación: D-pad, OK, atrás, home
3. Volumen, mute, encendido/apagado
4. Teclado para escribir texto en el TV
5. Abrir apps (Netflix, YouTube, etc.)
6. Guardar varios TVs

## CI/CD
- Push a `main` dispara GitHub Actions:
  - Solo cambios de JS/assets -> `eas update` (OTA)
  - Cambios nativos (dependencias nativas, permisos, app.json nativo) -> `eas build`
    (APK Android, perfil `preview`/`production`)
- El token de Expo (`EXPO_TOKEN`) va en GitHub Secrets. Nunca en el código.
- Mantener `runtimeVersion` coherente para que las OTA solo lleguen a APKs compatibles.
- Perfiles de `eas.json`: `development` (dev client), `preview` (APK interno), `production`.

## Cómo quiero trabajar
- Español en conversación y explicaciones; código, nombres y commits en inglés.
- Avanzar por pasos pequeños y verificables; no construir todo de golpe.
- Antes de agregar una dependencia, decir si es nativa (requiere nuevo build) o solo JS.
- Si algo cambia la configuración nativa o el flujo de CI/CD, avisarlo explícitamente.
- Explicar brevemente el porqué de las decisiones técnicas importantes.
- Commits pequeños y descriptivos; trabajar en ramas y mergear a `main` solo
  cuando funcione, porque `main` publica automáticamente.
- No inventar detalles del protocolo del TV: si hay dudas, verificar contra
  documentación o implementaciones de referencia antes de asumir.
- Probar en dispositivo real (celular + Android TV en la misma WiFi); el
  emulador no representa bien la red local.

## Restricciones
- Android primero; iOS fuera de alcance por ahora.
- Sin cuentas ni nube: todo se queda en el dispositivo.
- Los secretos y certificados de emparejamiento nunca se suben al repositorio.

## Flujo de trabajo con Git (Claude hace los commits)

Yo no escribo scripts ni comandos de git: tú te encargas de todo el control de versiones.

- Cuando termines una tarea que funcione, haz commit y push tú mismo, sin pedirme
  que ejecute nada.
- Nunca subas directo a `main`. Crea una rama por tarea (`feat/...`, `fix/...`,
  `chore/...`), haz push de la rama y abre un Pull Request hacia `main`.
- El PR debe incluir: qué cambió, por qué, y si requiere nuevo build nativo (APK)
  o basta con una actualización OTA.
- Yo reviso y apruebo el PR en GitHub. Al mergear a `main`, GitHub Actions
  publica automáticamente. No ejecutes `eas build` ni `eas update` a mano.
- Commits pequeños, en inglés, con prefijo convencional (`feat:`, `fix:`, `chore:`).
- Nunca subas secretos, tokens ni certificados de emparejamiento. Si detectas
  uno en el cambio, detente y avísame.
- Si un push falla o hay conflictos, resuélvelos tú y cuéntame qué pasó.
- Al terminar cada tarea dime en una línea qué subiste y el enlace del PR.
