-- Tabla para usuarios de administración
CREATE TABLE IF NOT EXISTS usuarios (
  idUsuario INT NOT NULL AUTO_INCREMENT,
  rut VARCHAR(20) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(30) NOT NULL DEFAULT 'admin',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaActualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idUsuario),
  UNIQUE KEY uk_usuarios_rut (rut)
);

-- Usuario admin inicial (ajusta password antes de usar en producción)
INSERT INTO usuarios (rut, nombre, email, password, rol, activo)
VALUES ('13.056.521-2', 'Administrador', 'admin@admin.com', '218521', 'admin', 1)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  email = VALUES(email),
  password = VALUES(password),
  rol = VALUES(rol),
  activo = VALUES(activo);
