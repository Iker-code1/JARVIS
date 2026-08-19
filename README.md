# J.A.R.V.I.S.

Asistente de voz de escritorio con interfaz tipo HUD, escrito en Python y HTML.

**[Ver la demostración](https://TU-USUARIO.github.io/jarvis/)** ← cambia esta
dirección por la tuya cuando publiques el repositorio.

---

## Qué hay en este repositorio

Solo la **demostración de la interfaz**: una página suelta, sin servidor y sin
claves. El núcleo que se ve es el mismo código que corre en la versión
completa; la conversación es un guion.

## Qué hace la versión completa

- **Presenta tableros.** Abre un tablero de datos, lo recorre sección por
  sección y explica cada una en voz alta, señalando de qué habla.
- **Despierta con aplausos.** Escucha en segundo plano sin ninguna ventana a la
  vista. Dos palmadas y una frase, y da el informe del día.
- **Informe diario.** Archivos sin tocar, descargas recientes, pendientes,
  estado del equipo y correo sin leer.
- **Música.** Busca una canción y la reproduce; se baja sola mientras habla.
- **Memoria entre sesiones** y siete modos de carácter que cambian cómo
  trabaja, no solo cómo habla.
- **Modo gratis.** Resuelve las órdenes comunes leyendo el disco, sin llamar a
  ninguna API de pago. Cuando algo exige razonar de verdad, lo dice en vez de
  inventarse la respuesta.

## Por qué la versión completa no puede ser una página web

El trabajo de verdad lo hace un programa de Python en la computadora del
usuario. Es quien lee los archivos, abre los tableros, sintetiza la voz y
guarda la memoria. Una página en un servidor público no puede hacer nada de
eso, y para hablar con los servicios de voz e inteligencia artificial tendría
que llevar las claves dentro del propio archivo — a la vista de cualquiera.

Por eso aquí solo está la cara visible.

## Cómo se ve

La esfera se dibuja en un `<canvas>`: 1.650 puntos repartidos con una espiral
de Fibonacci, girados en tres dimensiones y proyectados en perspectiva. Lo que
hace que se lea como una esfera y no como una nube plana es el oscurecimiento
del borde — los puntos del canto se dibujan más tenues, igual que en una
fotografía del Sol.

Reacciona al sonido: mientras el asistente habla, la energía de los graves
mueve el pulso y las chispas.

## Técnica

- Sin dependencias ni compilación: HTML, CSS y JavaScript a secas.
- Un solo archivo de 21 KB.
- La versión completa usa Python sin librerías externas (solo biblioteca
  estándar) y un servidor local en el puerto 8765.

## Licencia

MIT.
