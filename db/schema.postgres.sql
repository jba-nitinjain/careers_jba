-- Careers portal tables (PostgreSQL). Safe to run repeatedly.
-- Times are stored in UTC as timestamp (without time zone).

CREATE TABLE IF NOT EXISTS applications (
  id                varchar(36)  PRIMARY KEY,
  submitted_at      timestamp    NOT NULL,
  position          varchar(40)  NOT NULL,
  full_name         varchar(200) NOT NULL,
  email             varchar(254) NOT NULL,
  mobile_number     varchar(20),
  admin_status      varchar(30)  NOT NULL DEFAULT 'new'
                    CHECK (admin_status IN ('new', 'rejected', 'called_for_interview', 'selected')),
  status_updated_at timestamp,
  data              text,        -- remaining form answers as JSON text
  resume_key        varchar(300),
  resume_name       varchar(150),
  resume_type       varchar(120),
  resume_size       integer,
  client_ip_hash    char(64),
  legacy_id         varchar(64) UNIQUE  -- Firestore id for records copied from Firebase
);

CREATE INDEX IF NOT EXISTS ix_applications_submitted_at ON applications (submitted_at DESC);
CREATE INDEX IF NOT EXISTS ix_applications_ip_recent ON applications (client_ip_hash, submitted_at);

-- Staff logins, used by eAccountsApp's password / WhatsApp OTP sign-in.
CREATE TABLE IF NOT EXISTS users (
  id            serial PRIMARY KEY,
  username      varchar(254) NOT NULL UNIQUE,
  password      varchar(255) NOT NULL,  -- hash; column name set by the eAccountsApp connection
  role          varchar(30)  NOT NULL DEFAULT 'admin',
  mobile        varchar(20),
  email         varchar(254),
  active        smallint     NOT NULL DEFAULT 1,
  created_at    timestamp    NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);
