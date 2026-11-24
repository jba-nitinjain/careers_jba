-- Careers portal tables (MySQL 8). Safe to run repeatedly.
-- Times are stored in UTC as DATETIME.

CREATE TABLE IF NOT EXISTS applications (
  id                CHAR(36)     NOT NULL PRIMARY KEY,
  submitted_at      DATETIME     NOT NULL,
  position          VARCHAR(40)  NOT NULL,
  full_name         VARCHAR(200) NOT NULL,
  email             VARCHAR(254) NOT NULL,
  mobile_number     VARCHAR(20)  NULL,
  admin_status      VARCHAR(30)  NOT NULL DEFAULT 'new',
  status_updated_at DATETIME     NULL,
  data              LONGTEXT     NULL COMMENT 'Remaining form answers as JSON text',
  resume_key        VARCHAR(300) NULL,
  resume_name       VARCHAR(150) NULL,
  resume_type       VARCHAR(120) NULL,
  resume_size       INT          NULL,
  client_ip_hash    CHAR(64)     NULL,
  legacy_id         VARCHAR(64)  NULL COMMENT 'Firestore id for records copied from Firebase',
  UNIQUE KEY uq_applications_legacy_id (legacy_id),
  KEY ix_applications_submitted_at (submitted_at),
  KEY ix_applications_ip_recent (client_ip_hash, submitted_at),
  CONSTRAINT ck_applications_status CHECK (admin_status IN ('new', 'rejected', 'called_for_interview', 'selected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff logins, used by eAccountsApp's password / WhatsApp OTP sign-in.
CREATE TABLE IF NOT EXISTS users (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30)  NOT NULL DEFAULT 'admin',
  mobile        VARCHAR(20)  NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
