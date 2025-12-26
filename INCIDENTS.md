# Gestión de Incidentes - Vestimenta Catán

> Documento de gestión de incidentes conforme a ISO 9001:2015

## 1. Objetivo

Establecer el proceso para identificar, registrar, resolver y aprender de los incidentes que afectan al sistema Vestimenta Catán.

## 2. Alcance

Este procedimiento aplica a todos los incidentes relacionados con:
- Disponibilidad del sistema (caídas, lentitud)
- Integridad de datos (corrupción, pérdida)
- Seguridad (accesos no autorizados, vulnerabilidades)
- Funcionalidad (errores, comportamiento inesperado)

## 3. Definiciones

| Término | Definición |
|---------|------------|
| **Incidente** | Evento no planificado que interrumpe o degrada el servicio |
| **Problema** | Causa raíz de uno o más incidentes |
| **Workaround** | Solución temporal que restaura el servicio |
| **Post-mortem** | Análisis posterior al incidente para prevenir recurrencia |

## 4. Clasificación de Severidad

| Nivel | Nombre | Descripción | Tiempo Respuesta | Tiempo Resolución |
|-------|--------|-------------|------------------|-------------------|
| **P1** | Crítico | Sistema completamente caído, pérdida de datos, brecha de seguridad | < 15 min | < 4 horas |
| **P2** | Alto | Funcionalidad principal afectada (login, reservas, stock) | < 30 min | < 8 horas |
| **P3** | Medio | Funcionalidad secundaria afectada, degradación de performance | < 2 horas | < 24 horas |
| **P4** | Bajo | Inconveniente menor, error visual, mejora urgente | < 8 horas | < 72 horas |

### Ejemplos por Severidad

**P1 - Crítico:**
- Base de datos inaccesible
- API no responde
- Datos de usuarios expuestos
- Pérdida de registros de auditoría

**P2 - Alto:**
- Login/logout no funciona
- No se pueden crear reservas
- Stock muestra valores incorrectos
- Errores masivos en producción

**P3 - Medio:**
- Reportes no generan correctamente
- Lentitud general (>3s respuesta)
- Un módulo específico falla
- Errores intermitentes

**P4 - Bajo:**
- Error de UI/UX menor
- Typo en mensajes
- Feature request urgente
- Mejora de logs

## 5. Proceso de Gestión de Incidentes

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  DETECTAR   │───▶│  CLASIFICAR │───▶│  NOTIFICAR  │───▶│  RESOLVER   │───▶│ POST-MORTEM │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼                  ▼
  Monitoreo         Asignar            Comunicar          Workaround        Análisis
  Alertas           Severidad          Stakeholders       Fix definitivo    Mejoras
  Usuarios          Responsable        Actualizaciones    Verificar         Documentar
```

### 5.1 Detección

**Fuentes de detección:**
- Monitoreo automático (health checks, alertas)
- Reportes de usuarios
- Revisión de logs
- Pruebas de QA

**Canales de reporte:**
- GitHub Issues (preferido)
- Email directo al equipo
- Slack/Teams (si aplica)

### 5.2 Clasificación

1. Evaluar impacto en usuarios
2. Evaluar impacto en negocio
3. Asignar severidad según tabla
4. Designar responsable (owner)

### 5.3 Notificación

| Severidad | Notificar a |
|-----------|-------------|
| P1 | Todo el equipo + Gerencia inmediatamente |
| P2 | Equipo de desarrollo + PM |
| P3 | Desarrollador asignado + PM |
| P4 | Desarrollador asignado |

### 5.4 Resolución

1. **Contención**: Aplicar workaround si es posible
2. **Diagnóstico**: Identificar causa raíz
3. **Solución**: Implementar fix
4. **Verificación**: Confirmar resolución
5. **Cierre**: Documentar y cerrar ticket

### 5.5 Post-mortem

Obligatorio para incidentes P1 y P2. Debe completarse dentro de 5 días hábiles.

## 6. Matriz de Escalación

```
Tiempo sin resolución    Acción
─────────────────────────────────────
P1: > 1 hora            Escalar a Gerencia
P1: > 2 horas           Considerar rollback
P2: > 4 horas           Escalar a Lead
P2: > 8 horas           Escalar a Gerencia
P3: > 24 horas          Revisar prioridad
```

## 7. Registro de Incidentes

### Template de Registro

```markdown
## Incidente: [ID] - [Título breve]

