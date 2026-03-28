---
trigger: always_on
---

1. Arquitectura de Interfaz: Diseño Atómico (Atomic Design)
Toda la UI debe construirse de lo más simple a lo más complejo para maximizar la reutilización.
•	Átomos: Componentes básicos e indivisibles (ej. <Button>, <Input>, <Label>, Colores, Tipografías). No deben tener lógica de negocio.
•	Moléculas: Grupos de átomos que funcionan juntos (ej. un campo de búsqueda: <Label> + <Input> + <Button>).
•	Organismos: Componentes complejos formados por moléculas y/o átomos (ej. <Header>, <Footer>, <CardGrid>).
•	Plantillas (Templates): Estructuras de alto nivel que definen el layout (ej. DashboardLayout). Se centran en la posición, no en el contenido real.
•	Páginas: Instancias reales de las plantillas con datos finales y lógica de estado.
2. Estándares de Calidad (Quality Assurance)
El código debe ser funcional, confiable y mantenible.
•	Pruebas Unitarias (Unit Testing): Cada lógica de negocio o componente crítico debe tener su test (ej. con Jest o Vitest). Cobertura mínima deseada: 70%.
•	Pruebas de Integración: Verificar que las moléculas y organismos interactúen correctamente con las APIs.
•	Code Review (Revisión por Pares): Ningún código llega a main sin ser revisado por otro desarrollador. Se busca legibilidad y detección de errores lógicos.
•	Observabilidad: Implementar logs claros para errores en producción (ej. Sentry o LogRocket).
•	Compatibilidad: Verificar el funcionamiento en los navegadores principales (Chrome, Safari, Firefox, Edge) y dispositivos móviles.
3. Estándares de Código (Clean Code)
•	Nombramiento: Variables en camelCase, clases en PascalCase. Nombres descriptivos y en inglés (recomendado para estandarización global).
•	SOLID: Aplicar los principios de desarrollo orientado a objetos/componentes para evitar código acoplado.
•	Format: Paso obligatorio de Linter/Prettier antes de cada commit.
4. Protocolo de Conservación del Contexto
•	Bitácora (ADR): Registro de decisiones técnicas en /docs/adr.
•	Etiquetas de Deuda: Uso estricto de // TODO: y // FIXME:.
•	Handoff: Nota de estado al finalizar la sesión indicando progreso y bloqueos.
5. Seguridad y Datos
•	Validación Doble: Inputs validados en cliente (UX) y servidor (Seguridad).
•	Gestión de Secretos: Uso estricto de .env. Prohibido subir credenciales al repo.
•	Cifrado: Uso obligatorio de HTTPS y hashing para datos sensibles.
6. Flujo de Git y Ágil
•	Ramas: Estructura feature/, fix/, refactor/. No tocar main directamente.
•	Conventional Commits: Mensajes claros tipo feat: add atomic button component.
•	Definición de Done (DoD): Código testeado, documentado y revisado.

