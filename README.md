# Dashboard Dinámico de Flujo de Caja 📊💰

## 📝 Descripción del Proyecto

Este proyecto presenta un dashboard interactivo y dinámico diseñado para visualizar y analizar datos de flujo de caja (ingresos y gastos). Permite a los usuarios explorar sus finanzas a través de múltiples filtros, visualizaciones y períodos de tiempo, ofreciendo una visión clara del rendimiento financiero.

**Características Principales:**

* **Visualización de KPIs Clave:** Muestra métricas importantes como Ingresos Totales, Gastos Totales, Flujo Neto y Margen Neto.
* **KPIs Adicionales:** Incluye información sobre la categoría principal de gasto e ingreso, y el saldo final acumulado.
* **Filtrado Dinámico:** Permite filtrar transacciones por:
    * **Período:** Todo, Mensual, Trimestral, Anual.
    * **Año:** Selección específica o todos los años.
    * **Categoría:** Selección específica o todas las categorías.
    * **Descripción:** Búsqueda de texto libre (con debounce).
* **Gráficos Interactivos:** Presenta múltiples gráficos (barras, líneas, tarta/dona) que se actualizan según los filtros:
    * Ingresos vs Gastos (por período o total).
    * Proporción Ingresos/Gastos (total filtrado).
    * Tendencia del Flujo Neto (por período o anual en vista "Todo").
    * Distribución de Gastos por Categoría (total filtrado).
    * Distribución de Ingresos por Categoría (total filtrado).
    * Evolución del Saldo Acumulado.
* **Tabla Detallada:** Muestra una lista paginada y ordenada de las transacciones individuales que coinciden con los filtros.
* **Cambio de Tema:** Permite alternar entre modo Claro ☀️ y Oscuro 🌙, con persistencia usando `localStorage`.
* **Diseño Responsivo:** Adaptable a diferentes tamaños de pantalla (escritorio, tablet, móvil).

---

## 💻 Tecnologías Utilizadas

* **Frontend:**
    * ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) : Estructura semántica del dashboard.
    * ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) : Estilos personalizados y diseño visual.
    * ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) : Lógica principal, interactividad, manipulación del DOM, procesamiento de datos.
