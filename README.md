# LogiTrack — Backend Spring Boot + Frontend HTML/CSS/JavaScript

Proyecto integrado construido a partir del código Java proporcionado. El frontend **consume endpoints REST reales**: no incluye datos inventados ni simulaciones de servidor.

## Requisitos

- Java 17 o superior compatible con Spring Boot 4.1.2.
- Maven instalado o el *Maven Wrapper* del proyecto, con acceso a las dependencias la primera vez.
- MySQL en ejecución.
- Visual Studio Code con la extensión **Live Server**.
- Navegador moderno (Chrome, Edge, Firefox).

## 1. Crear la base de datos

En MySQL, ejecuta (la primera vez):

```sql
CREATE DATABASE IF NOT EXISTS spmendoza
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

El backend usa por defecto `jdbc:mysql://localhost:3306/spmendoza`. Si la base de datos es otra, configura `DB_URL`. El valor `DB_DDL_AUTO=update` permite a Hibernate generar tablas en un entorno **local de desarrollo**. No ejecutes esta configuración sin revisión sobre bases productivas; allí conviene usar migraciones y `validate`.

## 2. Configurar las variables de entorno

Las credenciales no se encuentran incrustadas en el código entregado. Define una clave JWT secreta de **32 caracteres o más**, distinta de las contraseñas de los usuarios.

### Windows / PowerShell

En una terminal PowerShell abierta en la raíz del proyecto:

```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/spmendoza"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "CONTRASENA_REAL_DE_MYSQL"
$env:JWT_SECRET = "CLAVE_LARGA_UNICA_DE_MINIMO_32_CARACTERES"
$env:ADMIN_EMAIL = "administrador@empresa.com"
$env:ADMIN_PASSWORD = "CONTRASENA_SEGURA_ADMIN"
$env:ADMIN_NAME = "Administrador LogiTrack"
$env:DB_DDL_AUTO = "update"
.\mvnw.cmd spring-boot:run
```

### macOS / Linux

```bash
export DB_URL='jdbc:mysql://localhost:3306/spmendoza'
export DB_USERNAME='root'
export DB_PASSWORD='CONTRASENA_REAL_DE_MYSQL'
export JWT_SECRET='CLAVE_LARGA_UNICA_DE_MINIMO_32_CARACTERES'
export ADMIN_EMAIL='administrador@empresa.com'
export ADMIN_PASSWORD='CONTRASENA_SEGURA_ADMIN'
export ADMIN_NAME='Administrador LogiTrack'
export DB_DDL_AUTO='update'
./mvnw spring-boot:run
```

> Si tu proyecto ya tiene un administrador aprobado en MySQL, puedes omitir `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Cuando están configuradas, esas variables crean **una sola vez** el administrador en caso de que ese correo no exista. No cambian ni restablecen contraseñas de usuarios existentes. No compartas estas claves ni las subas a un repositorio público.

Si el Maven Wrapper no se ejecuta en tu equipo, utiliza Maven instalado: `mvn spring-boot:run`. Spring Boot escucha en `http://localhost:8080` de manera predeterminada. Puedes modificar el puerto con `--server.port=9090` o con `SERVER_PORT=9090`.

## 3. Abrir el frontend en Live Server

1. Abre el directorio `frontend` en VS Code.
2. Revisa `frontend/config.js`, donde están las variables globales:

   ```javascript
   window.BACKEND_HOST = 'localhost';
   window.BACKEND_PORT = 8080; // <--- CAMBIA AQUÍ EL PUERTO DEL BACKEND
   window.BACKEND_URL = '';    // URL completa opcional
   ```
3. Haz clic derecho sobre `frontend/index.html` y selecciona **Open with Live Server**.
4. Abre `http://127.0.0.1:5500/` (o `http://localhost:5500/`).
5. Inicia sesión con el administrador configurado en el paso 2.

**Importante:** el frontend siempre utiliza el puerto 5500 de Live Server; el puerto del backend es independiente. También puedes cambiar la URL del backend desde el botón **Conexión API** y restablecer la configuración de `config.js`. Un cambio guardado desde la interfaz tiene prioridad sobre `config.js` en ese navegador.

El backend original ya permite CORS desde `http://localhost:5500` y `http://127.0.0.1:5500` en `SecurityConfig.java`. Si decides servir el frontend desde otro puerto/origen, debes agregarlo también allí.

## 4. Registro, aprobación e inicio de sesión

1. Una persona selecciona **Crear cuenta**, registra nombre, correo y contraseña de al menos ocho caracteres.
2. `POST /auth/register` crea una cuenta con rol `USUARIO` y estado `PENDIENTE`.
3. El frontend comunica correctamente que el registro está pendiente; **no intenta iniciar sesión automáticamente**.
4. El administrador entra al módulo **Usuarios**, consulta los registros pendientes y presiona **Aprobar** (`PATCH /api/usuarios/{id}/aprobar`) o **Rechazar** (`PATCH /api/usuarios/{id}/rechazar`).
5. Después de la aprobación, el usuario inicia sesión con `POST /auth/login`. El frontend recibe `{ "token": "..." }`, lo conserva en `sessionStorage`, obtiene los datos reales desde `GET /auth/me` y añade `Authorization: Bearer ...` a las peticiones protegidas.
6. **Cerrar sesión** elimina el token; el token además tiene caducidad de 30 minutos configurada en el backend.

