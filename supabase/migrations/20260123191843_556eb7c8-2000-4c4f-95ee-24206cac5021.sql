-- Paso 1: Agregar nuevo rol 'mesero_externo' al enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'mesero_externo';