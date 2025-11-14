-- Function to sync user metadata when addresses change
CREATE OR REPLACE FUNCTION sync_user_metadata_on_address_change()
RETURNS TRIGGER AS $$
DECLARE
  user_id_var UUID;
  primary_address RECORD;
  address_parts TEXT[];
  combined_address TEXT;
  current_metadata JSONB;
  updated_metadata JSONB;
BEGIN
  -- Get the user_id from the affected row
  IF TG_OP = 'DELETE' THEN
    user_id_var := OLD.user_id;
  ELSE
    user_id_var := NEW.user_id;
  END IF;

  -- Find primary address for this user
  SELECT * INTO primary_address
  FROM addresses 
  WHERE user_id = user_id_var 
    AND is_primary = true 
  LIMIT 1;

  -- If no primary address, get the most recent one
  IF primary_address IS NULL THEN
    SELECT * INTO primary_address
    FROM addresses 
    WHERE user_id = user_id_var 
    ORDER BY created_at DESC 
    LIMIT 1;
  END IF;

  -- Get current user metadata
  SELECT raw_user_meta_data INTO current_metadata
  FROM auth.users 
  WHERE id = user_id_var;

  -- If current_metadata is NULL, initialize it
  IF current_metadata IS NULL THEN
    current_metadata := '{}'::jsonb;
  END IF;

  -- Build address parts and combined address
  address_parts := ARRAY[]::TEXT[];
  
  IF primary_address IS NOT NULL THEN
    IF primary_address.address IS NOT NULL AND primary_address.address != '' THEN
      address_parts := array_append(address_parts, primary_address.address);
    END IF;
    IF primary_address.tambon IS NOT NULL AND primary_address.tambon != '' THEN
      address_parts := array_append(address_parts, primary_address.tambon);
    END IF;
    IF primary_address.district IS NOT NULL AND primary_address.district != '' THEN
      address_parts := array_append(address_parts, primary_address.district);
    END IF;
    IF primary_address.province IS NOT NULL AND primary_address.province != '' THEN
      address_parts := array_append(address_parts, primary_address.province);
    END IF;
    IF primary_address.postal_code IS NOT NULL AND primary_address.postal_code != '' THEN
      address_parts := array_append(address_parts, primary_address.postal_code);
    END IF;
    
    combined_address := array_to_string(address_parts, ' ');
    
    -- Update metadata with address information
    updated_metadata := current_metadata || jsonb_build_object(
      'address', combined_address,
      'address_detail', primary_address.address,
      'tambon', primary_address.tambon,
      'district', primary_address.district,
      'province', primary_address.province,
      'postal_code', primary_address.postal_code,
      'place', primary_address.place,
      'last_address_sync', NOW()
    );
  ELSE
    -- No addresses found, clear address fields
    updated_metadata := current_metadata || jsonb_build_object(
      'address', '',
      'address_detail', '',
      'tambon', '',
      'district', '',
      'province', '',
      'postal_code', '',
      'place', '',
      'last_address_sync', NOW()
    );
  END IF;

  -- Update user metadata
  UPDATE auth.users 
  SET raw_user_meta_data = updated_metadata,
      updated_at = NOW()
  WHERE id = user_id_var;

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT, UPDATE, DELETE on addresses table
DROP TRIGGER IF EXISTS trigger_sync_user_metadata_on_address_change ON addresses;

CREATE TRIGGER trigger_sync_user_metadata_on_address_change
  AFTER INSERT OR UPDATE OR DELETE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_metadata_on_address_change();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_user_metadata_on_address_change() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_metadata_on_address_change() TO service_role;
