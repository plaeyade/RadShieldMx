-- RadShield-MX F501-F504 regulatory/materials schema draft.
-- Review before applying to live MySQL. F501-F504 does not seed rows automatically.

CREATE TABLE IF NOT EXISTS regulatory_sources (
  id varchar(128) PRIMARY KEY,
  title text NOT NULL,
  authority varchar(32) NOT NULL,
  canonical_rank int NOT NULL DEFAULT 99,
  document_hash varchar(96) NOT NULL,
  page_ref varchar(128),
  review_state varchar(32) NOT NULL,
  allowed_uses varchar(255),
  notes text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_regulatory_sources_authority (authority),
  INDEX idx_regulatory_sources_review_state (review_state),
  INDEX idx_regulatory_sources_document_hash (document_hash)
);

CREATE TABLE IF NOT EXISTS material_constants (
  id varchar(128) PRIMARY KEY,
  name text NOT NULL,
  category varchar(48),
  manufacturer varchar(128),
  density_g_cm3 decimal(10,4),
  density_state varchar(32) NOT NULL,
  review_state varchar(32) NOT NULL,
  allowed_uses varchar(255),
  warnings text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_material_constants_category (category),
  INDEX idx_material_constants_review_state (review_state)
);

CREATE TABLE IF NOT EXISTS material_value_versions (
  id varchar(180) PRIMARY KEY,
  material_id varchar(128) NOT NULL,
  value_kind varchar(64) NOT NULL,
  energy_key varchar(48),
  value decimal(14,4),
  unit varchar(32),
  source_id varchar(128) NOT NULL,
  review_state varchar(32) NOT NULL,
  allowed_use varchar(64) NOT NULL,
  valid_from varchar(32),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_material_value_versions_material (material_id),
  INDEX idx_material_value_versions_source (source_id),
  INDEX idx_material_value_versions_kind_energy (value_kind, energy_key),
  INDEX idx_material_value_versions_review_state (review_state),
  CONSTRAINT fk_material_value_versions_material FOREIGN KEY (material_id) REFERENCES material_constants(id),
  CONSTRAINT fk_material_value_versions_source FOREIGN KEY (source_id) REFERENCES regulatory_sources(id)
);

CREATE TABLE IF NOT EXISTS material_source_links (
  material_id varchar(128) NOT NULL,
  source_id varchar(128) NOT NULL,
  allowed_use varchar(64) NOT NULL,
  review_state varchar(32) NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (material_id, source_id, allowed_use),
  INDEX idx_material_source_links_source (source_id),
  INDEX idx_material_source_links_review_state (review_state),
  CONSTRAINT fk_material_source_links_material FOREIGN KEY (material_id) REFERENCES material_constants(id),
  CONSTRAINT fk_material_source_links_source FOREIGN KEY (source_id) REFERENCES regulatory_sources(id)
);