* **Frameworks / Librerías:**
    * ![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white) : Framework CSS para diseño responsivo y componentes UI.
    * ![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white) : Creación y actualización de gráficos interactivos.
    * ![Moment.js](https://img.shields.io/badge/Moment.js-2.30-5290A3?style=for-the-badge) : Manipulación, formato y parseo de fechas.
    * ![Font Awesome](https://img.shields.io/badge/Font_Awesome-6.x-528DD7?style=for-the-badge&logo=fontawesome&logoColor=white) : Iconografía.
* **Datos:**
    * `JSON` : Formato para cargar los datos de transacciones (`cashflow_data.json`).
* **Herramientas:**
    * Navegador Web con Herramientas de Desarrollador (para debugging).
    * Editor de Código (e.g., VS Code).

---

## ✨ Diseño y UI/UX

El diseño se enfoca en la claridad, usabilidad y estética moderna:

* **Interfaz Limpia:** Uso de Bootstrap para una estructura consistente y componentes familiares. Espaciado adecuado y jerarquía visual clara.
* **Visualización Efectiva:**
    * KPIs destacados para obtener información rápida.
    * Uso de gráficos apropiados para cada tipo de análisis (comparación, proporción, tendencia, distribución).
    * Colores consistentes (verde para ingresos/positivo, rojo para gastos/negativo) y paletas de colores para gráficos categóricos.
* **Interactividad:** Los filtros son fácilmente accesibles y proporcionan retroalimentación instantánea actualizando todas las visualizaciones relevantes.
* **Formato Condicional:** Se aplica formato (color, a veces grosor de fuente) a valores clave (Flujo Neto, Margen Neto, Saldo Acumulado) para resaltar rápidamente estados positivos, de advertencia o de riesgo.
* **Tema Claro/Oscuro:** Ofrece flexibilidad al usuario y mejora la accesibilidad en diferentes condiciones de iluminación. El tema se guarda localmente.
* **Responsividad:** El layout se adapta usando el grid de Bootstrap para asegurar una buena experiencia en dispositivos móviles y de escritorio.

---

## 🛠️ Técnicas y Lógica de Implementación

* **Carga Asíncrona de Datos:** Se utiliza `fetch` con `async/await` para cargar el archivo `cashflow_data.json` de forma no bloqueante.
* **Parseo y Validación de Datos:** Los datos JSON se validan al cargar: se verifica el formato de fecha con Moment.js (modo estricto), se convierten los montos a números y se validan los tipos de transacción. Los registros inválidos se descartan con una advertencia en consola.
* **Manipulación del DOM:** Se seleccionan elementos clave por ID y se actualiza su contenido (`textContent`) o estructura (`innerHTML` para la tabla) dinámicamente.
* **Gestión de Estado Simple:** Variables globales (`currentPeriodType`, `currentYearFilter`, etc.) mantienen el estado actual de los filtros.
* **Filtrado Centralizado:** La función `applyAllFilters` aplica secuencialmente los filtros de Año, Categoría y Descripción sobre el conjunto de datos completo (`allData`).
* **Agregación por Período:** La función `aggregateDataByPeriod` toma los datos ya filtrados por Y/C/D y los agrupa por mes, trimestre o año según `currentPeriodType`, calculando sumas de ingresos/gastos para cada período. Se utiliza Moment.js para determinar la clave y la fecha de inicio de cada período para una correcta ordenación.
* **Orquestación del Renderizado:** La función `filterAndRenderData` actúa como el controlador principal. Llama a `applyAllFilters`, luego (si es necesario) a `aggregateDataByPeriod`, y finalmente distribuye los datos correctos (`filteredByYCD` o `aggregatedData`) a todas las funciones de renderizado (`renderKPIs`, `renderTable`, `render...Chart`).
* **Renderizado Condicional de Gráficos (Vista "Todo"):**
    * `renderIncomeExpenseChart`: Muestra barras de totales generales si `currentPeriodType` es `all_periods`.
    * `renderNetCashflowTrendChart`: Muestra una tendencia anual si `currentPeriodType` es `all_periods`.
    * Otros gráficos muestran datos generales basados en `filteredByYCD`.
* **Actualización de Gráficos:** Se utiliza `destroyChart()` para eliminar instancias previas de Chart.js antes de crear una nueva, evitando problemas de memoria y renderizado.
* **Manejo de Eventos:** Se usan `addEventListener` para los cambios en los filtros (`change` para radios y selects, `input` para search) y clics (`click` para el toggle de tema).
* **Debounce:** Se aplica a la entrada de búsqueda de descripción para mejorar el rendimiento, evitando recálculos en cada pulsación de tecla.
* **Funciones Utilitarias:** `formatCurrency` para mostrar montos en formato EUR y `showNoDataMessage` para indicar cuándo no hay datos.

---

## 🤔 Análisis Resolutivo (Retos y Soluciones)

* **Reto:** Asegurar que *todas* las visualizaciones (KPIs, tabla, gráficos) se actualicen correctamente cuando *cualquier* filtro cambia.
    * **Solución:** Implementar una función central `filterAndRenderData` que se llama cada vez que un filtro cambia. Esta función sigue un flujo claro: filtrar por Y/C/D -> agregar por período (si aplica) -> llamar a todas las funciones de renderizado con los datos apropiados.
* **Reto:** Manejar la vista "Todo" de forma coherente en los diferentes gráficos. Algunos gráficos (como los de tarta o el acumulado) muestran naturalmente totales, pero otros (barras por período, tendencia por período) necesitaban una adaptación.
    * **Solución:**
        * KPIs: Muestran totales generales en modo "Todo", o el último período en otros modos.
        * Tabla: Muestra todas las transacciones filtradas por Y/C/D.
        * Gráfico Barras I/G: Muestra 2 barras (Total Ingreso, Total Gasto) en modo "Todo".
        * Gráfico Tendencia Flujo Neto: Muestra una tendencia *anual* en modo "Todo".
        * Otros gráficos (Tartas, Acumulado): Muestran datos basados en el total filtrado por Y/C/D.
* **Reto:** Evitar el parpadeo o renderizado incorrecto de los gráficos al actualizar datos.
    * **Solución:** Llamar siempre a `destroyChart()` antes de crear una nueva instancia de `Chart` en las funciones `render...Chart`.
* **Reto:** Fechas y períodos.
    * **Solución:** Uso intensivo de Moment.js para parsear fechas de forma estricta (`YYYY-MM-DD`), obtener claves de período (`YYYY-MM`, `YYYY-Q#`, `YYYY`), obtener etiquetas legibles (`MMMM YYYY`) y ordenar correctamente los períodos agregados usando `startDate.valueOf()`.
* **Reto:** Rendimiento del filtro de búsqueda por descripción.
    * **Solución:** Implementar una función `debounce` para retrasar la ejecución de `filterAndRenderData` hasta que el usuario deje de escribir por un breve momento (400ms).

---

## 🌱 Valor Educativo

Este proyecto es excelente para aprender y practicar:

* **Fundamentos Web:** HTML semántico, CSS moderno (incluyendo variables, Flexbox/Grid implícitos en Bootstrap), JavaScript (ES6+).
* **Manipulación del DOM:** Seleccionar, crear y modificar elementos HTML desde JavaScript.
* **Manejo de Eventos:** Capturar interacciones del usuario y responder a ellas.
* **JavaScript Asíncrono:** Uso de `fetch` y `async/await` para operaciones de red (carga de datos).
* **Procesamiento de Datos:** Trabajar con arrays y objetos, filtrar, mapear, reducir y agregar datos.
* **Integración de Librerías:** Incorporar y utilizar librerías populares como Chart.js (visualización), Moment.js (fechas) y Bootstrap (UI).
* **Desarrollo de UI Interactivas:** Crear interfaces que responden dinámicamente a las acciones del usuario.
* **Debugging:** Utilizar `console.log` y las herramientas del navegador para identificar y solucionar problemas.
* **Buenas Prácticas:** Modularización del código en funciones, uso de nombres de variables descriptivos, comentarios.

---

## 🚀 Configuración y Uso

1.  **Clonar o Descargar:** Obtén los archivos del proyecto (`index.html`, `script.js`, `style.css`, `cashflow_data.json`).
2.  **Colocar Archivos:** Asegúrate de que todos los archivos estén en la misma carpeta.
3.  **Abrir `index.html`:** Puedes abrir el archivo `index.html` directamente en tu navegador web. No se requiere un servidor local complejo ya que carga datos desde un JSON local.
4.  **Interactuar:** Utiliza los filtros en la barra de navegación para explorar tus datos. Cambia el tema si lo deseas.

*(Nota: Si modificas el código para cargar datos desde una API externa en lugar de un JSON local, podrías necesitar un servidor local debido a las políticas CORS del navegador).*

---

¡Explora tus finanzas! 🎉