### Correcciones aplicadas al backend original

- En `UsuarioServiceImpl.guardar`, se corrigió la auditoría de registro público. El código original invocaba `auditoriaService.registrar` sin autenticación; esa rutina requiere el ID de un usuario autenticado y hacía fallar el registro. Los cambios posteriores de aprobación y rechazo permanecen auditados.
- Se incorporó `GET /auth/me` en `AuthController` para obtener el nombre, rol y estado del usuario autenticado, sin confiar en información escrita por el navegador.
- Se incorporó `AdminBootstrapConfig` para crear **opcionalmente** el primer administrador a partir de variables de entorno.
- Se eliminaron las credenciales incrustadas en `application.properties`; se sustituyeron por variables de entorno. Las bases nuevas se pueden inicializar con Hibernate en modo de desarrollo.

## 5. Módulos disponibles

| Módulo | Funcionalidades | Endpoints principales |
|---|---|---|
| Panel general | Tarjetas con indicadores, gráficos de stock y operaciones recientes | `GET /api/productos`, `/api/bodegas`, `/api/inventarios`, `/api/movimientos` |
| Productos | Consulta, búsqueda y CRUD para ADMIN | `/api/productos` |
| Bodegas | Consulta, búsqueda y CRUD para ADMIN | `/api/bodegas` |
| Ciudades | Consulta y CRUD para ADMIN | `/api/ciudades` |
| Marcas | Consulta y CRUD para ADMIN | `/api/marcas` |
| Inventario | Existencias por producto/bodega y alertas de bajo stock | `/api/inventarios` |
| Movimientos | Entradas, salidas, transferencias y consulta histórica | `/api/movimientos` |
| Reportes | Stock bajo, inventarios valorizados, productos más movidos, movimientos por fecha; descarga CSV de los reportes tabulares | `/api/reportes/*` |
| Usuarios | Aprobación, rechazo, actualización, listado y eliminación (ADMIN) | `/api/usuarios/*` |
| Auditoría | Consulta de trazabilidad de operaciones (ADMIN) | `/api/auditorias/*` |
| Explorador API | Listado de rutas y prueba manual por método, parámetros y JSON | Todos los endpoints localizados en los controladores |

La interfaz oculta acciones que requieren ADMIN, pero **el backend sigue siendo la autoridad final de permisos**. Las transferencias validan bodegas diferentes; la API hace las validaciones finales de cantidad y stock.

## 6. Estructura

```text
LogiTrack_Desarrollo/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── config.js                 # BACKEND_PORT global
│   └── js/
│       ├── api.js                # fetch, JWT, errores, puerto
│       └── app.js                # navegación, CRUD, reportes y UI
├── src/main/java/com/s2/LogiTrack/
│   ├── auth/AuthController.java
│   ├── config/AdminBootstrapConfig.java
│   └── ...                       # resto del backend original
├── src/main/resources/application.properties
├── tests/api-client.test.cjs
└── pom.xml
```

## 7. Comprobaciones y límites

- Ejecuta la prueba automatizada del cliente HTTP: `node tests/api-client.test.cjs`.
- Verifica la documentación del servidor desde `http://localhost:8080/swagger-ui/index.html` (ajusta el puerto si corresponde).
- Es necesario **tener MySQL y el backend levantados** para comprobar operaciones persistentes; abrir el HTML sin la API no crea ni modifica registros.
- El registro público no otorga privilegios administrativos. No se ha añadido recuperación de contraseña, ya que el backend proporcionado no incluye ese endpoint.
- `sessionStorage` mantiene la sesión mientras la pestaña esté abierta; para producción es recomendable revisar una política de autenticación con cookies HttpOnly, HTTPS, políticas CSP y control de expiración/renovación.

## 8. Problemas frecuentes

| Síntoma | Solución |
|---|---|
| `Failed to fetch` / No se pudo conectar | Revisa que Spring Boot esté ejecutándose y que `BACKEND_PORT` o la URL de conexión sean correctos. |
| Error de CORS | Usa `localhost:5500` o `127.0.0.1:5500` o amplía los orígenes permitidos de `SecurityConfig.java`. |
| `El usuario no está aprobado` | Pide al administrador aprobar el registro desde **Usuarios**. |
| `403 Forbidden` | El usuario carece de permisos ADMIN para esa operación. |
| MySQL `Access denied` | Verifica `DB_USERNAME` y `DB_PASSWORD`. |
| Fallo de configuración JWT | Configura `JWT_SECRET` con una clave de al menos 32 bytes antes de iniciar el servidor. |
| No hay administrador | Usa `ADMIN_EMAIL` y `ADMIN_PASSWORD` para crear uno en la primera ejecución. Si ese correo ya existe, el iniciador no lo modifica. |