**Fecha/Hora detección:** YYYY-MM-DD HH:MM
**Severidad:** P1/P2/P3/P4
**Estado:** Abierto | En progreso | Resuelto | Cerrado
**Responsable:** @usuario

### Descripción
[Qué está pasando]

### Impacto
[Quiénes y cómo están afectados]

### Timeline
- HH:MM - Evento detectado
- HH:MM - Acción tomada
- HH:MM - Resolución

### Causa raíz
[Por qué pasó - completar post-resolución]

### Solución aplicada
[Qué se hizo para resolver]

### Acciones preventivas
[Qué haremos para evitar que vuelva a pasar]
```

---

## 8. Historial de Incidentes

| ID | Fecha | Severidad | Título | Estado | Resolución |
|----|-------|-----------|--------|--------|------------|
| INC-001 | 2024-XX-XX | PX | [Descripción] | Cerrado | [Link al post-mortem] |

---

## 9. Template de Post-Mortem

```markdown
# Post-Mortem: [ID] - [Título]

**Fecha del incidente:** YYYY-MM-DD
**Duración:** X horas Y minutos
**Severidad:** P1/P2
**Autor:** @usuario
**Fecha del post-mortem:** YYYY-MM-DD

## Resumen Ejecutivo
[1-2 párrafos explicando qué pasó y el impacto]

## Timeline Detallado
| Hora | Evento |
|------|--------|
| HH:MM | Descripción del evento |

## Análisis de Causa Raíz

### ¿Qué pasó?
[Descripción técnica del fallo]

### ¿Por qué pasó?
[Usar técnica de los 5 "Por qué"]
1. ¿Por qué falló X? Porque Y
2. ¿Por qué Y? Porque Z
3. ...

### Factores contribuyentes
- [Factor 1]
- [Factor 2]

## Impacto

### Usuarios afectados
[Número y tipo de usuarios]

### Datos afectados
[Si hubo pérdida o corrupción]

### Impacto en negocio
[Reservas perdidas, tiempo de inactividad, etc.]

## Qué funcionó bien
- [Cosa positiva 1]
- [Cosa positiva 2]

## Qué podemos mejorar
- [Área de mejora 1]
- [Área de mejora 2]

## Acciones Correctivas

| Acción | Responsable | Fecha límite | Estado |
|--------|-------------|--------------|--------|
| [Acción 1] | @usuario | YYYY-MM-DD | Pendiente |
| [Acción 2] | @usuario | YYYY-MM-DD | Pendiente |

## Lecciones Aprendidas
[Resumen de lo aprendido para compartir con el equipo]
```

---

## 10. Métricas de Incidentes

### KPIs a Monitorear

| Métrica | Definición | Objetivo |
|---------|------------|----------|
| **MTTR** | Mean Time To Recovery | P1: <4h, P2: <8h |
| **MTTD** | Mean Time To Detect | <15 min |
| **Tasa de recurrencia** | Incidentes repetidos | <5% |
| **Incidentes/mes** | Total mensual | Tendencia descendente |

### Revisión Mensual

El equipo debe revisar mensualmente:
- Total de incidentes por severidad
- Tiempo promedio de resolución
- Incidentes recurrentes
- Efectividad de acciones preventivas

---

## 11. Contactos de Emergencia

| Rol | Nombre | Contacto | Disponibilidad |
|-----|--------|----------|----------------|
| Lead Developer | [Nombre] | [Email/Tel] | L-V 9-18 |
| DBA | [Nombre] | [Email/Tel] | L-V 9-18 |
| Gerencia | [Nombre] | [Email/Tel] | Emergencias |

---

## 12. Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2024-12-26 | Equipo Dev | Versión inicial |

---

*Este documento cumple con los requisitos de ISO 9001:2015 para la gestión de no conformidades y acciones correctivas.*
