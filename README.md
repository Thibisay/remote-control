# remote-control

App móvil (Android) que convierte tu celular en un control remoto para Android TV
a través de WiFi. El celular es el control; el TV es el dispositivo controlado.
No hay backend ni cuentas: toda la comunicación es directa por red local (LAN).

> **Estado:** proyecto desde cero. Se empieza por la configuración de Expo/EAS.

## Funcionalidades

Hoja de ruta, en orden de implementación:

1. Descubrir TVs en la red y emparejar con código
2. Navegación: D-pad, OK, atrás, home
3. Volumen, mute, encendido/apagado
4. Teclado para escribir texto en el TV
5. Abrir apps (Netflix, YouTube, etc.)
6. Guardar varios TVs

## Stack

- [Expo](https://expo.dev) (React Native) + TypeScript
- `expo-dev-client` (no funciona con Expo Go: se usan módulos nativos)
- EAS Build (genera el APK) y EAS Update (actualizaciones OTA de JS)
- GitHub Actions para CI/CD
- Protocolo Android TV Remote v2 (TLS + protobuf), descubrimiento por mDNS
- Almacenamiento local: `expo-secure-store` / AsyncStorage (certificado de
  emparejamiento y último TV)

## Arquitectura

- **Sin servidor.** Celular → TV directamente por LAN.
- **Capa de protocolo aislada de la UI** (`src/tv/`): descubrimiento,
  emparejamiento, conexión y envío de teclas. La UI solo consume una interfaz
  simple: `connect`, `sendKey`, `disconnect`.
- **Estados de conexión explícitos:** buscando, emparejando, conectado,
  desconectado, error.
- **Reconexión automática** al último TV guardado.

## Requisitos

- Celular Android y Android TV conectados a la **misma red WiFi**.
- Probar siempre en dispositivos reales; el emulador no representa bien la red
  local.

## Desarrollo

> La configuración del proyecto (Expo/EAS) aún está pendiente; esta sección se
> completará con los comandos reales cuando exista.

Perfiles de build previstos en `eas.json`:

| Perfil        | Uso                          |
| ------------- | ---------------------------- |
| `development` | Dev client                   |
| `preview`     | APK interno para pruebas     |
| `production`  | APK de producción            |

## CI/CD

Los cambios se publican automáticamente con GitHub Actions al integrarse en la
rama principal (`main`):

- **Solo JS/assets** → `eas update` (actualización OTA).
- **Cambios nativos** (dependencias nativas, permisos, `app.json` nativo) →
  `eas build` (APK Android, perfil `preview`/`production`).

Notas:

- El token de Expo (`EXPO_TOKEN`) vive en GitHub Secrets, nunca en el código.
- `runtimeVersion` se mantiene coherente para que las OTA solo lleguen a APKs
  compatibles.

## Flujo de contribución

- Una rama por tarea (`feat/...`, `fix/...`, `chore/...`) y Pull Request hacia
  `main`; no se sube directo.
- Commits pequeños, en inglés, con prefijo convencional (`feat:`, `fix:`,
  `chore:`).
- Cada PR indica qué cambió, por qué, y si requiere un nuevo build nativo (APK)
  o basta con una actualización OTA.

## Restricciones

- Android primero; iOS fuera de alcance por ahora.
- Sin cuentas ni nube: todo se queda en el dispositivo.
- Los secretos y certificados de emparejamiento nunca se suben al repositorio.
