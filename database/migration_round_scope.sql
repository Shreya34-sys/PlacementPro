-- Run once against the placementpro_simulation database for an existing installation.
USE placementpro_simulation;
ALTER TABLE company_rounds
  ADD COLUMN round_scope ENUM('company','individual','both') NOT NULL DEFAULT 'company' AFTER module_type;

-- Existing company rounds default to 'company', preserving their current behavior.
